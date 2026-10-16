from flask import Flask, jsonify, request, Response, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import time
import threading
import pandas as pd
import json
import numpy as np
import cv2
import secrets
import shutil
import hashlib
from functools import wraps

# Import utilities
from utils.detector import RetailDetector
from utils.analytics import generate_analytics_images
from utils.recommendations import generate_recommendations

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 250 * 1024 * 1024  # 250 MB max file upload
CORS(app)

# Define directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DATA_DIR = os.path.join(BASE_DIR, "data")
VIDEOS_DIR = os.path.join(DATA_DIR, "videos")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
SHELF_ZONES_PATH = os.path.join(DATA_DIR, "shelf_zones.json")
USERS_PATH = os.path.join(DATA_DIR, "users.json")
SETTINGS_PATH = os.path.join(DATA_DIR, "settings.json")

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# System global states
active_session_id = None
active_video_path = None
active_video_name = "None (No video analyzed)"
last_analyzed_at = None

# Candidate video explicitly selected for analysis
selected_video_candidate = None

# Video processing background state
processing_lock = threading.Lock()
current_processing_video = None
current_processing_session_id = None
processing_status = "idle"  # "idle", "processing", "completed", "failed"
processing_progress = 0
processing_fps = 0.0
processing_total_frames = 0
processing_processed_frames = 0
processing_error = None

# Global session cache for auth tokens
ACTIVE_SESSIONS = {}

# System Settings (with defaults)
system_settings = {
    "model_name": "yolov8n.pt",
    "confidence_threshold": 0.25,
    "frame_stride": 2,
    "blind_zone_threshold": 0,
    "store_name": "Rehana Retail Store - Central CCTV View",
    "camera_id": "CAM-01 (Ceiling High-Angle)"
}
if os.path.exists(SETTINGS_PATH):
    try:
        with open(SETTINGS_PATH, "r") as f:
            system_settings.update(json.load(f))
    except Exception as e:
        print(f"Error reading settings: {e}")

# Initialize detector
detector = RetailDetector(
    use_yolo=True,
    model_name=system_settings.get("model_name", "yolov8n.pt"),
    device="cpu",
    shelf_zones_path=SHELF_ZONES_PATH
)

# ----------------- SESSION HELPER FUNCTIONS -----------------
def safe_session_id(name):
    clean = "".join(c if c.isalnum() or c in ('-', '_') else '_' for c in name)
    return clean[:40]

def get_session_dir(session_id):
    if not session_id or '..' in session_id or '/' in session_id or '\\' in session_id:
        return None
    s_dir = os.path.join(PROCESSED_DIR, session_id)
    if os.path.isdir(s_dir):
        return s_dir
    return None

def list_all_processed_sessions():
    """Returns metadata for all completed processing sessions sorted newest first."""
    sessions = []
    if not os.path.exists(PROCESSED_DIR):
        return sessions

    for item in os.listdir(PROCESSED_DIR):
        s_dir = os.path.join(PROCESSED_DIR, item)
        if os.path.isdir(s_dir):
            meta_path = os.path.join(s_dir, "metadata.json")
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                        meta["is_active"] = (meta.get("session_id") == active_session_id)
                        sessions.append(meta)
                except Exception as e:
                    print(f"Error reading session meta for {item}: {e}")
    # Sort newest first by completion_time or start_time
    sessions.sort(key=lambda s: s.get("completion_time") or s.get("start_time") or "", reverse=True)
    return sessions

# On startup, auto-select latest valid session if available
try:
    existing_sessions = list_all_processed_sessions()
    if existing_sessions:
        for s in existing_sessions:
            if s.get("status") == "completed":
                active_session_id = s.get("session_id")
                active_video_name = s.get("original_filename", "CCTV Video")
                last_analyzed_at = s.get("completion_time")
                s_dir = os.path.join(PROCESSED_DIR, active_session_id)
                v_path = os.path.join(s_dir, "processed_video.mp4")
                if os.path.exists(v_path):
                    active_video_path = v_path
                print(f"Initialized active session to latest completed: {active_session_id} ({active_video_name})")
                break
except Exception as e:
    print(f"Notice: Session startup check: {e}")

