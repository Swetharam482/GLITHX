from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS

import os
import time
import threading
import pandas as pd
import json
import numpy as np
import cv2
import matplotlib.pyplot as plt

# Import utilities
from utils.generator import generate_demo_video
from utils.detector import RetailDetector
from utils.analytics import generate_analytics_images

app = Flask(__name__)
CORS(app) # Enable cross-origin resource sharing for frontend integration

# Define path configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DATA_DIR = os.path.join(BASE_DIR, "data")

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Global states
video_source_path = os.path.join(STATIC_DIR, "demo_retail.mp4")
detection_active = True
tracking_active = True
uploaded_video_processing = False
processing_progress = 0

# Active frame counters for video streams
frame_idx_det = 0
frame_idx_track = 0

# Initialize system
print("Initializing RetailVision AI Backend Server...")
print("1. Generating sample retail CCTV video...")
generate_demo_video(video_source_path)

print("2. Launching AI Retail Analytics Engine...")
detector = RetailDetector(use_yolo=True)

print("3. Pre-generating initial heatmaps & blind spot plots...")
generate_analytics_images(DATA_DIR, STATIC_DIR)
detector.save_reports(DATA_DIR, STATIC_DIR)

# Counter for dynamic customer increases (live effect)
live_customer_offset = 0
last_offset_update = time.time()

def update_live_metrics():
    """Modulates metrics dynamically over time to simulate a living retail space."""
    global live_customer_offset, last_offset_update
    now = time.time()
    if now - last_offset_update > 8:
        # Increment customer count gradually
        live_customer_offset += np.random.choice([-1, 0, 1, 2])
        if live_customer_offset < 0:
            live_customer_offset = 0
        last_offset_update = now

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    update_live_metrics()
    tracking = pd.read_csv(os.path.join(DATA_DIR, "tracking_data.csv"))
    total_cust = tracking["track_id"].nunique()
    dwell = pd.read_csv(os.path.join(DATA_DIR, "dwell_time.csv"))
    avg_dwell = dwell["dwell_time_seconds"].mean()
    shelf = pd.read_csv(os.path.join(DATA_DIR, "shelf_report.csv"))

    products_viewed = shelf["products_viewed"].sum()
    products_purchased = shelf["products_purchased"].sum()

    conversion = (products_purchased / products_viewed) * 100 if products_viewed > 0 else 0
    engagement = shelf["engagement_score"].mean()
    blind_pct = 6.2
    active_cams = 4

    # Build sparkline histories (simulated time-series logs)
    # Generate shifting window of 10 points
    np.random.seed(int(time.time() / 10))
    spark_cust = [int(x) for x in (np.random.normal(30, 5, 9).tolist() + [total_cust % 50 + 10])]
    spark_dwell = [round(x, 1) for x in (np.random.normal(2.5, 0.2, 9).tolist() + [avg_dwell])]
    spark_engage = [round(x, 1) for x in (np.random.normal(65, 3, 9).tolist() + [engagement])]
    spark_blind = [round(x, 1) for x in (np.random.normal(6.5, 0.2, 9).tolist() + [blind_pct])]
    spark_convert = [round(x, 1) for x in (np.random.normal(70, 2, 9).tolist() + [conversion])]
    spark_cams = [active_cams] * 10

    response = {
        "store_id": "Store 03 (Central Square)",
        "status": "LIVE",
        "connected_cameras": active_cams,
        "current_time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_updated": time.strftime("%H:%M:%S"),
        "kpis": {
            "total_customers": {
                "value": total_cust,
                "trend": "+8.4%",
                "trend_direction": "up",
                "sparkline": spark_cust
            },
            "avg_dwell_time": {
                "value": f"{avg_dwell:.1f} min",
                "trend": "+2.1%",
                "trend_direction": "up",
                "sparkline": spark_dwell
            },
            "shelf_engagement": {
                "value": f"{engagement:.1f}%",
                "trend": "+5.7%",
                "trend_direction": "up",
                "sparkline": spark_engage
            },
            "blind_spot_percentage": {
                "value": f"{blind_pct:.1f}%",
                "trend": "-1.2%",
                "trend_direction": "down",
                "sparkline": spark_blind
            },
            "conversion_rate": {
                "value": f"{conversion:.1f}%",
                "trend": "+3.2%",
                "trend_direction": "up",
                "sparkline": spark_convert
            },
            "active_cameras": {
                "value": active_cams,
                "trend": "Stable",
                "trend_direction": "stable",
                "sparkline": spark_cams
            }
        },
        "regions": {
            "high_traffic": {
                "title": "High Traffic Region",
                "customers": 184,
                "peak_hour": "14:00 - 15:00",
                "density": "High (88%)",
                "most_visited": "Shelf B (Beverages)",
                "summary": "Central aisle leading to beverages experiences continuous customer density peaks."
            },
            "low_traffic": {
                "title": "Low Traffic Region",
                "customers": 12,
                "idle_percentage": "85%",
                "low_engagement_areas": "Shelf C Corner",
                "blind_zones": "Rear Corridor Zone A",
                "neglected_regions": "Produce Backside Aisle",
                "summary": "Shelf C inner corner is frequently bypassed by shoppers exiting Shelf A."
            },
            "underperforming_shelf": {
                "title": "Underperforming Shelf",
                "shelf_number": "Shelf C (Produce)",
                "customer_interactions": 42,
                "products_viewed": 126,
                "engagement_rate": "24.1%",
                "recommendation_preview": "Rotate promotional signage & lower top shelves.",
                "summary": "Average dwell times at Shelf C indicate shoppers rarely interact with products."
            }
        }
    }

    return jsonify(response)

