import cv2
import numpy as np
import os
import time
import pandas as pd
import json

# Try to import Ultralytics YOLO and Supervision
try:
    from ultralytics import YOLO
    import supervision as sv
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

from utils.recommendations import generate_recommendations
from utils.analytics import generate_analytics_images

class RetailDetector:
    def __init__(self, use_yolo=True, model_name="yolov8n.pt", device="cpu", shelf_zones_path=None):
        self.use_yolo = use_yolo and YOLO_AVAILABLE
        self.model_name = model_name
        self.device = device
        self.model = None
        self.tracker = None
        self.shelf_zones_path = shelf_zones_path

        # Locate model weights
        actual_model_path = self.model_name
        if not os.path.exists(actual_model_path):
            parent_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", self.model_name)
            if os.path.exists(parent_path):
                actual_model_path = parent_path
            else:
                root_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", self.model_name)
                if os.path.exists(root_path):
                    actual_model_path = root_path

        if self.use_yolo:
            try:
                self.model = YOLO(actual_model_path)
                self.tracker = sv.ByteTrack()
                print(f"RetailDetector initialized successfully with {actual_model_path} on {device}")
            except Exception as e:
                print(f"Error loading YOLO model ({actual_model_path}): {e}. Falling back to simulation.")
                self.use_yolo = False

        # Load shelf zones
        self.zones = self._load_shelf_zones()

        # Tracking state
        self.track_history = {}            # {track_id: [(cx, cy, frame_idx, video_ts)]}
        self.active_shelf_presence = {}    # {track_id: {zone_name: entry_frame}}
        self.shelf_dwell_seconds = {}      # {zone_name: [list of dwell durations in seconds]}
        self.shelf_unique_visitors = {}    # {zone_name: set(track_ids)}
        self.shelf_visit_counts = {}       # {zone_name: total visit entries}
        self.track_zone_chronology = {}    # {track_id: [chronological list of zones visited]}
        self.max_concurrent_occupancy = 0
        self.total_processed_frames = 0
        self.video_fps = 24.0

    def _load_shelf_zones(self):
        if self.shelf_zones_path and os.path.exists(self.shelf_zones_path):
            try:
                with open(self.shelf_zones_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading shelf zones: {e}")
        return {
            "Shelf A (Groceries & Oils)": {"x1": 50, "y1": 100, "x2": 430, "y2": 680, "color": "#F97316"},
            "Shelf B (Cleaning & Household)": {"x1": 680, "y1": 100, "x2": 1200, "y2": 680, "color": "#3B82F6"},
            "Central Walking Aisle": {"x1": 430, "y1": 120, "x2": 680, "y2": 680, "color": "#10B981"},
            "Back Endcap": {"x1": 400, "y1": 20, "x2": 700, "y2": 120, "color": "#8B5CF6"},
            "Front Checkout Approach": {"x1": 200, "y1": 600, "x2": 800, "y2": 720, "color": "#EC4899"}
        }

    def reload_zones(self, zones_dict=None):
        if zones_dict:
            self.zones = zones_dict
        else:
            self.zones = self._load_shelf_zones()

    def get_zone_at(self, x, y):
        """Finds which configured shelf region contains point (x, y)."""
        for name, box in self.zones.items():
            if box.get("x1", 0) <= x <= box.get("x2", 0) and box.get("y1", 0) <= y <= box.get("y2", 0):
                return name
        return "Walking Aisle"

    def _get_id_color(self, track_id):
        palette = [
            (249, 115, 22),   # #F97316 Orange
            (59, 130, 246),   # #3B82F6 Blue
            (16, 185, 129),   # #10B981 Green
            (139, 92, 246),   # #8B5CF6 Purple
            (236, 72, 153),   # #EC4899 Pink
            (14, 165, 233),   # #0EA5E9 Sky
            (245, 158, 11),   # #F59E0B Amber
            (99, 102, 241)    # #6366F1 Indigo
        ]
        rgb = palette[track_id % len(palette)]
        return (rgb[2], rgb[1], rgb[0])  # Convert to BGR for OpenCV

    def _calculate_speed(self, track_id, fps):
        history = self.track_history.get(track_id, [])
        if len(history) < 3:
            return 1.1
        p1 = history[-3]
        p2 = history[-1]
        dist_px = np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
        # Calibration: approx 150 px = 1 meter on ground plane
        meters = dist_px / 150.0
        frame_diff = max(1, p2[2] - p1[2])
        seconds = frame_diff / max(1.0, fps)
        speed = meters / max(0.01, seconds)
        return min(3.5, max(0.1, speed))

    def process_frame(self, frame, frame_idx, fps=24.0, mode="tracking"):
        """
        Processes a single video frame:
        - Detects people using YOLOv8
        - Tracks identities across frames with ByteTrack
        - Measures entry and dwell times in configured shelf regions
        - Annotates frame with bounding boxes, IDs, speeds, and trajectory trails
        """
        self.video_fps = fps
        self.total_processed_frames = max(self.total_processed_frames, frame_idx + 1)

        # Standardize working resolution to 1280x720
        h, w = frame.shape[:2]
        if w != 1280 or h != 720:
            working_frame = cv2.resize(frame, (1280, 720))
        else:
            working_frame = frame.copy()

        info = {
            "fps": round(fps, 1),
            "inference_time_ms": 0.0,
            "count": 0,
            "active_tracks": []
        }

        if self.use_yolo and self.model is not None:
            t0 = time.time()
            # Run YOLO person detection (class 0 = person)
            results = self.model(working_frame, classes=[0], imgsz=640, conf=0.25, verbose=False)[0]
            info["inference_time_ms"] = round((time.time() - t0) * 1000, 1)

            detections = sv.Detections.from_ultralytics(results)
            if mode == "tracking" and self.tracker is not None:
                detections = self.tracker.update_with_detections(detections)

            active_count = len(detections)
            info["count"] = active_count
            self.max_concurrent_occupancy = max(self.max_concurrent_occupancy, active_count)

            annotated_frame = working_frame.copy()

            for i, box in enumerate(detections.xyxy):
                x1, y1, x2, y2 = map(int, box[:4])
                # Ground foot coordinate represents shopper floor position
                cx = (x1 + x2) // 2
                cy = y2

                if hasattr(detections, "tracker_id") and detections.tracker_id is not None and len(detections.tracker_id) > i and detections.tracker_id[i] is not None:
                    track_id = int(detections.tracker_id[i])
                else:
                    track_id = i + 1

                confidence = float(detections.confidence[i]) if hasattr(detections, "confidence") and len(detections.confidence) > i else 0.85
                current_zone = self.get_zone_at(cx, cy)
                video_ts = frame_idx / max(1.0, fps)

                # Append to track history
                if track_id not in self.track_history:
                    self.track_history[track_id] = []
                    self.track_zone_chronology[track_id] = []
                    self.active_shelf_presence[track_id] = {}

                self.track_history[track_id].append((cx, cy, frame_idx, video_ts))

                # Update chronological zone visits (deduplicated sequence)
                if current_zone != "Walking Aisle":
                    if not self.track_zone_chronology[track_id] or self.track_zone_chronology[track_id][-1] != current_zone:
                        self.track_zone_chronology[track_id].append(current_zone)

                # Shelf presence & dwell time state transitions
                active_zones = list(self.active_shelf_presence[track_id].keys())
                for z in active_zones:
                    if z != current_zone:
                        # Exited zone: calculate dwell
                        entry_frame = self.active_shelf_presence[track_id].pop(z)
                        dwell_sec = max(0.5, (frame_idx - entry_frame) / max(1.0, fps))
                        if z not in self.shelf_dwell_seconds:
                            self.shelf_dwell_seconds[z] = []
                        self.shelf_dwell_seconds[z].append(dwell_sec)

                if current_zone != "Walking Aisle":
                    if current_zone not in self.active_shelf_presence[track_id]:
                        self.active_shelf_presence[track_id][current_zone] = frame_idx
                        # Increment unique visitors and visit count
                        if current_zone not in self.shelf_unique_visitors:
                            self.shelf_unique_visitors[current_zone] = set()
                            self.shelf_visit_counts[current_zone] = 0
                        self.shelf_unique_visitors[current_zone].add(track_id)
                        self.shelf_visit_counts[current_zone] += 1

                speed = self._calculate_speed(track_id, fps)
                color = self._get_id_color(track_id)

                if mode == "detection":
                    # Standard detection box
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (249, 115, 22), 2)
                    label = f"Person {confidence:.2f}"
                    cv2.putText(annotated_frame, label, (x1, max(20, y1 - 8)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (249, 115, 22), 1, cv2.LINE_AA)
                else:
                    # Multi-object tracking: ID label, zone, speed, trail
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)

                    # Info badge text
                    label = f"ID #{track_id} | {current_zone} | {speed:.1f} m/s"
                    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
                    cv2.rectangle(annotated_frame, (x1, max(0, y1 - th - 8)), (x1 + tw + 6, max(th + 8, y1)), (15, 23, 42), -1)
                    cv2.putText(annotated_frame, label, (x1 + 3, max(th + 2, y1 - 4)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.42, color, 1, cv2.LINE_AA)

                    # Draw footpoint & trajectory trail (last 30 points)
                    cv2.circle(annotated_frame, (cx, cy), 4, color, -1)
                    trail = self.track_history[track_id][-30:]
                    for pt_i in range(1, len(trail)):
                        cv2.line(annotated_frame, (trail[pt_i-1][0], trail[pt_i-1][1]), (trail[pt_i][0], trail[pt_i][1]), color, 2)

                info["active_tracks"].append({
                    "id": track_id,
                    "x": cx,
                    "y": cy,
                    "zone": current_zone,
                    "speed": speed,
                    "confidence": confidence
                })

            return annotated_frame, info

        else:
            # Fallback if YOLO not available
            annotated_frame = working_frame.copy()
            cv2.putText(annotated_frame, "YOLO engine offline - waiting for video feed", (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            return annotated_frame, info

    def finalize_video(self, total_frames, fps=24.0):
        """Closes out any open dwell presences at end of video playback."""
        for track_id, active_dict in self.active_shelf_presence.items():
            for z, entry_frame in active_dict.items():
                dwell_sec = max(0.5, (total_frames - entry_frame) / max(1.0, fps))
                if z not in self.shelf_dwell_seconds:
                    self.shelf_dwell_seconds[z] = []
                self.shelf_dwell_seconds[z].append(dwell_sec)
        self.active_shelf_presence.clear()

    def save_reports(self, data_dir, static_dir, fps=24.0):
        """
        Compiles and writes real analytical reports strictly from observed tracking data:
        - tracking_data.csv
        - dwell_time.csv
        - shelf_report.csv
        - customer_profiles.json
        - recommendations.json
        - store_heatmap.png & blind_zone.png
        """
        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(static_dir, exist_ok=True)

        # 1. Compile tracking_data.csv
        tracking_rows = []
        for track_id, history in self.track_history.items():
            for cx, cy, f_idx, video_ts in history:
                z = self.get_zone_at(cx, cy)
                tracking_rows.append({
                    "track_id": track_id,
                    "frame_idx": f_idx,
                    "x": cx,
                    "y": cy,
                    "video_timestamp_sec": round(video_ts, 2),
                    "zone": z
                })

        df_track = pd.DataFrame(tracking_rows if tracking_rows else [{"track_id": 0, "frame_idx": 0, "x": 0, "y": 0, "video_timestamp_sec": 0.0, "zone": "None"}])
        df_track.to_csv(os.path.join(data_dir, "tracking_data.csv"), index=False)

        # 2. Compile dwell_time.csv
        dwell_rows = []
        for zone_name, dwell_list in self.shelf_dwell_seconds.items():
            for dur in dwell_list:
                dwell_rows.append({
                    "zone": zone_name,
                    "dwell_time_seconds": round(dur, 1),
                    "interaction_type": "Active Browsing" if dur > 5.0 else "Passing Walkby"
                })

        df_dwell = pd.DataFrame(dwell_rows if dwell_rows else [{"zone": "None", "dwell_time_seconds": 0.0, "interaction_type": "None"}])
        df_dwell.to_csv(os.path.join(data_dir, "dwell_time.csv"), index=False)

        # 3. Compile shelf_report.csv
        shelf_agg = []
        for zone_name in self.zones.keys():
            if zone_name != "Walking Aisle":
                cust_set = self.shelf_unique_visitors.get(zone_name, set())
                visitor_count = len(cust_set)
                dwell_list = self.shelf_dwell_seconds.get(zone_name, [])
                avg_dwell = round(float(np.mean(dwell_list)), 1) if dwell_list else 0.0
                max_dwell = round(float(np.max(dwell_list)), 1) if dwell_list else 0.0
                engagement_score = min(100, int(avg_dwell * 6.5))

                shelf_agg.append({
                    "shelf_id": zone_name,
                    "customer_count": visitor_count,
                    "avg_dwell_time": avg_dwell,
                    "max_dwell_time": max_dwell,
                    "engagement_score": engagement_score
                })

        df_shelf = pd.DataFrame(shelf_agg)
        df_shelf.to_csv(os.path.join(data_dir, "shelf_report.csv"), index=False)

        # 4. Compile customer_profiles.json
        total_unique_custs = len(self.track_history)
        customer_profiles = {}
        for track_id, history in self.track_history.items():
            first_frame = history[0][2]
            last_frame = history[-1][2]
            duration_sec = round((last_frame - first_frame) / max(1.0, fps), 1)
            first_ts = round(history[0][3], 1)
            last_ts = round(history[-1][3], 1)
            chronology = self.track_zone_chronology.get(track_id, [])

            # Downsample trajectory points for JSON export
            trajectory_samples = [{"x": x, "y": y, "sec": round(ts, 1)} for x, y, f, ts in history[::4]]

            customer_profiles[f"Customer {track_id}"] = {
                "customer_id": f"Customer {track_id}",
                "entry_video_sec": first_ts,
                "exit_video_sec": last_ts,
                "duration_seconds": duration_sec,
                "visited_zones": chronology,
                "current_zone": self.get_zone_at(history[-1][0], history[-1][1]),
                "status": "Exited" if last_frame < self.total_processed_frames - 10 else "Inside",
                "trajectory": trajectory_samples
            }

        with open(os.path.join(data_dir, "customer_profiles.json"), "w") as f:
            json.dump(customer_profiles, f, indent=4)

        # 5. Generate Heatmap and Blind Spot Visualizations
        blind_pct = generate_analytics_images(data_dir, static_dir, self.shelf_zones_path)

        # 6. Generate Recommendations
        recs = generate_recommendations(df_shelf, df_dwell, blind_pct, total_unique_custs)
        with open(os.path.join(data_dir, "recommendation.json"), "w") as f:
            json.dump(recs, f, indent=4)

        print("RetailVision AI: Real analytics reports generated and exported successfully.")
        return {
            "total_customers": total_unique_custs,
            "blind_percentage": blind_pct,
            "max_occupancy": self.max_concurrent_occupancy
        }
