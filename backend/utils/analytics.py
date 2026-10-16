import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import cv2
import os
import json
import pandas as pd

def generate_analytics_images(data_dir, static_dir, shelf_zones_path=None):
    """
    Generates analytics visualization images strictly from actual processed video data:
    1. store_heatmap.png: visitor density overlaid on the reference store CCTV frame / layout.
    2. blind_zone.png: spatial grid coverage showing identified low-traffic / blind zones.
    Returns: blind_spot_percentage (float)
    """
    os.makedirs(static_dir, exist_ok=True)
    width, height = 1280, 720

    # Load configured shelf zones if available
    zones = {}
    if shelf_zones_path and os.path.exists(shelf_zones_path):
        try:
            with open(shelf_zones_path, 'r') as f:
                zones = json.load(f)
        except Exception as e:
            print(f"Error loading shelf zones: {e}")

    # Fallback to default zones if empty
    if not zones:
        zones = {
            "Shelf A (Groceries)": {"x1": 50, "y1": 100, "x2": 430, "y2": 680, "color": "#F97316"},
            "Shelf B (Household)": {"x1": 680, "y1": 100, "x2": 1200, "y2": 680, "color": "#3B82F6"},
            "Central Aisle": {"x1": 430, "y1": 120, "x2": 680, "y2": 680, "color": "#10B981"}
        }

    # Load actual tracking data
    tracking_path = os.path.join(data_dir, "tracking_data.csv")
    x_coords = []
    y_coords = []
    
    if os.path.exists(tracking_path):
        try:
            df = pd.read_csv(tracking_path)
            if "x" in df.columns and "y" in df.columns and len(df) > 0:
                # Filter out obvious invalid coordinates
                valid_df = df[(df["x"] >= 0) & (df["x"] <= width) & (df["y"] >= 0) & (df["y"] <= height)]
                x_coords = valid_df["x"].tolist()
                y_coords = valid_df["y"].tolist()
        except Exception as e:
            print(f"Error reading tracking_data.csv: {e}")

    # Load reference frame if available
    ref_frame_path = os.path.join(static_dir, "reference_frame.jpg")
    ref_img = None
    if os.path.exists(ref_frame_path):
        ref_img = cv2.imread(ref_frame_path)
        if ref_img is not None:
            ref_img = cv2.cvtColor(ref_img, cv2.COLOR_BGR2RGB)
            if ref_img.shape[1] != width or ref_img.shape[0] != height:
                ref_img = cv2.resize(ref_img, (width, height))

    # ---------------- 1. RENDER STORE HEATMAP ----------------
    fig, ax = plt.subplots(figsize=(12, 6.75), dpi=100)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')

    if ref_img is not None:
        ax.imshow(ref_img, extent=[0, width, height, 0], aspect='auto', alpha=0.85)
    else:
        # Clean architectural blueprint style
        ax.axhspan(0, height, facecolor='#F8FAFC')

    # Draw density heatmap if coordinates exist
    if len(x_coords) > 5:
        heatmap, xedges, yedges = np.histogram2d(x_coords, y_coords, bins=[160, 90], range=[[0, width], [0, height]])
        heatmap = cv2.GaussianBlur(heatmap.T, (25, 25), 0)
        max_val = np.max(heatmap)
        if max_val > 0:
            heatmap = (heatmap / max_val) * 255.0
            masked_heatmap = np.ma.masked_where(heatmap < 5, heatmap)
            ax.imshow(masked_heatmap, cmap='turbo', extent=[0, width, height, 0], alpha=0.6, origin='upper', interpolation='bicubic')
    else:
        # Message indicating no tracking points yet
        ax.text(width / 2, height / 2, "No Customer Trajectory Data Recorded Yet\nProcess a CCTV video clip to generate movement heatmap.",
                color='#64748B', fontsize=14, ha='center', va='center', fontweight='bold',
                bbox=dict(facecolor='#FFFFFF', alpha=0.9, edgecolor='#E2E8F0', boxstyle='round,pad=0.8'))

    # Draw configured shelf boundaries and tags
    for name, box in zones.items():
        color = box.get("color", "#F97316")
        bx1, by1 = box.get("x1", 0), box.get("y1", 0)
        bx2, by2 = box.get("x2", 100), box.get("y2", 100)
        bw = max(10, bx2 - bx1)
        bh = max(10, by2 - by1)
        
        rect = patches.Rectangle((bx1, by1), bw, bh, fill=False, edgecolor=color, linewidth=2.5, linestyle='-')
        ax.add_patch(rect)
        ax.text(bx1 + 8, by1 + 22, name.upper(), color='#FFFFFF', fontsize=9, fontweight='bold',
                bbox=dict(facecolor=color, alpha=0.9, edgecolor='none', boxstyle='round,pad=0.3'))

    ax.set_xlim(0, width)
    ax.set_ylim(height, 0)
    ax.axis('off')
    ax.set_title("RETAILVISION AI — REAL-TIME CUSTOMER MOVEMENT HEATMAP", color='#111827', fontsize=13, pad=12, fontweight='bold')

    # Add Colorbar Legend
    sm = plt.cm.ScalarMappable(cmap='turbo', norm=plt.Normalize(vmin=0, vmax=100))
    sm._A = []
    cbar = fig.colorbar(sm, ax=ax, orientation='horizontal', pad=0.03, shrink=0.5, aspect=25)
    cbar.set_label('Observed Shopper Density (Low Traffic → High Concentration)', color='#64748B', fontsize=9, fontweight='bold')
    cbar.ax.xaxis.set_tick_params(color='#94A3B8', labelcolor='#64748B')

    plt.tight_layout()
    heatmap_path = os.path.join(static_dir, "store_heatmap.png")
    plt.savefig(heatmap_path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=100)
    plt.close()

    # ---------------- 2. RENDER BLIND ZONE GRID ----------------
    # Divide 1280x720 into a 16x9 grid (144 cells, 80x80 px each)
    grid_cols = 16
    grid_rows = 9
    cell_w = width / grid_cols
    cell_h = height / grid_rows

    grid_counts = np.zeros((grid_rows, grid_cols), dtype=int)
    for x, y in zip(x_coords, y_coords):
        c = int(min(grid_cols - 1, max(0, x // cell_w)))
        r = int(min(grid_rows - 1, max(0, y // cell_h)))
        grid_counts[r, c] += 1

    total_cells = grid_cols * grid_rows
    # Cells with zero visits are potential blind spots / dead zones
    blind_cells = np.sum(grid_counts == 0)
    blind_percentage = round((blind_cells / total_cells) * 100, 1)

    fig2, ax2 = plt.subplots(figsize=(12, 6.75), dpi=100)
    fig2.patch.set_facecolor('#FFFFFF')
    ax2.set_facecolor('#F8FAFC')

    if ref_img is not None:
        ax2.imshow(ref_img, extent=[0, width, height, 0], aspect='auto', alpha=0.7)

    # Draw grid cells
    for r in range(grid_rows):
        for c in range(grid_cols):
            x1 = c * cell_w
            y1 = r * cell_h
            cnt = grid_counts[r, c]

            if cnt == 0 and len(x_coords) > 0:
                # Potential Blind / Low-Traffic Zone (Translucent Coral Red)
                cell_rect = patches.Rectangle((x1, y1), cell_w, cell_h, fill=True, facecolor='#EF4444', alpha=0.35, edgecolor='#F87171', linewidth=1.2, linestyle='--')
                ax2.add_patch(cell_rect)
            elif cnt > 0:
                # Active Traffic Cell (Translucent Green to Orange)
                intensity = min(1.0, cnt / max(1, np.max(grid_counts)))
                cell_rect = patches.Rectangle((x1, y1), cell_w, cell_h, fill=True, facecolor='#10B981', alpha=0.25 * intensity, edgecolor='#34D399', linewidth=0.8)
                ax2.add_patch(cell_rect)

    # Highlight identified low-traffic clusters
    for name, box in zones.items():
        color = box.get("color", "#F97316")
        bx1, by1 = box.get("x1", 0), box.get("y1", 0)
        bx2, by2 = box.get("x2", 100), box.get("y2", 100)
        bw = max(10, bx2 - bx1)
        bh = max(10, by2 - by1)
        rect = patches.Rectangle((bx1, by1), bw, bh, fill=False, edgecolor=color, linewidth=2, linestyle=':')
        ax2.add_patch(rect)
        ax2.text(bx1 + 6, by1 + 18, name, color='#1E293B', fontsize=8, fontweight='bold',
                 bbox=dict(facecolor='#FFFFFF', alpha=0.85, edgecolor=color, boxstyle='round,pad=0.2'))

    ax2.set_xlim(0, width)
    ax2.set_ylim(height, 0)
    ax2.axis('off')
    ax2.set_title(f"RETAILVISION AI — SPATIAL COVERAGE & BLIND ZONE DETECTION ({blind_percentage}% UNVISITED GRID BLOCKS)",
                  color='#DC2626', fontsize=13, pad=12, fontweight='bold')

    # Legend indicator
    legend_text = f"Analyzed Grid: {grid_cols}x{grid_rows} (144 Spatial Cells) | Zero-Traffic Cells: {blind_cells} ({blind_percentage}%)\nThreshold: Minimum 1 recorded foot coordinate | Documented Spatial Method: 80x80px Ground-Plane Binning"
    ax2.text(width / 2, height - 15, legend_text, color='#1E293B', fontsize=9, ha='center', va='bottom',
             bbox=dict(facecolor='#FFFFFF', alpha=0.92, edgecolor='#E2E8F0', boxstyle='round,pad=0.4'))

    plt.tight_layout()
    blind_path = os.path.join(static_dir, "blind_zone.png")
    plt.savefig(blind_path, facecolor=fig2.get_facecolor(), edgecolor='none', dpi=100)
    plt.close()

    print(f"Analytics images generated successfully. Blind Spot %: {blind_percentage}")
    return blind_percentage