@app.route('/api/person-detection', methods=['GET'])
def get_person_detection():
    # Return detection summary stats
    latest_count = int(np.random.choice([2, 3, 4]))
    
    # Generate live timeline of events
    timeline = [
        {"time": time.strftime("%H:%M:%S", time.localtime(time.time() - 100)), "event": "Person 101 entered store", "zone": "Entrance"},
        {"time": time.strftime("%H:%M:%S", time.localtime(time.time() - 80)), "event": "Person 104 entered store", "zone": "Entrance"},
        {"time": time.strftime("%H:%M:%S", time.localtime(time.time() - 60)), "event": "Person 101 moved to Shelf A", "zone": "Shelf A (Snacks)"},
        {"time": time.strftime("%H:%M:%S", time.localtime(time.time() - 40)), "event": "Person 103 entered store", "zone": "Entrance"},
        {"time": time.strftime("%H:%M:%S", time.localtime(time.time() - 20)), "event": "Person 101 moved to Shelf B", "zone": "Shelf B (Beverages)"},
        {"time": time.strftime("%H:%M:%S", time.localtime(time.time() - 10)), "event": "Person 104 moved to Shelf D", "zone": "Shelf D (Bakery)"}
    ]
    
    return jsonify({
        "current_person_count": latest_count,
        "fps": 30.0,
        "detection_accuracy": "94.8%",
        "inference_time": "5.4 ms",
        "camera_status": "ONLINE",
        "max_persons_today": 8,
        "avg_persons_today": 4.2,
        "frames_processed": 84320,
        "timeline": timeline
    })

@app.route('/api/tracking', methods=['GET'])
def get_tracking():
    # Retrieve track analytics
    return jsonify({
        "total_tracked_customers": 342,
        "active_tracked_customers": 3,
        "exited_customers": 339,
        "average_tracking_time": "12.8 min",
        "reidentification_accuracy": "98.2%",
        "tracking_fps": 30.0,
        "customer_flow_history": [
            {
                "customer_id": 101,
                "trajectory": "Entrance -> Shelf A -> Shelf B -> Checkout -> Exit",
                "walking_speed": "1.2 m/s",
                "entry_time": "09:55:00",
                "exit_status": "Completed",
                "dwell_time": "14.2 min"
            },
            {
                "customer_id": 102,
                "trajectory": "Entrance -> Shelf C -> Shelf D -> Exit",
                "walking_speed": "1.4 m/s",
                "entry_time": "09:55:10",
                "exit_status": "Completed",
                "dwell_time": "8.5 min"
            },
            {
                "customer_id": 103,
                "trajectory": "Entrance -> Shelf B -> Shelf D -> Checkout -> Exit",
                "walking_speed": "1.1 m/s",
                "entry_time": "09:55:20",
                "exit_status": "Completed",
                "dwell_time": "13.8 min"
            }
        ]
    })

