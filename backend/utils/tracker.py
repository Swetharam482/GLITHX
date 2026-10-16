"""
RetailVision AI - Multiple Object Tracking Integration Helper
Binds YOLO26n detections to supervision ByteTrack tracker.
"""

try:
    import supervision as sv
    SUPERVISION_AVAILABLE = True
except ImportError:
    SUPERVISION_AVAILABLE = False

class RetailTrackerHelper:
    """
    Helper class to manage and format tracker states.
    Uses ByteTrack under the hood inside detector.py.
    """
    @staticmethod
    def get_tracker():
        if SUPERVISION_AVAILABLE:
            return sv.ByteTrack()
        return None

    @staticmethod
    def format_customer_id(track_id):
        """Formats the track ID as Customer 101, Customer 102, etc."""
        return f"Customer {100 + int(track_id)}"
