# 🚧 RoadGuard AI – Intelligent Road Damage Detection & Reporting System

<div align="center">

# 🚗🛣️ RoadGuard AI

### AI-Powered Road Damage Detection, Monitoring & Reporting Platform

Built using **YOLOv8, FastAPI, React, TypeScript, Computer Vision, and Artificial Intelligence** to improve road safety through intelligent pothole detection, live monitoring, citizen reporting, and government analytics.

---

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green?logo=fastapi)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![YOLOv8](https://img.shields.io/badge/YOLOv8-AI-orange)
![License](https://img.shields.io/badge/License-Educational-red)

</div>

---

# 📖 Overview

RoadGuard AI is an AI-powered smart road monitoring platform that automatically detects potholes and manholes using Computer Vision and Deep Learning.

The platform assists drivers with real-time alerts, enables citizens to report road damages manually, and provides government authorities with an interactive dashboard for monitoring, tracking, and managing road maintenance activities.

The project aims to improve road safety, reduce accidents, and simplify infrastructure maintenance through intelligent automation.

---

# ✨ Features

## 🤖 AI Detection

- AI-powered road damage detection using YOLOv8
- Pothole detection
- Manhole detection
- Bounding box visualization
- Confidence score prediction
- Damage severity classification
- Detection summary generation
- Image upload detection
- Live camera detection

---

## 📷 Live Camera Detection

- Real-time webcam detection
- Browser camera integration
- Live bounding box rendering
- Camera switching
- Resolution selection
- FPS monitoring
- Mirroring support
- Auto reconnect

---

## 🚗 Driver Assistance

- Real-time driver warning system
- Voice assistant alerts
- Audio warning notifications
- Warning banner overlays
- Detection history
- Severity indicators
- Duplicate alert suppression
- Priority-based speech announcements

---

## 📸 Auto Capture & GPS Logging

- Automatic evidence capture
- Manual image capture
- GPS location tagging
- Confidence threshold settings
- Duplicate suppression
- Capture cooldown
- Session tracking
- Evidence history

---

## 📊 Live Analytics Dashboard

- Live FPS monitoring
- Latency monitoring
- Session analytics
- Detection statistics
- Performance metrics
- SVG charts
- Timeline events
- JSON session export

---

## 🏛 Government Dashboard

- Detection management
- Search reports
- Advanced filters
- Repair status management
- Detection details
- Report analytics
- Dashboard statistics
- Status tracking

---

## 🗺 Interactive Detection Map

- OpenStreetMap integration
- GPS-based report visualization
- Severity-based map markers
- Detection popups
- Interactive controls
- Live filtering
- Responsive design

---

## 👥 Citizen Road Reporting

- Manual road damage reporting
- Image upload from device
- GPS-enabled reports
- Report history
- Status tracking
- Government dashboard integration

---

# 👥 User Roles

## 🚗 Driver

- AI Detection
- Live Camera Detection
- Voice Alerts
- Driver Warnings
- Auto Capture
- GPS Logging
- Live Analytics

---

## 👤 Citizen

- Submit road damage reports
- Upload road images
- GPS-enabled reporting
- View submitted reports
- Track repair status

---

## 🏛 Government Officer

- Government Dashboard
- Interactive Detection Map
- Detection management
- Repair workflow
- Status updates
- Report analytics

---

## 👨‍💼 Administrator

- Full system access
- Dashboard management
- User management
- AI monitoring
- Government tools
- Analytics

---

# 🛠 Technology Stack

## Frontend

- React
- TypeScript
- Vite
- HTML5
- CSS3
- React Leaflet
- Web Speech API
- Geolocation API
- MediaDevices API

---

## Backend

- FastAPI
- Python
- SQLAlchemy
- JWT Authentication
- Pydantic
- SQLite

---

## AI & Computer Vision

- YOLOv8
- Ultralytics
- OpenCV
- PyTorch

---

## Maps

- OpenStreetMap
- Leaflet
- React Leaflet

---

## Authentication

- JWT Authentication
- Role-Based Access Control (RBAC)
- Secure Password Hashing

---

# 📂 Project Structure

```text
RoadGuard-AI/
│
├── backend/
│   ├── ai/
│   ├── app/
│   ├── uploads/
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── data/
├── logs/
├── README.md
└── .gitignore
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/THILAKESWARAN07/RoadGuard-AI.git

cd RoadGuard-AI
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

---

# ▶ Running the Project

## Backend

```bash
cd backend

uvicorn app.main:app --reload --port 8002
```

Backend

```
http://localhost:8002
```

Swagger API

```
http://localhost:8002/docs
```

---

## Frontend

```bash
cd frontend

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 🤖 AI Model

RoadGuard AI uses a custom-trained **YOLOv8** model for detecting potholes and manholes.

> **Note:** The trained model file (`best.pt`) is **not included** in this repository due to GitHub file size limitations.

Place the trained model in the following location before running AI detection:

```text
backend/ai/models/best.pt
```

---

# 📷 Screenshots

Add project screenshots here after deployment.

Suggested screenshots:

- Home Page
- Login Page
- Driver Dashboard
- AI Detection
- Live Camera Detection
- Voice Assistant
- Live Analytics Dashboard
- Government Dashboard
- Interactive Detection Map
- Citizen Reporting

---

# 📡 API Documentation

After starting the backend:

```
http://localhost:8002/docs
```

The Swagger UI provides complete documentation for all available REST APIs.

---

# 🚀 Future Enhancements

- Mobile Application
- Cloud Deployment
- PostgreSQL Database
- Real-Time Notifications
- Email Notifications
- Push Notifications
- Multi-language Support
- Video Analytics
- Road Repair Recommendation System
- Traffic Data Integration
- Advanced AI Model Optimization

---

# 🌐 Deployment Status

> 🚧 **Deployment is currently in progress.**

The project has been completed locally and deployment will be available soon.

### Planned Deployment

**Frontend**
- Vercel

**Backend**
- Render

**Database**
- SQLite (Current)
- PostgreSQL (Future)

**AI Model**
- External Cloud Storage / Render-Compatible Hosting

Deployment links will be updated once the application is successfully hosted.

---

# 🤝 Contributors

**Project:** RoadGuard AI

Developed by:

- **Thilakeswaran D. G.**
- **Team Members** (Add Names)

---

# 📄 License

This project is developed for **academic and educational purposes only**.

---

<div align="center">

## ⭐ If you found this project useful, please consider giving it a Star!

### 🚗 RoadGuard AI – Building Safer Roads with Artificial Intelligence 🛣️🤖

</div>