@app.route('/api/heatmap', methods=['GET'])
def get_heatmap_stats():
    # Returns heatmap floor plan metrics
    # Animated agents coordinates mapping
    # Returns moving coordinates synchronized with video loops (900 frames)
    # Floor plan coordinates for layout mapping
    # Shopper paths will cycle
    t_f = int((time.time() * 30) % 900)
    
    agents = []
    for shopper in detector.simulated_shoppers:
        coords = detector._get_sim_coords(shopper, t_f)
        if coords:
            cx, cy = coords
            agents.append({
                "id": shopper["id"],
                "x": cx,
                "y": cy,
                "zone": detector.get_zone_at(cx, cy),
                "speed": round(detector._calculate_speed(shopper["id"]), 1)
            })

    return jsonify({
        "hotspots": [
            {"zone": "Shelf B (Beverages)", "reason": "High dwell time (3.2m avg)", "density": 88},
            {"zone": "Checkout Counter", "reason": "Peak queues (4.1m avg)", "density": 92}
        ],
        "coldspots": [
            {"zone": "Shelf C Corner", "reason": "Structural occlusion", "density": 8},
            {"zone": "Rear Corridor", "reason": "No promotional display", "density": 4}
        ],
        "blindspots": [
            {"zone": "Behind Shelf C Aisle", "percentage": "4.2%"},
            {"zone": "Front Left Entrance Pillar", "percentage": "2.0%"}
        ],
        "active_agents": agents
    })

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    # Load from recommendation.json
    path = os.path.join(DATA_DIR, "recommendation.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify([])

@app.route('/api/shelf/<shelf_id>', methods=['GET'])
def get_shelf_details(shelf_id):
    # Returns details for interactive click events on the floor plan
    path = os.path.join(DATA_DIR, "shelf_report.csv")
    if os.path.exists(path):
        df = pd.read_csv(path)
        # Search by ID matches (e.g. Shelf A, Shelf B)
        matches = df[df["shelf_id"].str.contains(shelf_id, case=False)]
        if not matches.empty:
            row = matches.iloc[0].to_dict()
            # Add AI recommendations text
            with open(os.path.join(DATA_DIR, "recommendation.json"), "r") as f:
                recs = json.load(f)
            
            shelf_recs = [r["description"] for r in recs if shelf_id.lower() in r["type"].lower() or shelf_id.lower() in r["description"].lower()]
            row["ai_recommendations"] = shelf_recs if shelf_recs else ["Increase lighting visibility and place primary discount flyer near products."]
            return jsonify(row)
            
    return jsonify({
        "shelf_id": shelf_id,
        "customer_count": 48,
        "avg_dwell_time": 2.1,
        "max_dwell_time": 8.4,
        "products_viewed": 144,
        "products_purchased": 36,
        "conversion_rate": 25.0,
        "engagement_score": 55,
        "heatmap_score": 62,
        "ai_recommendations": ["Optimize product stacking. Place faster-moving stock items at chest level."]
    })

# Video streaming MJPEG engine
def frame_generator(mode):
    global video_source_path, detection_active, tracking_active
    
    cap = cv2.VideoCapture(video_source_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file: {video_source_path}")
        return

    frame_idx = 0
    while True:
        # Check stream stop state signals
        if mode == 'detection' and not detection_active:
            time.sleep(0.1)
            continue
        if mode == 'tracking' and not tracking_active:
            time.sleep(0.1)
            continue
            
        ret, frame = cap.read()
        if not ret:
            # Loop video
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            frame_idx = 0
            continue

        start_time = time.time()

        # Process frame
        annotated_frame, info = detector.process_frame(frame, frame_idx, mode=mode)
        frame_idx += 1

        # Encode to JPEG
        _, jpeg = cv2.imencode('.jpg', annotated_frame)
        frame_bytes = jpeg.tobytes()

        # Yield multipart header
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        # Limit framerate to approx 30 FPS taking into account process speed
        elapsed = time.time() - start_time
        sleep_time = max(0, (1.0 / 30.0) - elapsed)
        time.sleep(sleep_time)

    cap.release()

@app.route('/api/video_feed')
def video_feed():
    mode = request.args.get('mode', 'tracking') # 'detection' or 'tracking'
    return Response(frame_generator(mode),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/start-detection', methods=['POST'])
def start_detection():
    global detection_active
    detection_active = True
    return jsonify({"status": "started", "active": detection_active})

@app.route('/api/stop-detection', methods=['POST'])
def stop_detection():
    global detection_active
    detection_active = False
    return jsonify({"status": "stopped", "active": detection_active})

@app.route('/api/start-tracking', methods=['POST'])
def start_tracking():
    global tracking_active
    tracking_active = True
    return jsonify({"status": "started", "active": tracking_active})

@app.route('/api/stop-tracking', methods=['POST'])
def stop_tracking():
    global tracking_active
    tracking_active = False
    return jsonify({"status": "stopped", "active": tracking_active})

# Video uploads
@app.route('/api/upload-video', methods=['POST'])
def upload_video():
    global video_source_path, uploaded_video_processing, processing_progress
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        file_path = os.path.join(DATA_DIR, "uploaded_video.mp4")
        file.save(file_path)
        
        # Trigger background processing
        video_source_path = file_path
        thread = threading.Thread(target=run_offline_video_processing, args=(file_path,))
        thread.start()
        
        return jsonify({"status": "Processing initiated", "filename": file.filename})

def run_offline_video_processing(file_path):
    global uploaded_video_processing, processing_progress, video_source_path

    uploaded_video_processing = True
    processing_progress = 0

    cap = cv2.VideoCapture(file_path)

    if not cap.isOpened():
        uploaded_video_processing = False
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    out_path = os.path.join(STATIC_DIR, "tracked_video.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_path, fourcc, fps if fps > 0 else 30, (width, height))

    detector_offline = RetailDetector(use_yolo=True)

    frame_idx = 0

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        annotated, info = detector_offline.process_frame(
            frame,
            frame_idx,
            mode="tracking"
        )

        out.write(annotated)

        frame_idx += 1
        processing_progress = int((frame_idx / total_frames) * 100)

    out.release()
    cap.release()

    detector_offline.save_reports(DATA_DIR, STATIC_DIR)
    generate_analytics_images(DATA_DIR, STATIC_DIR)

    video_source_path = out_path
    uploaded_video_processing = False
    processing_progress = 100

    print("Offline video tracking processing complete!")

@app.route('/api/report', methods=['GET'])
def get_report():
    report_type = request.args.get('type', 'pdf') # 'pdf', 'tracking_csv', 'shelf_csv'
    
    if report_type == 'pdf':
        pdf_path = os.path.join(STATIC_DIR, "retailvision_report.pdf")
        # Compile beautiful Matplotlib PDF dynamically based on current tracking data
        generate_pdf_report_file(pdf_path)
        return send_from_directory(STATIC_DIR, "retailvision_report.pdf", as_attachment=True)
    elif report_type == 'tracking_csv':
        return send_from_directory(DATA_DIR, "tracking_data.csv", as_attachment=True)
    elif report_type == 'shelf_csv':
        return send_from_directory(DATA_DIR, "shelf_report.csv", as_attachment=True)
    else:
        return jsonify({"error": "Unknown report type"}), 400

def generate_pdf_report_file(output_pdf_path):
    """Generates a structured, publication-grade analytical report using Matplotlib savefig PDF."""
    plt.style.use('dark_background')
    fig = plt.figure(figsize=(8.5, 11), facecolor='#0f172a')
    
    # Title Banner
    fig.text(0.1, 0.92, "RETAILVISION AI - STORE ANALYTICS EXECUTIVE REPORT", color='#06b6d4', fontsize=16, fontweight='bold')
    fig.text(0.1, 0.89, f"Report generated on: {time.strftime('%Y-%m-%d %H:%M:%S')} | Target: Store 03", color='#94a3b8', fontsize=10)
    fig.text(0.1, 0.88, "-" * 90, color='#334155', fontsize=10)

    # Subplot 1: Heatmap thumbnail
    ax1 = fig.add_axes([0.1, 0.52, 0.8, 0.32], facecolor='#0f172a')
    heatmap_img = cv2.imread(os.path.join(STATIC_DIR, "store_heatmap.png"))
    if heatmap_img is not None:
        heatmap_img = cv2.cvtColor(heatmap_img, cv2.COLOR_BGR2RGB)
        ax1.imshow(heatmap_img)
        ax1.axis('off')
        ax1.set_title("STORE TRAFFIC OVERVIEW", color='#f8fafc', fontsize=11, fontweight='bold')
    
    # Subplot 2: Bar chart comparing Shelf performance
    ax2 = fig.add_axes([0.1, 0.18, 0.8, 0.28], facecolor='#1e293b')
    shelf_path = os.path.join(DATA_DIR, "shelf_report.csv")
    if os.path.exists(shelf_path):
        df = pd.read_csv(shelf_path)
        shelves = df["shelf_id"].tolist()
        counts = df["customer_count"].tolist()
        conversions = df["conversion_rate"].tolist()
        
        x = np.arange(len(shelves))
        width = 0.35
        
        rects1 = ax2.bar(x - width/2, counts, width, label='Shopper Visits', color='#3b82f6')
        rects2 = ax2.bar(x + width/2, conversions, width, label='Conversion Rate (%)', color='#10b981')
        
        ax2.set_ylabel('Performance Metric scale', color='#94a3b8')
        ax2.set_title('SHELF VISITS VS TRANSACTION CONVERSIONS', color='#f8fafc', fontsize=11, fontweight='bold')
        ax2.set_xticks(x)
        ax2.set_xticklabels(shelves, rotation=15, color='#e2e8f0')
        ax2.tick_params(colors='#94a3b8')
        ax2.legend(facecolor='#0f172a', edgecolor='none')
        ax2.grid(color='#334155', linestyle=':', alpha=0.3)
        
    # Bottom Footer Summary text
    summary_text = (
        "EXECUTIVE SUMMARY & INSIGHTS:\n"
        "1. Shelf B (Beverages) dominates store layout dwell metrics (avg 3.2m), followed closely by snacks.\n"
        "2. Structural pillars block visual line of sight to Shelf C produce area, causing a 6.2% blind spot.\n"
        "3. Recommended Action: Relocate seasonal beverage specials to Shelf C to draw visitor density vectors.\n"
        "4. Checkout queue bottlenecks peak between 16:00 and 18:00; recommend dynamic Lane 2 deployment."
    )
    fig.text(0.1, 0.04, summary_text, color='#f8fafc', fontsize=10, fontname='monospace',
             bbox=dict(facecolor='#1e293b', alpha=0.9, edgecolor='#06b6d4', boxstyle='round,pad=0.5'))

    plt.savefig(output_pdf_path, format="pdf", facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()

# Serve Frontend Assets
@app.route('/')
def serve_index():
    return send_from_directory(os.path.join(BASE_DIR, '..', 'frontend'), 'index.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(BASE_DIR, '..', 'frontend', 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(BASE_DIR, '..', 'frontend', 'js'), filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(BASE_DIR, '..', 'frontend', 'assets'), filename)

if __name__ == '__main__':
    # Start server
    app.run(host='127.0.0.1', port=5000, debug=False)
