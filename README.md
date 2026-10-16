# AI-Powered Blind Spot Discovery for Retail Stores

An AI-powered Computer Vision system that analyzes retail surveillance footage to identify customer movement patterns, detect blind zones, measure shelf engagement, and generate actionable store layout recommendations.

The system combines **Object Detection**, **Multi-Object Tracking**, **Customer Analytics**, and an **Interactive Dashboard** to help retailers optimize product placement and improve customer engagement.

---

# Problem Statement

Retail stores invest heavily in store layouts and merchandising, yet many shelves receive little customer attention.

Manual analysis of CCTV footage is:

- Time-consuming
- Expensive
- Inaccurate
- Difficult to scale

This project automates the entire process using Artificial Intelligence and Computer Vision.

---

# Objectives

- Detect customers in surveillance videos
- Track each customer with a unique ID
- Generate customer movement heatmaps
- Detect blind zones
- Calculate shelf-wise visitor count
- Measure customer dwell time
- Rank shelves based on engagement
- Generate AI-based layout recommendations
- Display all analytics through an interactive dashboard

---

# Key Features

## Person Detection

Detects customers in every CCTV frame.

## Multi-Object Tracking

Assigns a unique ID to every customer and tracks movement throughout the store.

## Heatmap Generation

Visualizes customer traffic density.

## Blind Zone Detection

Identifies store regions with low customer engagement.

## Shelf Engagement Analysis

Calculates

- Visitor Count
- Average Dwell Time
- Customer Visits

for every shelf.

## AI Recommendation Engine

Provides intelligent recommendations such as

- Shelf relocation
- Product repositioning
- Layout optimization
- Blind zone improvements

## Interactive Dashboard

Displays all analytics in real time.

---

# System Architecture

```
                     CCTV Video
                          │
                          ▼
                 Video Frame Extraction
                          │
                          ▼
               Person Detection Module
                          │
                          ▼
             Multi-Object Tracking Module
                          │
                          ▼
                Customer Analytics Module
        ┌───────────┬───────────┬────────────┐
        ▼           ▼           ▼            ▼
    Heatmap     Dwell Time   Shelf Stats   Blind Zones
        └───────────┬───────────┬────────────┘
                    ▼
         AI Recommendation Engine
                    ▼
          Streamlit Dashboard
```

---

# Project Workflow

```
Input Video

↓

Frame Extraction

↓

Customer Detection

↓

Customer Tracking

↓

Movement Analysis

↓

Heatmap Generation

↓

Shelf Analysis

↓

Blind Zone Detection

↓

Recommendation Engine

↓

Dashboard Visualization
```

---

# Project Structure

```
Retail-Blind-Spot-AI/

│

├── analytics/

│   ├── heatmap.py

│   ├── dwell_time.py

│   ├── blind_zone.py

│   └── shelf_analysis.py

│

├── dashboard/

│   └── app.py

│

├── data/

│   ├── videos/

│   └── output/

│

├── detection/

│   └── detect.py

│

├── tracking/

│   └── tracker.py

│

├── models/

│

├── main.py

├── requirements.txt

└── README.md
```

---

# Module Responsibilities

## Detection Module

Input

```
Video Frame
```

Output

```
Bounding Boxes
```

---

## Tracking Module

Input

```
Bounding Boxes
```

Output

```
Customer ID
Bounding Box
Center Coordinates
```

---

## Analytics Module

Receives tracking data and performs

- Heatmap Generation
- Dwell Time Calculation
- Shelf Engagement Analysis
- Blind Zone Detection

---

## Dashboard Module

Displays

- Annotated Video
- Heatmap
- Visitor Count
- Shelf Ranking
- Blind Zones
- Recommendations

---

# Data Flow

```
Video

↓

Frame

↓

Detection

↓

Tracking

↓

Analytics

↓

Dashboard
```

---

# Analytics Pipeline

```
Tracked Customers

↓

Customer Positions

↓

Zone Mapping

↓

Shelf Visits

↓

Heatmap

↓

Dwell Time

↓

Blind Zone Detection

↓

Recommendation Engine
```

---

# Technology Stack

## Programming Language

- Python

## Computer Vision

- OpenCV

## Deep Learning

- YOLOv11 (or Custom Detector)

## Tracking

- ByteTrack / SORT / Centroid Tracker

## Data Processing

- NumPy
- Pandas

## Visualization

- Matplotlib
- Plotly

## Dashboard

- Streamlit

## Geometry

- Shapely

---

# Installation

## Clone Repository

```bash
git clone <repository_url>

cd Retail-Blind-Spot-AI
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run Project

```bash
python main.py
```

---

## Run Dashboard

```bash
streamlit run dashboard/app.py
```

---

# Input

Supported Formats

- MP4
- AVI
- MOV

Place videos inside

```
data/videos/
```

---

# Output

The system generates

- Annotated Video
- Customer Heatmap
- Blind Zone Visualization
- Shelf-wise Visitor Count
- Average Dwell Time
- Shelf Ranking
- Dashboard
- AI Recommendations

---

# Dashboard Components

- Total Customers
- Customer Traffic Heatmap
- Shelf Visitor Count
- Average Dwell Time
- Blind Zones
- Customer Distribution
- Underperforming Shelves
- AI Suggestions

---

# Team Responsibilities

## Member 1

Detection Module

- detect.py

---

## Member 2

Tracking Module

- tracker.py

---

## Member 3

Analytics

- heatmap.py
- dwell_time.py
- blind_zone.py
- shelf_analysis.py

Dashboard

- app.py

Integration

- main.py

---

# Future Enhancements

- Live CCTV Support
- Multi-Camera Tracking
- Product-Level Analytics
- Customer Path Prediction
- Real-Time Alerts
- Cloud Deployment
- Mobile Dashboard
- Edge AI Deployment

---

# License

MIT License

---

# Contributors

- Member 1 — Detection
- Member 2 — Tracking
- Member 3 — Analytics & Dashboard

---

# Acknowledgements

- OpenCV
- Ultralytics YOLO
- Streamlit
- NumPy
- Pandas
- Plotly
Retail-Blind-Spot-AI/


README.md
LICENSE
requirements.txt
.gitignore

docs/
    architecture.png
    workflow.png
    dashboard.png

analytics/
dashboard/
tracking/
detection/
data/
models/

