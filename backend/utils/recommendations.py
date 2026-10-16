import numpy as np

def generate_recommendations(shelf_df, dwell_df, blind_pct, total_customers):
    """
    Generates rule-based recommendations strictly from actual processed video analytics.
    Each recommendation includes:
    - shelf or zone
    - observed evidence (exact measured counts and dwell times)
    - reason for recommendation
    - proposed action
    - priority level
    - measured values
    """
    recommendations = []
    rec_id = 1

    if total_customers == 0 or shelf_df is None or shelf_df.empty:
        return [
            {
                "id": 1,
                "shelf": "Overall Store Layout",
                "category": "Data Collection Notice",
                "priority": "LOW",
                "evidence": "No customer trajectories observed in the analyzed video.",
                "reason": "Either no shoppers entered the camera view during this video clip, or detection sensitivity requires calibration.",
                "proposed_action": "Process a longer CCTV segment or select a peak-hour footage file to generate zone-level insights.",
                "measured_values": {
                    "total_customers": 0,
                    "active_shelves": 0
                }
            }
        ]

    # Calculate aggregate metrics
    shelf_rows = shelf_df.to_dict('records')
    cust_counts = [row.get("customer_count", 0) for row in shelf_rows]
    avg_dwells = [row.get("avg_dwell_time", 0.0) for row in shelf_rows]
    
    median_visits = np.median(cust_counts) if cust_counts else 0
    mean_dwell = np.mean(avg_dwells) if avg_dwells else 0.0

    for row in shelf_rows:
        shelf_id = row.get("shelf_id", "Unknown Zone")
        visits = row.get("customer_count", 0)
        avg_dwell = row.get("avg_dwell_time", 0.0)
        max_dwell = row.get("max_dwell_time", 0.0)
        pct_of_total = round((visits / max(1, total_customers)) * 100, 1)

        # Rule 1: High footfall but low dwell time (Pass-through corridor effect)
        if visits > median_visits and avg_dwell < max(3.0, mean_dwell * 0.7):
            recommendations.append({
                "id": rec_id,
                "shelf": shelf_id,
                "category": "Merchandising & Engagement",
                "priority": "HIGH",
                "evidence": f"High footfall ({visits} visits, {pct_of_total}% of all shoppers) but brief dwell time (avg {avg_dwell:.1f}s vs store avg {mean_dwell:.1f}s).",
                "reason": "Shoppers frequently traverse this zone as a transit pathway without stopping to inspect products on the shelves.",
                "proposed_action": "Introduce eye-level promotional displays, feature high-affinity impulse items, or install contrasting signage to catch shopper attention.",
                "measured_values": {
                    "visits": visits,
                    "avg_dwell_seconds": avg_dwell,
                    "store_avg_dwell_seconds": round(mean_dwell, 1)
                }
            })
            rec_id += 1

        # Rule 2: Low footfall and low dwell time (Underperforming / neglected zone)
        elif visits <= median_visits and avg_dwell < mean_dwell:
            recommendations.append({
                "id": rec_id,
                "shelf": shelf_id,
                "category": "Traffic Draw & Placement",
                "priority": "MEDIUM",
                "evidence": f"Low shopper visitation ({visits} visits, {pct_of_total}% of shoppers) and low engagement dwell ({avg_dwell:.1f}s).",
                "reason": "This area is bypassed by shopper traffic flow, resulting in minimal interaction with stocked merchandise.",
                "proposed_action": "Evaluate sightlines from the main aisle; test relocating popular staple SKUs or promotional endcaps to pull foot traffic toward this shelf.",
                "measured_values": {
                    "visits": visits,
                    "avg_dwell_seconds": avg_dwell,
                    "store_avg_dwell_seconds": round(mean_dwell, 1)
                }
            })
            rec_id += 1

        # Rule 3: High dwell time anchor (High customer interest)
        elif visits >= median_visits and avg_dwell >= mean_dwell and visits > 0:
            recommendations.append({
                "id": rec_id,
                "shelf": shelf_id,
                "category": "Inventory & Space Optimization",
                "priority": "HIGH",
                "evidence": f"Strong shopper interaction ({visits} visits, avg dwell of {avg_dwell:.1f}s, max dwell {max_dwell:.1f}s).",
                "reason": "Customers actively browse products in this shelf zone, making it a primary engagement anchor in the store layout.",
                "proposed_action": "Prioritize premium margin products and ensure frequent shelf replenishment to prevent stockouts during peak shopping periods.",
                "measured_values": {
                    "visits": visits,
                    "avg_dwell_seconds": avg_dwell,
                    "max_dwell_seconds": max_dwell
                }
            })
            rec_id += 1

    # Rule 4: Blind zone spatial coverage recommendation
    if blind_pct > 15.0:
        recommendations.append({
            "id": rec_id,
            "shelf": "Store Walkway Coverage",
            "category": "Blind Zone Remediation",
            "priority": "HIGH",
            "evidence": f"Measured spatial blind spot / low-traffic coverage is {blind_pct:.1f}% across the monitored walking grid.",
            "reason": "Structural fixtures or obstructed aisles prevent shoppers from accessing a notable portion of the store floor.",
            "proposed_action": "Clear wide pathway clearances, adjust freestanding floor displays, or reposition CCTV camera angles for optimal line-of-sight.",
            "measured_values": {
                "blind_percentage": blind_pct,
                "threshold": "Grid cells with zero recorded customer foot coordinates"
            }
        })
        rec_id += 1
    elif blind_pct > 5.0:
        recommendations.append({
            "id": rec_id,
            "shelf": "Perimeter Aisles",
            "category": "Floor Flow Optimization",
            "priority": "LOW",
            "evidence": f"A moderate {blind_pct:.1f}% of walkable grid cells recorded zero shopper presence.",
            "reason": "Minor peripheral dead zones observed along shelf perimeters.",
            "proposed_action": "Place promotional floor decals or lighting highlights at adjacent intersections to guide shopper navigation.",
            "measured_values": {
                "blind_percentage": blind_pct
            }
        })
        rec_id += 1

    return recommendations
