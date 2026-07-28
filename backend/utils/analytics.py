import matplotlib
matplotlib.use('Agg') # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import numpy as np
import cv2
import os

def generate_analytics_images(data_dir, static_dir):
    """
    Generates premium, dark-themed analytics visualization images:
    1. store_heatmap.png: visitor density overlaid on the store blueprint.
    2. blind_zone.png: coverage gaps and unvisited grid blocks.
    """
    os.makedirs(static_dir, exist_ok=True)
    
    width, height = 1280, 720
    
    # Store layout zones for drawing
    zones = {
        "Entrance": {"x1": 30, "y1": 50, "x2": 150, "y2": 130, "color": "#10B981"},
        "Exit": {"x1": 30, "y1": 550, "x2": 150, "y2": 630, "color": "#EF4444"},
        "Shelf A (Snacks)": {"x1": 150, "y1": 150, "x2": 450, "y2": 250, "color": "#8B5CF6"},
        "Shelf B (Beverages)": {"x1": 550, "y1": 150, "x2": 850, "y2": 250, "color": "#3B82F6"},
        "Shelf C (Produce)": {"x1": 150, "y1": 350, "x2": 450, "y2": 450, "color": "#06B6D4"},
        "Shelf D (Bakery)": {"x1": 550, "y1": 350, "x2": 850, "y2": 450, "color": "#F59E0B"},
        "Checkout": {"x1": 950, "y1": 250, "x2": 1150, "y2": 450, "color": "#EC4899"}
    }

    # Simulated coordinate points for density generation
    # ( Entrance -> A -> B -> Checkout -> Exit )
    np.random.seed(42)
    x_coords = []
    y_coords = []
    
    # Add dense clusters around Shelves and Checkout
    # Shelf A
    x_coords.extend(np.random.normal(300, 50, 400))
    y_coords.extend(np.random.normal(200, 30, 400))
    # Shelf B (High traffic)
    x_coords.extend(np.random.normal(700, 60, 600))
    y_coords.extend(np.random.normal(200, 30, 600))
    # Shelf C
    x_coords.extend(np.random.normal(300, 40, 200))
    y_coords.extend(np.random.normal(400, 30, 200))
    # Shelf D (Medium traffic)
    x_coords.extend(np.random.normal(700, 50, 350))
    y_coords.extend(np.random.normal(400, 30, 350))
    # Checkout (Highest congestion)
    x_coords.extend(np.random.normal(1050, 40, 800))
    y_coords.extend(np.random.normal(350, 45, 800))
    # Aisle pathways (walking transitions)
    x_coords.extend(np.random.uniform(100, 1100, 500))
    y_coords.extend(np.random.uniform(100, 600, 500))

    # Keep coordinates inside borders
    x_coords = np.clip(x_coords, 0, width - 1)
    y_coords = np.clip(y_coords, 0, height - 1)

    # 1. RENDER STORE HEATMAP IMAGE
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 6.75), dpi=100) # Exact 16:9 ratio
    fig.patch.set_facecolor('#0f172a') # Match UI Background
    ax.set_facecolor('#0f172a')
    
    # Generate 2D Gaussian density map
    heatmap, xedges, yedges = np.histogram2d(x_coords, y_coords, bins=[128, 72], 
                                             range=[[0, width], [0, height]])
    
    # Smooth the density matrix using Gaussian blur
    # Transpose to match x/y axis
    heatmap = cv2.GaussianBlur(heatmap.T, (15, 15), 0)
    
    # Normalize
    heatmap = (heatmap / np.max(heatmap)) * 255
    
    # Render Heatmap density
    ax.imshow(heatmap, cmap='jet', extent=[0, width, height, 0], alpha=0.55, origin='upper', interpolation='bicubic')
    
    # Draw floor plan boundaries and labels on top
    for name, box in zones.items():
        rect = plt.Rectangle((box["x1"], box["y1"]), box["x2"] - box["x1"], box["y2"] - box["y1"],
                             fill=False, edgecolor=box["color"], linewidth=2, linestyle='--')
        ax.add_patch(rect)
        # Background block for text legibility
        ax.text(box["x1"] + 10, box["y1"] + 25, name.upper(), color='#f8fafc', fontsize=9,
                fontweight='bold', bbox=dict(facecolor='#1e293b', alpha=0.8, edgecolor='none', boxstyle='round,pad=0.3'))

    # Grid line indicators
    ax.set_xlim(0, width)
    ax.set_ylim(height, 0) # Inverted Y for camera view alignment
    ax.grid(color='#334155', linestyle=':', alpha=0.3)
    ax.set_title("RETAILVISION AI - SHOPSPATIAL LIVE TRAFFIC HEATMAP", color='#06b6d4', fontsize=14, pad=15, fontweight='bold')
    
    # Add beautiful legend bar
    # Colorbar
    sm = plt.cm.ScalarMappable(cmap='jet', norm=plt.Normalize(vmin=0, vmax=100))
    sm._A = []
    cbar = fig.colorbar(sm, ax=ax, orientation='horizontal', pad=0.08, shrink=0.6)
    cbar.set_label('Traffic Density & Occupancy Rate (%)', color='#94a3b8', fontsize=10)
    cbar.ax.xaxis.set_tick_params(color='#94a3b8', labelcolor='#94a3b8')
    
    plt.tight_layout()
    heatmap_path = os.path.join(static_dir, "store_heatmap.png")
    plt.savefig(heatmap_path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=100)
    plt.close()

    # 2. RENDER BLIND ZONE IMAGE
    fig, ax = plt.subplots(figsize=(12, 6.75), dpi=100)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')

    # Draw layout boxes
    for name, box in zones.items():
        rect = plt.Rectangle((box["x1"], box["y1"]), box["x2"] - box["x1"], box["y2"] - box["y1"],
                             fill=True, facecolor=(30/255, 41/255, 59/255, 0.2), edgecolor='#334155', linewidth=1)
        ax.add_patch(rect)
        ax.text(box["x1"] + 10, box["y1"] + 25, name.upper(), color='#94a3b8', fontsize=8, fontweight='bold')

    # Define Blind Zone areas (places with zero density coordinates)
    # We will shade these regions in a distinct translucent red-grey mask
    blind_spots = [
        {"x": 150, "y": 270, "w": 380, "h": 60, "label": "Blind Zone A (Corridor Shadow)"},
        {"x": 30, "y": 150, "w": 100, "h": 380, "label": "Blind Zone B (Corner Dead Zone)"},
        {"x": 870, "y": 150, "w": 60, "h": 480, "label": "Blind Zone C (Pillar Obstruction)"}
    ]

    for bs in blind_spots:
        # Draw translucent filled red-gray box
        rect = plt.Rectangle((bs["x"], bs["y"]), bs["w"], bs["h"],
                             fill=True, facecolor='#ef4444', alpha=0.35, edgecolor='#f87171', linewidth=1.5)
        ax.add_patch(rect)
        # Label inside blind zone
        ax.text(bs["x"] + bs["w"]//2, bs["y"] + bs["h"]//2, bs["label"],
                color='#f8fafc', fontsize=9, fontweight='bold', ha='center', va='center',
                bbox=dict(facecolor='#991b1b', alpha=0.9, edgecolor='#f87171', boxstyle='round,pad=0.2'))

    # Draw camera positions and coverage arcs
    cameras = [
        {"x": 20, "y": 20, "label": "CAM-01", "angle": 45},
        {"x": 1260, "y": 20, "label": "CAM-02", "angle": 135},
        {"x": 640, "y": 360, "label": "CAM-03 (360)", "angle": 0}
    ]
    
    for cam in cameras:
        # Camera icon anchor
        plt.plot(cam["x"], cam["y"], marker='^', markersize=12, color='#06b6d4')
        ax.text(cam["x"] + (15 if cam["x"] < 640 else -45), cam["y"] + 20, cam["label"], 
                color='#06b6d4', fontsize=9, fontweight='bold')
        
        # Coverage area representation
        if cam["label"] != "CAM-03 (360)":
            circle = plt.Circle((cam["x"], cam["y"]), 250, color='#06b6d4', fill=False, linestyle=':', alpha=0.3)
            ax.add_patch(circle)
        else:
            circle = plt.Circle((cam["x"], cam["y"]), 150, color='#10b981', fill=False, linestyle=':', alpha=0.4)
            ax.add_patch(circle)

    ax.set_xlim(0, width)
    ax.set_ylim(height, 0)
    ax.grid(color='#334155', linestyle=':', alpha=0.3)
    ax.set_title("RETAILVISION AI - CAMERA COVERAGE & BLIND SPOT MAP", color='#ef4444', fontsize=14, pad=15, fontweight='bold')
    
    plt.tight_layout()
    blind_path = os.path.join(static_dir, "blind_zone.png")
    plt.savefig(blind_path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=100)
    plt.close()
    
    print("Analytics images generated successfully.")
    return True
