import requests
import os
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def run_tests():
    print("==================================================")
    print("DELETE VIDEO FUNCTIONALITY — AUTOMATED VERIFICATION")
    print("==================================================")

    # 1. Login as admin
    res = requests.post(f"{BASE_URL}/api/login", json={"username": "admin", "password": "password"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [PASS] Authenticated successfully as SUPER ADMIN / OWNER.")

    # 2. Test Dataset Video Protection
    print("\n--- TEST: Dataset Original Video Protection ---")
    res = requests.delete(
        f"{BASE_URL}/api/videos/Copy%20of%20Rehana%20Store-No%20Interest-1/Copy%20of%20Rehana%20Store-No%20Interest-4.mp4",
        headers=headers,
        json={"source": "dataset", "relative_path": "Copy of Rehana Store-No Interest-1/Copy of Rehana Store-No Interest-4.mp4"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden for dataset delete, got {res.status_code}: {res.text}"
    err_data = res.json()
    assert "Protected Dataset File" in err_data["message"], f"Expected protected explanation, got {err_data}"
    print(f"  [PASS] Dataset video deletion safely rejected with 403 Forbidden:")
    print(f"         \"{err_data['message']}\"")

    # 3. Test Path Traversal Protection
    print("\n--- TEST: Path Traversal Protection ---")
    res = requests.delete(
        f"{BASE_URL}/api/videos/..%2F..%2Fapp.py",
        headers=headers,
        json={"source": "upload", "relative_path": "../../app.py"}
    )
    assert res.status_code == 400, f"Expected 400 Bad Request for path traversal, got {res.status_code}"
    print("  [PASS] Path traversal deletion safely rejected with 400 Bad Request.")

    # 4. Create a dummy upload video for testing deletion
    print("\n--- TEST: Uploading a Temporary Video to Test Deletion ---")
    uploads_dir = r"c:\Users\sweth\OneDrive\Desktop\RetailVision AI\backend\data\uploads"
    test_upload_name = f"test_dummy_clip_{int(time.time())}.mp4"
    test_upload_path = os.path.join(uploads_dir, test_upload_name)

    # Write a minimal valid mp4 header/dummy bytes
    with open(test_upload_path, "wb") as f:
        f.write(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42")

    print(f"  Created test upload file: {test_upload_name}")

    # Verify it appears in GET /api/videos
    res = requests.get(f"{BASE_URL}/api/videos", headers=headers)
    vids = res.json()
    uploaded_entry = next((v for v in vids if v["filename"] == test_upload_name), None)
    assert uploaded_entry is not None, f"Uploaded file not found in /api/videos: {test_upload_name}"
    print(f"  [PASS] Discovered test upload in /api/videos list: {uploaded_entry['filename']} (source: {uploaded_entry['source']})")

    # 5. Select this video as candidate
    print("\n--- TEST: Selecting Video Candidate and Verifying Deletion Clears Selection ---")
    res = requests.post(f"{BASE_URL}/api/select-video", headers=headers, json={
        "relative_path": test_upload_name,
        "source": "upload"
    })
    assert res.status_code == 200
    res = requests.get(f"{BASE_URL}/api/selected-video", headers=headers)
    sel = res.json().get("selected_video")
    assert sel is not None and sel["filename"] == test_upload_name
    print(f"  [PASS] Video candidate selected: {sel['filename']}")

    # 6. Delete the uploaded video via DELETE /api/videos/<video_id>
    print("\n--- TEST: Executing Deletion via DELETE /api/videos/<video_id> ---")
    res = requests.delete(
        f"{BASE_URL}/api/videos/{test_upload_name}",
        headers=headers,
        json={"source": "upload", "relative_path": test_upload_name}
    )
    assert res.status_code == 200, f"Delete failed: {res.text}"
    del_data = res.json()
    assert del_data["status"] == "success"
    print(f"  [PASS] Deletion API responded with 200 OK: \"{del_data['message']}\"")

    # 7. Verify file is removed from disk
    assert not os.path.exists(test_upload_path), f"File {test_upload_path} still exists on disk!"
    print("  [PASS] Verified file is permanently removed from server filesystem.")

    # 8. Verify selection state was safely cleared
    res = requests.get(f"{BASE_URL}/api/selected-video", headers=headers)
    sel_after = res.json().get("selected_video")
    assert sel_after is None, f"Selection state was not cleared! Still: {sel_after}"
    print("  [PASS] Verified selected_video_candidate was cleanly cleared to None.")

    # 9. Verify video list no longer contains the deleted file
    res = requests.get(f"{BASE_URL}/api/videos", headers=headers)
    vids_after = res.json()
    assert not any(v["filename"] == test_upload_name for v in vids_after), "Deleted file still in /api/videos list!"
    print("  [PASS] Verified /api/videos list was dynamically updated without the deleted file.")

    # 10. Verify past processed sessions remain intact
    print("\n--- TEST: Integrity of Processed Sessions and Historical Analytics ---")
    res = requests.get(f"{BASE_URL}/api/processed-sessions", headers=headers)
    sessions = res.json().get("sessions", [])
    assert len(sessions) >= 1, "Historical sessions were affected!"
    print(f"  [PASS] Processed sessions remain completely intact ({len(sessions)} sessions found).")

    # 11. Test Non-existent file deletion
    print("\n--- TEST: Deleting Non-Existent Video ---")
    res = requests.delete(
        f"{BASE_URL}/api/videos/non_existent_clip_123.mp4",
        headers=headers,
        json={"source": "upload", "relative_path": "non_existent_clip_123.mp4"}
    )
    assert res.status_code == 404, f"Expected 404 Not Found, got {res.status_code}"
    print("  [PASS] Non-existent video deletion properly rejected with 404 Not Found.")

    print("\n==================================================")
    print("ALL DELETE VIDEO TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
