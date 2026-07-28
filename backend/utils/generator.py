import cv2
import numpy as np
import os

def generate_demo_video(output_path):
    """
    Generates a realistic 30-second retail CCTV mockup video (1280x720, 30 FPS).
    Draws a layout of a retail store with shelves, aisles, and animated shoppers (blobs).
    """
    if os.path.exists(output_path):
        # Video already exists
        return True

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    width, height = 1280, 720
    fps = 30
    duration = 30  # seconds
    total_frames = fps * duration

    # Define video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    if not out.isOpened():
        print("Error: Could not open VideoWriter.")
        return False

    # Store layout elements
    shelves = [
        {"name": "Shelf A (Snacks)", "x1": 150, "y1": 150, "x2": 450, "y2": 250, "color": (139, 92, 246)},      # Purple
        {"name": "Shelf B (Beverages)", "x1": 550, "y1": 150, "x2": 850, "y2": 250, "color": (59, 130, 246)},    # Blue
        {"name": "Shelf C (Produce)", "x1": 150, "y1": 350, "x2": 450, "y2": 450, "color": (16, 185, 129)},     # Green
        {"name": "Shelf D (Bakery)", "x1": 550, "y1": 350, "x2": 850, "y2": 450, "color": (245, 158, 11)},      # Yellow
        {"name": "Checkout Counter", "x1": 950, "y1": 250, "x2": 1150, "y2": 450, "color": (239, 68, 68)}       # Red
    ]

    # Shopper paths (x, y coordinate sequences spanning 900 frames)
    # Each shopper has a start frame, end frame, current color, and a list of path nodes they visit.
    shoppers = [
        {
            "id": 101,
            "start": 0,
            "end": 800,
            "color": (0, 255, 255),  # Cyan
            "path": [
                (100, 100),       # Entrance
                (300, 200),       # Shelf A (Snacks) - spend time
                (300, 200),
                (700, 200),       # Shelf B (Beverages)
                (700, 200),
                (1050, 350),      # Checkout Counter
                (1050, 350),
                (100, 600)        # Exit
            ]
        },
        {
            "id": 102,
            "start": 100,
            "end": 900,
            "color": (255, 0, 255),  # Magenta
            "path": [
                (100, 100),       # Entrance
                (300, 400),       # Shelf C (Produce)
                (300, 400),
                (700, 400),       # Shelf D (Bakery)
                (700, 400),
                (100, 600)        # Exit directly (no purchase)
            ]
        },
        {
            "id": 103,
            "start": 200,
            "end": 850,
            "color": (0, 255, 0),    # Green
            "path": [
                (100, 100),       # Entrance
                (700, 200),       # Shelf B (Beverages)
                (700, 200),
                (700, 400),       # Shelf D (Bakery)
                (700, 400),
                (1050, 350),      # Checkout Counter
                (1050, 350),
                (100, 600)        # Exit
            ]
        },
        {
            "id": 104,
            "start": 50,
            "end": 750,
            "color": (255, 255, 0),  # Yellow
            "path": [
                (100, 100),       # Entrance
                (300, 200),       # Shelf A (Snacks)
                (300, 200),
                (700, 400),       # Shelf D (Bakery)
                (700, 400),
                (1050, 350),      # Checkout
                (100, 600)        # Exit
            ]
        },
        {
            "id": 105,
            "start": 300,
            "end": 900,
            "color": (0, 128, 255),  # Orange
            "path": [
                (100, 100),       # Entrance
                (300, 400),       # Shelf C (Produce)
                (300, 400),
                (1050, 350),      # Checkout
                (1050, 350),
                (100, 600)        # Exit
            ]
        }
    ]

    # Pre-generate coordinates for each frame for smooth interpolation
    for s in shoppers:
        s["coords"] = []
        path_points = s["path"]
        start_f = s["start"]
        end_f = s["end"]
        active_duration = end_f - start_f
        
        # We divide the active duration into segments for each node in the path
        segments = len(path_points) - 1
        frames_per_segment = active_duration // segments
        
        for i in range(segments):
            p1 = path_points[i]
            p2 = path_points[i+1]
            
            # Interpolate coordinates
            seg_len = frames_per_segment
            if i == segments - 1:
                # Add remainder frames to the last segment
                seg_len += active_duration % segments
                
            for f in range(seg_len):
                t = f / seg_len
                # Add some slight organic noise to simulate human walking
                noise_x = int(np.random.normal(0, 2))
                noise_y = int(np.random.normal(0, 2))
                
                # Check if customer is stationary at a shelf to browse
                # (if p1 == p2, they are browsing/dwelling)
                if p1 == p2:
                    # More random motion to look like standing in place
                    noise_x = int(np.random.normal(0, 4))
                    noise_y = int(np.random.normal(0, 4))
                    
                x = int((1 - t) * p1[0] + t * p2[0]) + noise_x
                y = int((1 - t) * p1[1] + t * p2[1]) + noise_y
                s["coords"].append((x, y))

    # Render frame by frame
    for f_idx in range(total_frames):
        # 1. Base dark background matching store aesthetics
        frame = np.ones((height, width, 3), dtype=np.uint8) * 15  # Dark gray base (RGB 15,15,15)
        
        # Draw dynamic grid pattern
        grid_size = 40
        for x in range(0, width, grid_size):
            cv2.line(frame, (x, 0), (x, height), (30, 30, 30), 1)
        for y in range(0, height, grid_size):
            cv2.line(frame, (0, y), (width, y), (30, 30, 30), 1)

        # 2. Draw Store Layout Labels and zones
        # Draw Entrance
        cv2.rectangle(frame, (30, 50), (150, 130), (0, 150, 0), -1)
        cv2.putText(frame, "ENTRANCE", (40, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        
        # Draw Exit
        cv2.rectangle(frame, (30, 550), (150, 630), (0, 0, 150), -1)
        cv2.putText(frame, "EXIT", (65, 595), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

        # Draw Shelves
        for shelf in shelves:
            color = shelf["color"]
            # Swap RGB to BGR for OpenCV
            color_bgr = (color[2], color[1], color[0])
            
            # Draw semi-transparent rectangle for shelves
            overlay = frame.copy()
            cv2.rectangle(overlay, (shelf["x1"], shelf["y1"]), (shelf["x2"], shelf["y2"]), color_bgr, -1)
            cv2.addWeighted(overlay, 0.4, frame, 0.6, 0, frame)
            
            # Draw shelf border
            cv2.rectangle(frame, (shelf["x1"], shelf["y1"]), (shelf["x2"], shelf["y2"]), color_bgr, 2)
            # Label
            cv2.putText(frame, shelf["name"], (shelf["x1"] + 10, shelf["y1"] - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

        # 3. Draw active shoppers
        for s in shoppers:
            start_f = s["start"]
            end_f = s["end"]
            
            if start_f <= f_idx < end_f:
                coord_idx = f_idx - start_f
                if coord_idx < len(s["coords"]):
                    cx, cy = s["coords"][coord_idx]
                    
                    # Draw a nice human avatar representation (shoppers)
                    # We will draw a head (circle) and body shape
                    color_bgr = (s["color"][2], s["color"][1], s["color"][0])
                    
                    # Head
                    cv2.circle(frame, (cx, cy - 15), 8, color_bgr, -1)
                    # Shoulder line
                    cv2.ellipse(frame, (cx, cy + 5), (15, 12), 0, 180, 360, color_bgr, -1)
                    
                    # ID text overlay above shopper
                    cv2.putText(frame, f"Person {s['id']}", (cx - 30, cy - 30), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)

        # 4. Draw security camera overlay details
        # Camera banner
        cv2.rectangle(frame, (0, 0), (width, 40), (20, 20, 20), -1)
        cv2.putText(frame, "CAM-03 LIVE FEED: CENTRAL REGION", (20, 25), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1, cv2.LINE_AA)
        
        # Red rec dot blinking
        if (f_idx // 15) % 2 == 0:
            cv2.circle(frame, (1230, 22), 6, (0, 0, 255), -1)
        cv2.putText(frame, "REC", (1245, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        
        # Frame stats overlay at the bottom
        cv2.rectangle(frame, (0, height - 40), (width, height), (20, 20, 20), -1)
        timestamp = f"Timestamp: 2026-07-22 09:55:{(f_idx // 30):02d} | Frame: {f_idx}/{total_frames} | FPS: 30.0"
        cv2.putText(frame, timestamp, (20, height - 15), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1, cv2.LINE_AA)

        out.write(frame)

    out.release()
    print(f"Success: Video saved to {output_path}")
    return True

if __name__ == "__main__":
    import sys
    path = "demo_retail.mp4"
    if len(sys.argv) > 1:
        path = sys.argv[1]
    generate_demo_video(path)
