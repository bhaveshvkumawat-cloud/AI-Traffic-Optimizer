
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

from .agent import TrafficAgent
from .vision import analyze_upload


# ==========================================
# NEXUS AI SMART TRAFFIC OPTIMIZER
# FastAPI Backend
# ==========================================

app = FastAPI(
    title="NEXUS AI Smart Traffic Optimizer",
    description="Q-Learning Traffic Control + YOLO Vehicle Detection",
    version="2.0.0"
)


# ==========================================
# CORS Configuration
# Local Development + GitHub Pages
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local React / Vite development
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",

        # Deployed GitHub Pages frontend
        "https://bhaveshvkumawat-cloud.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Q-Learning Traffic Agent
# ==========================================

agent = TrafficAgent()
agent.train()


# ==========================================
# Request Models
# ==========================================

class Queues(BaseModel):
    N: int = Field(ge=0, le=1000)
    S: int = Field(ge=0, le=1000)
    E: int = Field(ge=0, le=1000)
    W: int = Field(ge=0, le=1000)


class DecisionRequest(BaseModel):
    queues: Queues
    current_signal: Literal["NS", "EW"] = "NS"
    emergency_direction: Literal["N", "S", "E", "W"] | None = None


class TrainRequest(BaseModel):
    episodes: int = Field(default=500, ge=10, le=10000)
    alpha: float = Field(default=0.15, gt=0, le=1)
    gamma: float = Field(default=0.92, ge=0, le=1)
    epsilon: float = Field(default=0.08, ge=0, le=1)


# ==========================================
# Health Check
# ==========================================

@app.get("/")
def root():
    return {
        "project": "NEXUS AI Smart Traffic Optimizer",
        "status": "running",
        "features": [
            "Q-Learning Traffic Optimization",
            "Adaptive Signal Control",
            "YOLOv8 Vehicle Detection"
        ]
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_trained": agent.trained,
        "yolo_endpoint": "/api/vision/detect"
    }


# ==========================================
# Traffic Signal Decision
# ==========================================

@app.post("/api/traffic/decide")
def decide(payload: DecisionRequest):
    return agent.decide(
        payload.queues.model_dump(),
        payload.current_signal,
        payload.emergency_direction
    )


# ==========================================
# Train Q-Learning Model
# ==========================================

@app.post("/api/train")
def train(payload: TrainRequest):
    history = agent.train(
        payload.episodes,
        payload.alpha,
        payload.gamma,
        payload.epsilon
    )

    return {
        "status": "trained",
        "episodes": payload.episodes,
        "history": history,
        "states": len(agent.q)
    }


# ==========================================
# Training History
# ==========================================

@app.get("/api/training/history")
def history():
    return {
        "history": agent.history,
        "states": len(agent.q)
    }


# ==========================================
# YOLO Vehicle Detection
# ==========================================

@app.post("/api/vision/detect")
async def detect_traffic(file: UploadFile = File(...)):
    """
    Upload a traffic image or video.

    YOLO detects:
    - Cars
    - Buses
    - Trucks
    - Motorcycles
    """

    return await analyze_upload(file)
