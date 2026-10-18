# NEXUS AI Traffic Optimizer — Frontend + Backend

## Requirements
Node.js 20+ and Python 3.10+.

## Backend (Terminal 1)
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Open http://127.0.0.1:8000/docs and http://127.0.0.1:8000/api/health

## Frontend (Terminal 2, project root)
```bash
npm install
npm run dev
```
Open http://localhost:5173

## What works
- Python FastAPI endpoints for health, signal decision, model training and training history.
- Actual *tabular Q-learning* updates in a **synthetic queue environment**, with trainable alpha, gamma, epsilon.
- Frontend polls backend for signal decisions in AI mode and can retrain the agent from ML Lab.
- Emergency vehicles are prioritized via a safety override rule.
- 2D vehicles, visual traffic dashboard and fixed/manual modes remain client-side.

## Limitations
- CCTV/YOLO section is a **mock UI**. No trained YOLO weights, real camera input, video inference or real-world deployment.
- Benchmark comparison figures are illustrative placeholders, not independently measured results.
- Simulation is simplified and not safety validated; do not use to control real intersections.
- Training is in-memory and resets when backend restarts. No database or SUMO integration.