# ----------------- AUTHENTICATION & RBAC -----------------
def load_users():
    if os.path.exists(USERS_PATH):
        try:
            with open(USERS_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading users: {e}")
    # Four required roles
    return {
        "admin": {
            "username": "admin",
            "password": "password",
            "role": "SUPER ADMIN / OWNER",
            "name": "Sarah Connor",
            "title": "Super Admin / Owner",
            "permissions": ["all"]
        },
        "store_manager": {
            "username": "store_manager",
            "password": "password",
            "role": "STORE MANAGER",
            "name": "Alex Stone",
            "title": "Store Operations Manager",
            "permissions": ["dashboard", "video_analysis", "detection", "tracking", "customer_journey", "heatmap", "shelf_analytics", "blind_zone", "recommendations", "reports"]
        },
        "marketing_manager": {
            "username": "marketing_manager",
            "password": "password",
            "role": "MARKETING MANAGER",
            "name": "Sarah Jenkins",
            "title": "Head of Retail Marketing",
            "permissions": ["dashboard", "customer_journey", "heatmap", "shelf_analytics", "blind_zone", "recommendations", "reports"]
        },
        "operations_manager": {
            "username": "operations_manager",
            "password": "password",
            "role": "OPERATIONS MANAGER",
            "name": "David Miller",
            "title": "Store Operations Lead",
            "permissions": ["dashboard", "video_analysis", "customer_journey", "heatmap", "shelf_analytics", "recommendations", "reports"]
        }
    }

def verify_password(stored_password, provided_password):
    if stored_password == provided_password:
        return True
    hashed = hashlib.sha256(provided_password.encode()).hexdigest()
    return stored_password == hashed

def get_current_user():
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    elif 'token' in request.args:
        token = request.args.get('token')
    
    if token and token in ACTIVE_SESSIONS:
        return ACTIVE_SESSIONS[token]
    return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Unauthorized. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"status": "error", "message": "Authentication required."}), 401
            user_role = user.get("role", "").upper()
            if "ADMIN" in user_role or "SUPER ADMIN / OWNER" in user_role or user_role in [r.upper() for r in allowed_roles]:
                return f(*args, **kwargs)
            return jsonify({"status": "error", "message": f"Access denied for role {user_role}. Required: {', '.join(allowed_roles)}"}), 403
        return decorated
    return decorator

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    
    users = load_users()
    if username in users and verify_password(users[username]['password'], password):
        user_info = users[username].copy()
        user_info.pop('password', None)
        token = secrets.token_hex(24)
        ACTIVE_SESSIONS[token] = user_info
        return jsonify({
            "status": "success",
            "token": token,
            "user": user_info
        })
    return jsonify({"status": "error", "message": "Invalid username or password"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    if token and token in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[token]
    return jsonify({"status": "success", "message": "Logged out successfully"})

@app.route('/api/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if user:
        return jsonify({"status": "success", "user": user})
    return jsonify({"status": "anonymous"}), 200

@app.route('/api/users', methods=['GET'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN"])
def get_users_list():
    users = load_users()
    user_list = []
    for k, v in users.items():
        u = v.copy()
        u.pop("password", None)
        user_list.append(u)
    return jsonify(user_list)

@app.route('/api/users/add', methods=['POST'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN"])
def add_user():
    data = request.json or {}
    username = data.get("username", "").strip().lower()
    password = data.get("password", "").strip()
    role = data.get("role", "STORE MANAGER").strip().upper()
    name = data.get("name", username)
    title = data.get("title", role)
    
    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required."}), 400
        
    users = load_users()
    users[username] = {
        "username": username,
        "password": password,
        "role": role,
        "name": name,
        "title": title,
        "permissions": ["dashboard", "reports"]
    }
    with open(USERS_PATH, "w") as f:
        json.dump(users, f, indent=4)
        
    return jsonify({"status": "success", "message": f"User {username} created successfully."})

# ----------------- VIDEO DATASET & SELECTION WORKFLOW -----------------
SUPPORTED_EXTENSIONS = ('.mp4', '.avi', '.mov', '.mkv')

@app.route('/api/videos', methods=['GET'])
def list_videos():
    """
    Returns available videos in repository and uploads.
    Separates available videos from currently selected or processed videos.
    """
    global selected_video_candidate
    video_list = []
    
    # 1. Dataset Videos
    if os.path.exists(VIDEOS_DIR):
        for root, _, files in os.walk(VIDEOS_DIR):
            for file in sorted(files):
                if file.lower().endswith(SUPPORTED_EXTENSIONS):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, VIDEOS_DIR).replace('\\', '/')
                    try:
                        size_bytes = os.path.getsize(full_path)
                        size_mb = f"{size_bytes / (1024 * 1024):.1f} MB"
                        is_sel = (selected_video_candidate and selected_video_candidate.get("relative_path") == rel_path)
                        video_list.append({
                            "filename": file,
                            "relative_path": rel_path,
                            "size": size_mb,
                            "source": "dataset",
                            "full_path": rel_path,
                            "is_selected": bool(is_sel)
                        })
                    except Exception:
                        pass

    # 2. Uploaded Videos
    if os.path.exists(UPLOADS_DIR):
        for file in sorted(os.listdir(UPLOADS_DIR)):
            if file.lower().endswith(SUPPORTED_EXTENSIONS):
                full_path = os.path.join(UPLOADS_DIR, file)
                try:
                    size_bytes = os.path.getsize(full_path)
                    size_mb = f"{size_bytes / (1024 * 1024):.1f} MB"
                    is_sel = (selected_video_candidate and selected_video_candidate.get("relative_path") == file)
                    video_list.append({
                        "filename": file,
                        "relative_path": file,
                        "size": size_mb,
                        "source": "upload",
                        "full_path": file,
                        "is_selected": bool(is_sel)
                    })
                except Exception:
                    pass

    return jsonify(video_list)

@app.route('/api/upload-video', methods=['POST'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN", "STORE MANAGER", "OPERATIONS MANAGER"])
def upload_video():
    """
    Uploads a video to data/uploads.
    Sets it automatically as the selected_video_candidate so the user can immediately review and click 'Analyze Video'.
    """
    global selected_video_candidate
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part in request"}), 400
        
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"status": "error", "message": "No file selected"}), 400

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return jsonify({"status": "error", "message": f"Unsupported file type ({ext}). Allowed: MP4, AVI, MOV, MKV"}), 400

    safe_name = f"{int(time.time())}_{filename}"
    target_path = os.path.join(UPLOADS_DIR, safe_name)
    file.save(target_path)

    size_mb = f"{os.path.getsize(target_path) / (1024 * 1024):.1f} MB"

    # Set as selected video candidate
    selected_video_candidate = {
        "filename": safe_name,
        "relative_path": safe_name,
        "source": "upload",
        "size": size_mb
    }

    # Extract reference frame 0
    try:
        cap_ref = cv2.VideoCapture(target_path)
        ret, frame0 = cap_ref.read()
        if ret and frame0 is not None:
            f0_resized = cv2.resize(frame0, (1280, 720))
            cv2.imwrite(os.path.join(STATIC_DIR, "reference_frame.jpg"), f0_resized)
        cap_ref.release()
    except Exception as e:
        print(f"Warning: could not extract reference frame: {e}")

    return jsonify({
        "status": "success",
        "message": "Video uploaded and selected for analysis.",
        "filename": safe_name,
        "relative_path": safe_name,
        "source": "upload",
        "size": size_mb,
        "selected_video": selected_video_candidate
    })

@app.route('/api/videos/<path:video_id>', methods=['DELETE'])
@app.route('/api/videos', methods=['DELETE'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN", "STORE MANAGER", "OPERATIONS MANAGER"])
def delete_video(video_id=None):
    """
    Safely deletes a video file.
    - UPLOAD videos: Validated and deleted from UPLOADS_DIR.
    - DATASET videos: Protected against permanent deletion to maintain benchmark repository integrity.
    - Processing videos: Prevented from deletion while active.
    - Selection state: Cleared if the deleted video was currently selected.
    """
    global selected_video_candidate, processing_status, current_processing_video

    data = request.json if request.is_json else {}
    rel_path = video_id or data.get('relative_path') or request.args.get('relative_path')
    source = data.get('source') or request.args.get('source', 'upload')

    if not rel_path:
        return jsonify({"status": "error", "message": "No video path specified for deletion."}), 400

    # Path traversal protection
    if ".." in rel_path or rel_path.startswith("/") or rel_path.startswith("\\"):
        return jsonify({"status": "error", "message": "Invalid file path traversal attempt."}), 400

    # Check if this video is currently being processed
    video_basename = os.path.basename(rel_path)
    if processing_status == "processing" and current_processing_video == video_basename:
        return jsonify({
            "status": "busy",
            "message": f"Cannot delete video '{video_basename}' while it is actively being analyzed. Please wait for processing to finish."
        }), 409

    # Handle DATASET videos: Protected from deletion
    if source == 'dataset':
        return jsonify({
            "status": "error",
            "message": "Protected Dataset File: Original CCTV repository dataset videos cannot be deleted from the server to protect benchmark data integrity. Only uploaded videos can be permanently deleted."
        }), 403

    # Handle UPLOAD videos
    if source == 'upload':
        safe_filename = secure_filename(video_basename)
        if not safe_filename:
            return jsonify({"status": "error", "message": "Invalid filename."}), 400

        full_path = os.path.abspath(os.path.join(UPLOADS_DIR, safe_filename))
        uploads_abs = os.path.abspath(UPLOADS_DIR)

        # Ensure target file stays strictly inside UPLOADS_DIR
        if not full_path.startswith(uploads_abs):
            return jsonify({"status": "error", "message": "File path is outside the designated upload directory."}), 400

        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({"status": "error", "message": f"Uploaded video '{safe_filename}' not found on server."}), 404

        try:
            os.remove(full_path)
        except Exception as e:
            return jsonify({"status": "error", "message": f"Failed to delete video file: {str(e)}"}), 500

        # If the deleted video was the currently selected candidate, clear it
        if selected_video_candidate and selected_video_candidate.get("relative_path") == safe_filename:
            selected_video_candidate = None

        return jsonify({
            "status": "success",
            "message": f"Video '{safe_filename}' deleted successfully.",
            "deleted_filename": safe_filename,
            "source": "upload"
        }), 200

    return jsonify({"status": "error", "message": f"Unknown video source: {source}"}), 400

@app.route('/api/select-video', methods=['POST'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN", "STORE MANAGER", "OPERATIONS MANAGER"])
def select_video():
    """
    Explicitly selects ONE video from the repository or uploads as candidate for analysis.
    Does NOT auto-process. Sets selected_video_candidate for user confirmation.
    """
    global selected_video_candidate
    data = request.json or {}
    rel_path = data.get('relative_path')
    source = data.get('source', 'dataset')

    if not rel_path:
        return jsonify({"status": "error", "message": "No video path specified"}), 400

    # Path safety
    if ".." in rel_path or rel_path.startswith("/"):
        return jsonify({"status": "error", "message": "Invalid file path traversal attempt"}), 400

    if source == 'upload':
        full_path = os.path.join(UPLOADS_DIR, os.path.basename(rel_path))
    else:
        full_path = os.path.join(VIDEOS_DIR, rel_path.replace('/', os.sep))

    if not os.path.exists(full_path):
        return jsonify({"status": "error", "message": f"Video file not found: {rel_path}"}), 404

    size_mb = f"{os.path.getsize(full_path) / (1024 * 1024):.1f} MB"
    selected_video_candidate = {
        "filename": os.path.basename(full_path),
        "relative_path": rel_path,
        "source": source,
        "size": size_mb,
        "full_path": full_path
    }

    # Extract reference frame 0 for region drawing
    try:
        cap_ref = cv2.VideoCapture(full_path)
        ret, frame0 = cap_ref.read()
        if ret and frame0 is not None:
            f0_resized = cv2.resize(frame0, (1280, 720))
            cv2.imwrite(os.path.join(STATIC_DIR, "reference_frame.jpg"), f0_resized)
        cap_ref.release()
    except Exception as e:
        print(f"Warning: could not extract reference frame: {e}")

    return jsonify({
        "status": "success",
        "message": f"Selected video: {selected_video_candidate['filename']}. Ready for analysis.",
        "selected_video": selected_video_candidate
    })

@app.route('/api/selected-video', methods=['GET'])
def get_selected_video():
    """Returns currently selected video candidate."""
    return jsonify({
        "selected_video": selected_video_candidate
    })

@app.route('/api/process-video', methods=['POST'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN", "STORE MANAGER", "OPERATIONS MANAGER"])
def process_video():
    """
    Processes ONLY the selected video candidate (or explicitly passed video) through the CV pipeline.
    Creates a dedicated session folder in backend/data/processed/<session_id>/.
    Prevents duplicate simultaneous processing.
    """
    global processing_status, current_processing_session_id, selected_video_candidate

    if processing_status == "processing":
        return jsonify({
            "status": "busy",
            "message": f"Another video ({current_processing_video}) is currently being analyzed. Please wait for completion."
        }), 409

    data = request.json or {}
    rel_path = data.get('relative_path') or (selected_video_candidate.get('relative_path') if selected_video_candidate else None)
    source = data.get('source') or (selected_video_candidate.get('source') if selected_video_candidate else 'dataset')

    if not rel_path:
        return jsonify({"status": "error", "message": "No video selected. Please select or upload a video first."}), 400

    if ".." in rel_path or rel_path.startswith("/"):
        return jsonify({"status": "error", "message": "Invalid file path traversal attempt"}), 400

    if source == 'upload':
        full_path = os.path.join(UPLOADS_DIR, os.path.basename(rel_path))
    else:
        full_path = os.path.join(VIDEOS_DIR, rel_path.replace('/', os.sep))

    if not os.path.exists(full_path):
        return jsonify({"status": "error", "message": f"Video file not found: {rel_path}"}), 404

    video_name = os.path.basename(full_path)
    clean_base = os.path.splitext(video_name)[0]
    safe_name = safe_session_id(clean_base)
    session_id = f"sess_{int(time.time())}_{safe_name}"
    session_dir = os.path.join(PROCESSED_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    # Launch background processing thread
    thread = threading.Thread(
        target=run_video_processing_pipeline,
        args=(full_path, video_name, session_id, session_dir, source, rel_path)
    )
    thread.daemon = True
    thread.start()

    return jsonify({
        "status": "started",
        "message": f"Analysis pipeline started for {video_name}",
        "session_id": session_id,
        "video_name": video_name
    })

@app.route('/api/processing-status', methods=['GET'])
@app.route('/api/processing-status/<session_id>', methods=['GET'])
def get_processing_status(session_id=None):
    global current_processing_video, current_processing_session_id, processing_status
    global processing_progress, processing_fps, processing_total_frames, processing_processed_frames, processing_error

    target_session = session_id or current_processing_session_id

    # If asking about an older session, check its metadata
    if session_id and session_id != current_processing_session_id:
        s_dir = get_session_dir(session_id)
        if s_dir:
            meta_path = os.path.join(s_dir, "metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    meta = json.load(f)
                    return jsonify({
                        "session_id": session_id,
                        "video_name": meta.get("original_filename"),
                        "status": meta.get("status", "completed"),
                        "progress": 100 if meta.get("status") == "completed" else 0,
                        "processed_frames": meta.get("processed_frames", 0),
                        "total_frames": meta.get("total_frames", 0),
                        "fps": meta.get("fps", 0),
                        "error": meta.get("error")
                    })

    return jsonify({
        "session_id": current_processing_session_id,
        "video_name": current_processing_video,
        "status": processing_status,
        "progress": processing_progress,
        "processed_frames": processing_processed_frames,
        "total_frames": processing_total_frames,
        "fps": round(processing_fps, 1),
        "error": processing_error
    })

# ----------------- PROCESSED SESSIONS & ACTIVE SESSION MANAGEMENT -----------------
@app.route('/api/processed-sessions', methods=['GET'])
def get_processed_sessions():
    """Lists all completed analysis sessions stored in backend/data/processed/."""
    sessions = list_all_processed_sessions()
    return jsonify({
        "total_sessions": len(sessions),
        "active_session_id": active_session_id,
        "sessions": sessions
    })

@app.route('/api/active-session', methods=['GET'])
def get_active_session():
    """Returns the currently active analysis session."""
    return jsonify({
        "active_session_id": active_session_id,
        "active_video_name": active_video_name,
        "last_analyzed_at": last_analyzed_at
    })

@app.route('/api/active-session', methods=['POST'])
@require_auth
def set_active_session():
    """Switches the active analysis session to a chosen historical session ID."""
    global active_session_id, active_video_name, last_analyzed_at, active_video_path
    data = request.json or {}
    req_session = data.get("session_id")

    if not req_session:
        return jsonify({"status": "error", "message": "No session_id provided"}), 400

    s_dir = get_session_dir(req_session)
    if not s_dir:
        return jsonify({"status": "error", "message": f"Session directory not found: {req_session}"}), 404

    meta_path = os.path.join(s_dir, "metadata.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                meta = json.load(f)
                active_session_id = req_session
                active_video_name = meta.get("original_filename", "CCTV Video")
                last_analyzed_at = meta.get("completion_time")
                v_path = os.path.join(s_dir, "processed_video.mp4")
                if os.path.exists(v_path):
                    active_video_path = v_path

                # Copy reference frame to static dir
                ref_s = os.path.join(s_dir, "reference_frame.jpg")
                if os.path.exists(ref_s):
                    shutil.copy(ref_s, os.path.join(STATIC_DIR, "reference_frame.jpg"))

                return jsonify({
                    "status": "success",
                    "message": f"Active session changed to {req_session}",
                    "active_session_id": active_session_id,
                    "active_video_name": active_video_name,
                    "last_analyzed_at": last_analyzed_at
                })
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    return jsonify({"status": "error", "message": "Session metadata missing"}), 404

@app.route('/api/processed-video/<session_id>', methods=['GET'])
def get_processed_video_file(session_id):
    """Serves the annotated MP4 video of a specific analysis session."""
    s_dir = get_session_dir(session_id)
    if not s_dir:
        return jsonify({"error": "Session not found"}), 404
    video_file = os.path.join(s_dir, "processed_video.mp4")
    if os.path.exists(video_file):
        return send_file(video_file, mimetype='video/mp4')
    return jsonify({"error": "Processed video file not found for this session"}), 404

@app.route('/api/session-image/<session_id>/<filename>', methods=['GET'])
def get_session_image(session_id, filename):
    """Serves image assets (heatmap, blind zone, reference frame) for a specific session."""
    s_dir = get_session_dir(session_id)
    if not s_dir:
        return jsonify({"error": "Session not found"}), 404

    safe_file = secure_filename(filename)
    img_path = os.path.join(s_dir, safe_file)
    if os.path.exists(img_path):
        mime = 'image/png' if safe_file.endswith('.png') else 'image/jpeg'
        return send_file(img_path, mimetype=mime)
    return jsonify({"error": f"Image {filename} not found for session {session_id}"}), 404

# ----------------- REAL CV PROCESSING ENGINE -----------------
def run_video_processing_pipeline(file_path, video_name, session_id, session_dir, source, rel_path):
    """
    Executes the real CV pipeline for ONE selected video:
    - Reads frames with OpenCV
    - Runs YOLOv8 person detection
    - ByteTrack tracking with frame-persistent IDs
    - Calculates real zone dwell time and customer coordinates
    - Exports annotated output video to session directory
    - Writes tracking_data.csv, dwell_time.csv, shelf_report.csv, customer_profiles.json,
      store_heatmap.png, blind_zone.png, summary.json, recommendations.json, and metadata.json
    - Marks session as active upon successful completion
    """
    global current_processing_video, current_processing_session_id, processing_status
    global processing_progress, processing_fps, processing_total_frames, processing_processed_frames
    global processing_error, active_video_path, active_video_name, last_analyzed_at, active_session_id, detector

    with processing_lock:
        current_processing_video = video_name
        current_processing_session_id = session_id
        processing_status = "processing"
        processing_progress = 0
        processing_processed_frames = 0
        processing_error = None
        start_time = time.time()
        start_time_str = time.strftime('%Y-%m-%d %H:%M:%S')

        print(f"\n=======================================================")
        print(f"STARTING SINGLE VIDEO ANALYSIS PIPELINE")
        print(f"Session ID : {session_id}")
        print(f"Video File : {video_name}")
        print(f"Source Path: {file_path}")
        print(f"Output Dir : {session_dir}")
        print(f"=======================================================\n")

        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            processing_status = "failed"
            processing_error = f"OpenCV could not open video file: {video_name}"
            # Write failed metadata
            with open(os.path.join(session_dir, "metadata.json"), "w") as f:
                json.dump({
                    "session_id": session_id,
                    "original_filename": video_name,
                    "source": source,
                    "relative_path": rel_path,
                    "start_time": start_time_str,
                    "completion_time": time.strftime('%Y-%m-%d %H:%M:%S'),
                    "status": "failed",
                    "error": processing_error
                }, f, indent=4)
            print(processing_error)
            return

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        orig_fps = cap.get(cv2.CAP_PROP_FPS)
        fps = orig_fps if orig_fps and orig_fps > 0 else 24.0
        processing_total_frames = total_frames

        # Output video writer in session folder
        out_video_path = os.path.join(session_dir, "processed_video.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(out_video_path, fourcc, int(fps), (1280, 720))

        # Fresh detector instance for this processing session
        active_detector = RetailDetector(
            use_yolo=True,
            model_name=system_settings.get("model_name", "yolov8n.pt"),
            device="cpu",
            shelf_zones_path=SHELF_ZONES_PATH
        )

        frame_stride = int(system_settings.get("frame_stride", 2))
        if total_frames <= 150:
            frame_stride = 1

        frame_idx = 0
        last_annotated = None
        ref_frame_saved = False

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Save frame 0 as reference frame in session folder
                if not ref_frame_saved and frame is not None:
                    f0_resized = cv2.resize(frame, (1280, 720))
                    cv2.imwrite(os.path.join(session_dir, "reference_frame.jpg"), f0_resized)
                    cv2.imwrite(os.path.join(STATIC_DIR, "reference_frame.jpg"), f0_resized)
                    ref_frame_saved = True

                # Process every Nth frame for performance; reuse annotation for intervening frames
                if frame_idx % frame_stride == 0 or last_annotated is None:
                    annotated_frame, info = active_detector.process_frame(frame, frame_idx, fps=fps, mode="tracking")
                    last_annotated = annotated_frame
                else:
                    annotated_frame = last_annotated

                out_writer.write(annotated_frame)
                frame_idx += 1
                processing_processed_frames = frame_idx
                processing_progress = min(99, int((frame_idx / max(1, total_frames)) * 100))

                elapsed = time.time() - start_time
                if elapsed > 0:
                    processing_fps = frame_idx / elapsed

            # Finalize open trajectories and active dwell sessions
            active_detector.finalize_video(frame_idx, fps=fps)

            out_writer.release()
            cap.release()

            # Save last annotated frame as thumbnail
            if last_annotated is not None:
                cv2.imwrite(os.path.join(session_dir, "current_frame.jpg"), last_annotated)
                cv2.imwrite(os.path.join(STATIC_DIR, "current_frame.jpg"), last_annotated)

            # Generate real reports, heatmaps, and blind zone visuals strictly in session_dir
            metrics = active_detector.save_reports(session_dir, session_dir, fps=fps)

            # Mirror to legacy STATIC_DIR / DATA_DIR for fallback compatibility
            try:
                shutil.copy(out_video_path, os.path.join(STATIC_DIR, "tracked_video.mp4"))
                for fname in ["store_heatmap.png", "blind_zone.png"]:
                    src = os.path.join(session_dir, fname)
                    if os.path.exists(src):
                        shutil.copy(src, os.path.join(STATIC_DIR, fname))
                for fname in ["tracking_data.csv", "dwell_time.csv", "shelf_report.csv", "customer_profiles.json", "recommendation.json"]:
                    src = os.path.join(session_dir, fname)
                    if os.path.exists(src):
                        shutil.copy(src, os.path.join(DATA_DIR, fname))
            except Exception as e:
                print(f"Notice: mirror sync: {e}")

            # Ensure recommendations.json exists
            rec_src = os.path.join(session_dir, "recommendation.json")
            rec_dst = os.path.join(session_dir, "recommendations.json")
            if os.path.exists(rec_src) and not os.path.exists(rec_dst):
                shutil.copy(rec_src, rec_dst)

            # Calculate shelf rankings for summary
            shelf_csv = os.path.join(session_dir, "shelf_report.csv")
            most_visited_shelf = "Walking Aisle"
            least_visited_shelf = "Walking Aisle"
            avg_dwell_sec = 0.0

            if os.path.exists(shelf_csv):
                try:
                    df_s = pd.read_csv(shelf_csv)
                    if not df_s.empty and "customer_count" in df_s.columns:
                        sorted_s = df_s.sort_values(by="customer_count", ascending=False)
                        if len(sorted_s) > 0:
                            most_visited_shelf = sorted_s.iloc[0].get("shelf_id", "Walking Aisle")
                            least_visited_shelf = sorted_s.iloc[-1].get("shelf_id", "Walking Aisle")
                except Exception:
                    pass

            dwell_csv = os.path.join(session_dir, "dwell_time.csv")
            if os.path.exists(dwell_csv):
                try:
                    df_d = pd.read_csv(dwell_csv)
                    if not df_d.empty and "dwell_time_seconds" in df_d.columns:
                        valid_d = df_d[df_d["dwell_time_seconds"] > 0]
                        if not valid_d.empty:
                            avg_dwell_sec = float(valid_d["dwell_time_seconds"].mean())
                except Exception:
                    pass

            completion_time_str = time.strftime('%Y-%m-%d %H:%M:%S')

            # Write summary.json
            summary_data = {
                "session_id": session_id,
                "video_name": video_name,
                "total_customers": metrics.get("total_customers", 0),
                "configured_shelves": len(active_detector.zones),
                "avg_dwell_time_sec": round(avg_dwell_sec, 1),
                "most_visited_shelf": most_visited_shelf,
                "least_visited_shelf": least_visited_shelf,
                "max_occupancy": active_detector.max_concurrent_occupancy,
                "blind_spot_percentage": round(float(metrics.get("blind_percentage", 0.0)), 1),
                "total_frames": total_frames,
                "processed_frames": frame_idx,
                "completed_at": completion_time_str
            }
            with open(os.path.join(session_dir, "summary.json"), "w") as f:
                json.dump(summary_data, f, indent=4)

            # Write metadata.json
            metadata_data = {
                "session_id": session_id,
                "original_filename": video_name,
                "source": source,
                "relative_path": rel_path,
                "start_time": start_time_str,
                "completion_time": completion_time_str,
                "duration_seconds": round(time.time() - start_time, 1),
                "status": "completed",
                "error": None,
                "total_frames": total_frames,
                "processed_frames": frame_idx,
                "fps": round(fps, 1),
                "processing_fps": round(processing_fps, 1),
                "model_name": system_settings.get("model_name", "yolov8n.pt"),
                "tracker": "ByteTrack",
                "total_customers": metrics.get("total_customers", 0),
                "avg_dwell_time_sec": round(avg_dwell_sec, 1),
                "blind_spot_percentage": round(float(metrics.get("blind_percentage", 0.0)), 1),
                "max_occupancy": active_detector.max_concurrent_occupancy,
                "most_visited_shelf": most_visited_shelf,
                "least_visited_shelf": least_visited_shelf,
                "artifacts": {
                    "video": "processed_video.mp4",
                    "tracking_csv": "tracking_data.csv",
                    "dwell_csv": "dwell_time.csv",
                    "shelf_csv": "shelf_report.csv",
                    "profiles_json": "customer_profiles.json",
                    "heatmap": "store_heatmap.png",
                    "blind_zone": "blind_zone.png",
                    "summary": "summary.json",
                    "recommendations": "recommendations.json"
                }
            }
            with open(os.path.join(session_dir, "metadata.json"), "w") as f:
                json.dump(metadata_data, f, indent=4)

            # Update system global states to this newly completed session
            detector = active_detector
            active_session_id = session_id
            active_video_path = out_video_path
            active_video_name = video_name
            last_analyzed_at = completion_time_str

            processing_progress = 100
            processing_status = "completed"

            print(f"ANALYSIS COMPLETED FOR SESSION {session_id}!")
            print(f"Total customers: {metrics.get('total_customers', 0)}, Blind spot: {metrics.get('blind_percentage', 0)}%\n")

        except Exception as e:
            out_writer.release()
            cap.release()
            processing_status = "failed"
            processing_error = str(e)
            print(f"Error during video processing: {e}")

            with open(os.path.join(session_dir, "metadata.json"), "w") as f:
                json.dump({
                    "session_id": session_id,
                    "original_filename": video_name,
                    "source": source,
                    "relative_path": rel_path,
                    "start_time": start_time_str,
                    "completion_time": time.strftime('%Y-%m-%d %H:%M:%S'),
                    "status": "failed",
                    "error": str(e)
                }, f, indent=4)

# ----------------- SESSION-AWARE DASHBOARD & ANALYTICS -----------------
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """
    Returns dashboard analytics strictly derived from ONE analysis session.
    Accepts ?session_id=<session_id> query parameter, defaulting to active_session_id.
    Never mixes old data, other videos, or demo fabrications.
    """
    req_session = request.args.get('session_id') or active_session_id
    shelf_zones = detector.zones

    # Check if a valid session folder exists
    s_dir = get_session_dir(req_session) if req_session else None

    if not s_dir:
        # No completed session available
        return jsonify({
            "status": "NO_ANALYSIS" if processing_status != "processing" else "PROCESSING",
            "message": "No completed video analysis available. Please select a video and click 'Analyze Video'." if processing_status != "processing" else "Analysis in progress...",
            "store_name": system_settings.get("store_name", "Rehana Retail Store"),
            "camera_id": system_settings.get("camera_id", "CAM-01"),
            "active_session": None,
            "active_video": "None (No video analyzed)",
            "last_analyzed_at": "Not Yet Analyzed",
            "processing_status": {
                "status": processing_status,
                "progress": processing_progress,
                "fps": round(processing_fps, 1),
                "video_name": current_processing_video,
                "session_id": current_processing_session_id
            },
            "kpis": {
                "total_customers": 0,
                "configured_shelves": len(shelf_zones),
                "avg_dwell_time_sec": 0.0,
                "avg_dwell_time_formatted": "0.0s",
                "most_visited_zone": "N/A (No video analyzed)",
                "least_visited_zone": "N/A (No video analyzed)",
                "max_occupancy": 0,
                "blind_spot_percentage": "0.0%"
            },
            "shelf_rankings": [],
            "traffic_distribution": [],
            "summary": {
                "high_traffic": {"title": "High Traffic Shelf", "shelf_name": "N/A", "summary": "No completed analysis available."},
                "low_traffic": {"title": "Low Traffic Zone", "shelf_name": "N/A", "summary": "No completed analysis available."}
            }
        })

    # Read files strictly from this session's folder
    meta_path = os.path.join(s_dir, "metadata.json")
    tracking_path = os.path.join(s_dir, "tracking_data.csv")
    dwell_path = os.path.join(s_dir, "dwell_time.csv")
    shelf_path = os.path.join(s_dir, "shelf_report.csv")
    rec_path = os.path.join(s_dir, "recommendation.json")

    meta = {}
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                meta = json.load(f)
        except Exception:
            pass

    session_video_name = meta.get("original_filename", "CCTV Video")
    session_completed_at = meta.get("completion_time", "Unknown")
    total_tracked_customers = meta.get("total_customers", 0)
    max_occupancy = meta.get("max_occupancy", 0)
    blind_spot_pct = meta.get("blind_spot_percentage", 0.0)
    avg_dwell_sec = meta.get("avg_dwell_time_sec", 0.0)

    # 1. Total unique customers verification from tracking_data.csv
    if os.path.exists(tracking_path):
        try:
            df_track = pd.read_csv(tracking_path)
            if "track_id" in df_track.columns:
                valid_tracks = df_track[df_track["track_id"] > 0]
                if not valid_tracks.empty:
                    total_tracked_customers = valid_tracks["track_id"].nunique()
        except Exception:
            pass

    # 2. Dwell Time verification
    if os.path.exists(dwell_path):
        try:
            df_dwell = pd.read_csv(dwell_path)
            if "dwell_time_seconds" in df_dwell.columns and len(df_dwell) > 0:
                valid_dwells = df_dwell[df_dwell["dwell_time_seconds"] > 0]
                if not valid_dwells.empty:
                    avg_dwell_sec = float(valid_dwells["dwell_time_seconds"].mean())
        except Exception:
            pass

    # 3. Shelf Analytics
    shelf_rankings = []
    zone_distributions = []
    most_visited_shelf = "Walking Aisle"
    least_visited_shelf = "Walking Aisle"

    if os.path.exists(shelf_path):
        try:
            df_shelf = pd.read_csv(shelf_path)
            if not df_shelf.empty and "customer_count" in df_shelf.columns:
                sorted_shelf = df_shelf.sort_values(by="customer_count", ascending=False)
                for idx, row in enumerate(sorted_shelf.to_dict('records')):
                    s_id = row.get("shelf_id")
                    count = row.get("customer_count", 0)
                    dwell = row.get("avg_dwell_time", 0.0)
                    pct = round((count / max(1, total_tracked_customers)) * 100, 1)

                    shelf_rankings.append({
                        "rank": idx + 1,
                        "shelf_id": s_id,
                        "visitors": count,
                        "avg_dwell_sec": dwell,
                        "percentage": pct
                    })
                    zone_distributions.append({
                        "zone": s_id,
                        "percentage": pct
                    })

                if len(shelf_rankings) > 0:
                    most_visited_shelf = shelf_rankings[0]["shelf_id"]
                    least_visited_shelf = shelf_rankings[-1]["shelf_id"]
        except Exception:
            pass

    response = {
        "status": "LIVE" if processing_status != "processing" else "PROCESSING",
        "store_name": system_settings.get("store_name", "Rehana Retail Store"),
        "camera_id": system_settings.get("camera_id", "CAM-01"),
        "active_session": req_session,
        "active_video": session_video_name,
        "last_analyzed_at": session_completed_at,
        "is_active_session": (req_session == active_session_id),
        "processing_status": {
            "status": processing_status,
            "progress": processing_progress,
            "fps": round(processing_fps, 1),
            "video_name": current_processing_video,
            "session_id": current_processing_session_id
        },
        "kpis": {
            "total_customers": total_tracked_customers,
            "configured_shelves": len(shelf_zones),
            "avg_dwell_time_sec": round(avg_dwell_sec, 1),
            "avg_dwell_time_formatted": f"{avg_dwell_sec / 60:.1f} min" if avg_dwell_sec >= 60 else f"{avg_dwell_sec:.1f}s",
            "most_visited_zone": most_visited_shelf,
            "least_visited_zone": least_visited_shelf,
            "max_occupancy": max_occupancy,
            "blind_spot_percentage": f"{blind_spot_pct:.1f}%"
        },
        "shelf_rankings": shelf_rankings,
        "traffic_distribution": zone_distributions,
        "summary": {
            "high_traffic": {
                "title": "High Traffic Shelf",
                "shelf_name": most_visited_shelf,
                "summary": f"{most_visited_shelf} recorded the highest shopper interaction density in this analyzed clip."
            },
            "low_traffic": {
                "title": "Low Traffic / Opportunity Zone",
                "shelf_name": least_visited_shelf,
                "summary": f"{least_visited_shelf} recorded minimal visits, representing potential underutilized retail space."
            }
        }
    }
    return jsonify(response)

@app.route('/api/analytics/<session_id>', methods=['GET'])
def get_session_analytics(session_id):
    """Direct session analytics endpoint."""
    s_dir = get_session_dir(session_id)
    if not s_dir:
        return jsonify({"error": f"Session {session_id} not found"}), 404
    # Proxy to get_dashboard_data with session_id
    with app.test_request_context(f'/api/dashboard?session_id={session_id}'):
        return get_dashboard_data()

@app.route('/api/person-detection', methods=['GET'])
def get_person_detection():
    """Returns detection metrics from the active or requested session's tracking data."""
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None
    tracking_path = os.path.join(s_dir, "tracking_data.csv") if s_dir else os.path.join(DATA_DIR, "tracking_data.csv")

    total_detections = 0
    timeline = []

    if os.path.exists(tracking_path):
        try:
            df = pd.read_csv(tracking_path)
            valid = df[df["track_id"] > 0]
            total_detections = len(valid)

            grouped = valid.groupby("track_id")
            for tid, group in grouped:
                first_row = group.iloc[0]
                sec = first_row.get("video_timestamp_sec", 0.0)
                zone = first_row.get("zone", "Walking Aisle")
                timeline.append({
                    "time": f"{int(sec // 60):02d}:{int(sec % 60):02d}",
                    "event": f"Shopper #{tid} entered camera field of view",
                    "zone": zone
                })
        except Exception:
            pass

    return jsonify({
        "camera_status": "ONLINE",
        "session_id": req_session,
        "total_detections": total_detections,
        "max_occupancy": detector.max_concurrent_occupancy,
        "detection_model": system_settings.get("model_name", "yolov8n.pt"),
        "confidence_threshold": system_settings.get("confidence_threshold", 0.25),
        "timeline": timeline[:25]
    })

@app.route('/api/tracking', methods=['GET'])
def get_tracking_data():
    """Returns tracking trajectories strictly from the selected session's customer_profiles.json."""
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None
    profiles_path = os.path.join(s_dir, "customer_profiles.json") if s_dir else os.path.join(DATA_DIR, "customer_profiles.json")

    profiles_list = []
    if os.path.exists(profiles_path):
        try:
            with open(profiles_path, "r") as f:
                data = json.load(f)
                for k, v in data.items():
                    path_str = " -> ".join(v.get("visited_zones", []))
                    if not path_str:
                        path_str = "Walking Aisle"
                    profiles_list.append({
                        "customer_id": v.get("customer_id", k).replace("Customer ", ""),
                        "trajectory": path_str,
                        "duration_sec": v.get("duration_seconds", 0.0),
                        "status": v.get("status", "Exited"),
                        "entry_sec": v.get("entry_video_sec", 0.0),
                        "exit_sec": v.get("exit_video_sec", 0.0)
                    })
        except Exception:
            pass
    return jsonify({
        "session_id": req_session,
        "total_unique_tracked": len(profiles_list),
        "customer_flow_history": profiles_list
    })

@app.route('/api/customer/<customer_id>', methods=['GET'])
def get_customer_profile(customer_id):
    """Retrieves full trajectory coordinates for an individual shopper in the active/requested session."""
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None
    profiles_path = os.path.join(s_dir, "customer_profiles.json") if s_dir else os.path.join(DATA_DIR, "customer_profiles.json")

    if os.path.exists(profiles_path):
        try:
            with open(profiles_path, "r") as f:
                data = json.load(f)
            for k in [f"Customer {customer_id}", customer_id]:
                if k in data:
                    return jsonify(data[k])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Shopper tracking ID not found"}), 404

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations_list():
    """Returns rule-based AI recommendations citing actual measured evidence from active session."""
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None
    rec_path = os.path.join(s_dir, "recommendation.json") if s_dir else os.path.join(DATA_DIR, "recommendation.json")

    if os.path.exists(rec_path):
        try:
            with open(rec_path, "r") as f:
                return jsonify(json.load(f))
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify([])

@app.route('/api/shelf/<path:shelf_id>', methods=['GET'])
def get_single_shelf_analytics(shelf_id):
    """Detailed analytics for a specific shelf in active session."""
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None
    shelf_path = os.path.join(s_dir, "shelf_report.csv") if s_dir else os.path.join(DATA_DIR, "shelf_report.csv")

    if os.path.exists(shelf_path):
        try:
            df = pd.read_csv(shelf_path)
            matches = df[df["shelf_id"].str.lower() == shelf_id.lower()]
            if not matches.empty:
                return jsonify(matches.iloc[0].to_dict())
        except Exception:
            pass
    return jsonify({"shelf_id": shelf_id, "customer_count": 0, "avg_dwell_time": 0.0, "engagement_score": 0})

# ----------------- SHELF REGION CONFIGURATION -----------------
@app.route('/api/shelf-zones', methods=['GET'])
def get_shelf_zones():
    if os.path.exists(SHELF_ZONES_PATH):
        try:
            with open(SHELF_ZONES_PATH, 'r') as f:
                return jsonify(json.load(f))
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({})

@app.route('/api/shelf-zones', methods=['POST'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN", "STORE MANAGER"])
def save_shelf_zones():
    data = request.json
    if not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Expected JSON dictionary of zones"}), 400

    try:
        with open(SHELF_ZONES_PATH, 'w') as f:
            json.dump(data, f, indent=4)
        detector.reload_zones(data)
        
        # Regenerate visual for active session if exists
        req_session = active_session_id
        s_dir = get_session_dir(req_session) if req_session else None
        if s_dir:
            generate_analytics_images(s_dir, s_dir, SHELF_ZONES_PATH)
        generate_analytics_images(DATA_DIR, STATIC_DIR, SHELF_ZONES_PATH)

        return jsonify({"status": "success", "message": f"{len(data)} shelf regions saved successfully."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/reference-frame', methods=['GET'])
def get_reference_frame():
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None
    if s_dir:
        p = os.path.join(s_dir, "reference_frame.jpg")
        if os.path.exists(p):
            return send_file(p, mimetype='image/jpeg')
    ref_path = os.path.join(STATIC_DIR, "reference_frame.jpg")
    if os.path.exists(ref_path):
        return send_file(ref_path, mimetype='image/jpeg')
    return jsonify({"error": "No reference frame available. Please select a video first."}), 404

# ----------------- REPORTS & EXPORT ENDPOINTS -----------------
@app.route('/api/report', methods=['GET'])
def download_report():
    report_type = request.args.get('type', 'tracking_csv')
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None

    # Base folder to pull reports from
    folder = s_dir if s_dir else DATA_DIR
    static_folder = s_dir if s_dir else STATIC_DIR

    if report_type == 'tracking_csv':
        p = os.path.join(folder, "tracking_data.csv")
        if os.path.exists(p):
            return send_file(p, as_attachment=True, download_name=f"retailvision_tracking_{req_session or 'latest'}.csv")
    elif report_type == 'shelf_csv':
        p = os.path.join(folder, "shelf_report.csv")
        if os.path.exists(p):
            return send_file(p, as_attachment=True, download_name=f"retailvision_shelf_analytics_{req_session or 'latest'}.csv")
    elif report_type == 'dwell_csv':
        p = os.path.join(folder, "dwell_time.csv")
        if os.path.exists(p):
            return send_file(p, as_attachment=True, download_name=f"retailvision_dwell_times_{req_session or 'latest'}.csv")
    elif report_type == 'video':
        p = os.path.join(folder, "processed_video.mp4")
        if not os.path.exists(p):
            p = os.path.join(STATIC_DIR, "tracked_video.mp4")
        if os.path.exists(p):
            return send_file(p, as_attachment=True, download_name=f"annotated_tracking_{req_session or 'latest'}.mp4")
    elif report_type == 'heatmap':
        p = os.path.join(static_folder, "store_heatmap.png")
        if not os.path.exists(p):
            p = os.path.join(STATIC_DIR, "store_heatmap.png")
        if os.path.exists(p):
            return send_file(p, as_attachment=True, download_name=f"store_movement_heatmap_{req_session or 'latest'}.png")
    elif report_type == 'blind_zone':
        p = os.path.join(static_folder, "blind_zone.png")
        if not os.path.exists(p):
            p = os.path.join(STATIC_DIR, "blind_zone.png")
        if os.path.exists(p):
            return send_file(p, as_attachment=True, download_name=f"blind_zone_coverage_{req_session or 'latest'}.png")

    return jsonify({"error": f"Report file for {report_type} not found for session {req_session}."}), 404

# ----------------- SETTINGS ENDPOINTS -----------------
@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(system_settings)

@app.route('/api/settings', methods=['POST'])
@require_auth
@require_role(["SUPER ADMIN / OWNER", "ADMIN"])
def update_settings():
    global system_settings
    data = request.json or {}
    system_settings.update(data)
    try:
        with open(SETTINGS_PATH, "w") as f:
            json.dump(system_settings, f, indent=4)
        return jsonify({"status": "success", "settings": system_settings})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ----------------- VIDEO STREAMING & PLAYBACK -----------------
@app.route('/api/video_feed')
def video_feed():
    """MJPEG stream generator for browser playback supporting ?session_id=."""
    req_session = request.args.get('session_id') or active_session_id
    s_dir = get_session_dir(req_session) if req_session else None
    
    def gen():
        feed_source = None
        if s_dir:
            cand = os.path.join(s_dir, "processed_video.mp4")
            if os.path.exists(cand):
                feed_source = cand

        if not feed_source and active_video_path and os.path.exists(active_video_path):
            feed_source = active_video_path
        if not feed_source:
            cand = os.path.join(STATIC_DIR, "tracked_video.mp4")
            if os.path.exists(cand):
                feed_source = cand

        if not feed_source or not os.path.exists(feed_source):
            img_path = os.path.join(STATIC_DIR, "reference_frame.jpg")
            if os.path.exists(img_path):
                with open(img_path, 'rb') as f:
                    b = f.read()
                while True:
                    yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + b + b'\r\n')
                    time.sleep(1.0)
            return

        cap = cv2.VideoCapture(feed_source)
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            _, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            frame_bytes = jpeg.tobytes()
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(1.0 / 24.0)

    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

# ----------------- SERVE STATIC ASSETS & FRONTEND -----------------
@app.route('/')
def serve_index():
    return send_from_directory(os.path.join(BASE_DIR, '..', 'frontend'), 'index.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(BASE_DIR, '..', 'frontend', 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(BASE_DIR, '..', 'frontend', 'js'), filename)

@app.route('/static/<path:filename>')
def serve_static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

if __name__ == '__main__':
    print("Starting RetailVision AI Backend on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=False)
