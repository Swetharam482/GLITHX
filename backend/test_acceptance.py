import requests
import time
import os
import json

BASE_URL = "http://127.0.0.1:5000"

def run_tests():
    print("==================================================")
    print("STEP 1: Testing Authentication for all 4 Roles")
    print("==================================================")
    roles = [
        ("admin", "password", "SUPER ADMIN / OWNER"),
        ("store_manager", "password", "STORE MANAGER"),
        ("marketing_manager", "password", "MARKETING MANAGER"),
        ("operations_manager", "password", "OPERATIONS MANAGER")
    ]
    tokens = {}
    for user, pwd, expected_role in roles:
        res = requests.post(f"{BASE_URL}/api/login", json={"username": user, "password": pwd})
        assert res.status_code == 200, f"Login failed for {user}: {res.text}"
        data = res.json()
        assert data["status"] == "success", f"Status not success: {data}"
        assert data["user"]["role"] == expected_role, f"Expected {expected_role}, got {data['user']['role']}"
        tokens[user] = data["token"]
        print(f"  [PASS] {user} logged in successfully with role: {data['user']['role']}")

    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}

    print("\n==================================================")
    print("STEP 2: Testing Video Listing (Available Videos)")
    print("==================================================")
    res = requests.get(f"{BASE_URL}/api/videos", headers=admin_headers)
    assert res.status_code == 200, f"List videos failed: {res.text}"
    videos = res.json()
    print(f"  [PASS] Discovered {len(videos)} available videos in repository.")
    assert len(videos) >= 10, f"Expected at least 10 videos, found {len(videos)}"

    # Find the short test video: 'Copy of Rehana Store-No Interest-4.mp4'
    target_vid = None
    for v in videos:
        if "No Interest-4.mp4" in v["filename"]:
            target_vid = v
            break
    assert target_vid is not None, "Could not find No Interest-4.mp4 video in repository!"
    print(f"  Target test video selected: {target_vid['filename']} ({target_vid['size']})")

    print("\n==================================================")
    print("STEP 3: Selecting Single Video Candidate (No Auto-Process)")
    print("==================================================")
    res = requests.post(f"{BASE_URL}/api/select-video", headers=admin_headers, json={
        "relative_path": target_vid["relative_path"],
        "source": target_vid["source"]
    })
    assert res.status_code == 200, f"Select video failed: {res.text}"
    sel_data = res.json()
    assert sel_data["status"] == "success"
    print(f"  [PASS] Video candidate selected: {sel_data['selected_video']['filename']}")

    # Check confirmation endpoint
    res = requests.get(f"{BASE_URL}/api/selected-video", headers=admin_headers)
    curr_sel = res.json().get("selected_video")
    assert curr_sel["filename"] == target_vid["filename"]
    print(f"  [PASS] Confirmed selection via GET /api/selected-video: {curr_sel['filename']}")

    print("\n==================================================")
    print("STEP 4: Initiating Real Analysis for ONLY the Selected Video")
    print("==================================================")
    res = requests.post(f"{BASE_URL}/api/process-video", headers=admin_headers, json={})
    assert res.status_code == 200, f"Process video failed: {res.text}"
    proc_data = res.json()
    assert proc_data["status"] == "started"
    session_id = proc_data["session_id"]
    print(f"  [PASS] Processing started! Session ID: {session_id}")

    print("\n==================================================")
    print("STEP 5: Monitoring Real-Time CV Pipeline Progress")
    print("==================================================")
    start_poll = time.time()
    last_prog = -1
    while time.time() - start_poll < 120:
        res = requests.get(f"{BASE_URL}/api/processing-status/{session_id}", headers=admin_headers)
        status_info = res.json()
        status = status_info.get("status")
        prog = status_info.get("progress", 0)
        frames = status_info.get("processed_frames", 0)
        total_f = status_info.get("total_frames", 0)
        fps = status_info.get("fps", 0)

        if prog != last_prog:
            print(f"  Progress: {prog}% ({frames}/{total_f} frames, {fps} FPS, status: {status})")
            last_prog = prog

        if status == "completed":
            print(f"  [PASS] Processing completed successfully in {time.time() - start_poll:.1f}s!")
            break
        elif status == "failed":
            raise RuntimeError(f"Processing failed with error: {status_info.get('error')}")

        time.sleep(1.0)

    print("\n==================================================")
    print("STEP 6: Verifying Session Directory & Saved Artifacts")
    print("==================================================")
    processed_dir = os.path.join(r"c:\Users\sweth\OneDrive\Desktop\RetailVision AI\backend\data\processed", session_id)
    assert os.path.isdir(processed_dir), f"Directory {processed_dir} does not exist!"

    required_artifacts = [
        "processed_video.mp4",
        "tracking_data.csv",
        "dwell_time.csv",
        "shelf_report.csv",
        "customer_profiles.json",
        "store_heatmap.png",
        "blind_zone.png",
        "summary.json",
        "recommendations.json",
        "metadata.json"
    ]

    for art in required_artifacts:
        art_path = os.path.join(processed_dir, art)
        assert os.path.exists(art_path), f"Missing artifact in session dir: {art}"
        size = os.path.getsize(art_path)
        print(f"  [PASS] Artifact {art}: {size} bytes")

    # Read and verify metadata.json
    with open(os.path.join(processed_dir, "metadata.json")) as f:
        meta = json.load(f)
    print(f"  Session Metadata summary:")
    print(f"    - Session ID: {meta.get('session_id')}")
    print(f"    - Video: {meta.get('original_filename')}")
    print(f"    - Completed at: {meta.get('completion_time')}")
    print(f"    - Total Tracked Customers: {meta.get('total_customers')}")
    print(f"    - Blind Spot %: {meta.get('blind_spot_percentage')}%")
    print(f"    - Total Frames: {meta.get('total_frames')}")

    print("\n==================================================")
    print("STEP 7: Verifying Dashboard Returns Only This Session")
    print("==================================================")
    res = requests.get(f"{BASE_URL}/api/dashboard?session_id={session_id}", headers=admin_headers)
    assert res.status_code == 200
    db_data = res.json()
    assert db_data["active_session"] == session_id
    assert db_data["active_video"] == target_vid["filename"]
    assert db_data["kpis"]["total_customers"] == meta["total_customers"]
    print(f"  [PASS] Dashboard returns strictly active session data:")
    print(f"    - Active Video: {db_data['active_video']}")
    print(f"    - Tracked Customers: {db_data['kpis']['total_customers']}")
    print(f"    - Most Visited Zone: {db_data['kpis']['most_visited_zone']}")
    print(f"    - Least Visited Zone: {db_data['kpis']['least_visited_zone']}")
    print(f"    - Blind Spot %: {db_data['kpis']['blind_spot_percentage']}")

    print("\n==================================================")
    print("STEP 8: Confirming Other 9 Videos Were NOT Processed")
    print("==================================================")
    sessions_res = requests.get(f"{BASE_URL}/api/processed-sessions", headers=admin_headers)
    all_sessions = sessions_res.json().get("sessions", [])
    print(f"  Total processed sessions in repository: {len(all_sessions)}")
    for s in all_sessions:
        print(f"    - Session: {s.get('session_id')} -> {s.get('original_filename')}")
    assert len(all_sessions) == 1, f"Expected exactly 1 processed session, but found {len(all_sessions)}!"
    print("  [PASS] Confirmed: Only the single selected video was processed. 9 other repository videos remain untouched.")

    print("\n==================================================")
    print("ALL ACCEPTANCE CHECKS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
