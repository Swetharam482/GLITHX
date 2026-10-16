import requests

BASE = 'http://127.0.0.1:5000'

def run():
    # 1. Login
    r = requests.post(f'{BASE}/api/login', json={'username':'admin','password':'password'})
    token = r.json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Test Path Traversal Protection
    r = requests.post(f'{BASE}/api/select-video', headers=headers, json={'relative_path':'../../etc/passwd', 'source':'dataset'})
    assert r.status_code == 400, f'Expected 400, got {r.status_code}'
    print('[PASS] Path traversal attack rejected with 400 Bad Request')

    # 3. Test Non-existent file
    r = requests.post(f'{BASE}/api/select-video', headers=headers, json={'relative_path':'non_existent_file.mp4', 'source':'dataset'})
    assert r.status_code == 404, f'Expected 404, got {r.status_code}'
    print('[PASS] Non-existent file rejected with 404 Not Found')

    # 4. Test Report CSV Download
    r = requests.get(f'{BASE}/api/report?type=tracking_csv', headers=headers)
    assert r.status_code == 200, f'Expected 200, got {r.status_code}'
    assert 'track_id' in r.text
    print(f'[PASS] Report download successful ({len(r.text)} bytes)')

    # 5. Test Active Session and Dashboard
    r = requests.get(f'{BASE}/api/dashboard', headers=headers)
    assert r.status_code == 200
    data = r.json()
    print(f"[PASS] Active dashboard video: {data['active_video']}, Shoppers: {data['kpis']['total_customers']}")

    # 6. Test Shelf details
    r = requests.get(f'{BASE}/api/shelf/Central%20Walking%20Aisle', headers=headers)
    assert r.status_code == 200
    print(f"[PASS] Shelf details: {r.json()}")
    print("\nALL EDGE CASE & SECURITY CHECKS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run()
