
import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";
import {
  Cpu, Compass, Camera, BarChart3,
  Info, Play, Pause
} from "lucide-react";

import { initialQLearningData } from "./data/chartData";
import LiveSimulation from "./components/LiveSimulation";
import VisionAI from "./components/VisionAI";
import MLLab from "./components/MLLab";
import Architecture from "./components/Architecture";

const SIZE = 600;
const CENTER = 300;
const HALF_ROAD = 55;
const STOP = 80;

const DIRECTIONS = ["N", "S", "E", "W"];

const COLORS = {
  CAR: "#06b6d4",
  BUS: "#f59e0b",
  TRUCK: "#a855f7",
  BIKE: "#10b981",
  AMBULANCE: "#ef4444"
};

const EMPTY_QUEUES = { N: 0, S: 0, E: 0, W: 0 };

const MIN_GREEN_MS = 5000;
const MAX_GREEN_MS = 18000;
const QUEUE_PRIORITY_MARGIN = 2;

function oppositePhase(phase) {
  return phase === "NS" ? "EW" : "NS";
}

function getPosition(dir) {
  switch (dir) {
    case "N":
      return { x: 272, y: -30, vx: 0, vy: 1 };
    case "S":
      return { x: 328, y: 630, vx: 0, vy: -1 };
    case "W":
      return { x: -30, y: 328, vx: 1, vy: 0 };
    default:
      return { x: 630, y: 272, vx: -1, vy: 0 };
  }
}

function distanceToStop(v) {
  switch (v.dir) {
    case "N":
      return CENTER - STOP - v.y;
    case "S":
      return v.y - (CENTER + STOP);
    case "W":
      return CENTER - STOP - v.x;
    default:
      return v.x - (CENTER + STOP);
  }
}

function drawRoad(ctx) {
  ctx.fillStyle = "#050914";
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;

  for (let i = 0; i <= SIZE; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, SIZE);
    ctx.moveTo(0, i);
    ctx.lineTo(SIZE, i);
    ctx.stroke();
  }

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(
    CENTER - HALF_ROAD,
    0,
    HALF_ROAD * 2,
    SIZE
  );
  ctx.fillRect(
    0,
    CENTER - HALF_ROAD,
    SIZE,
    HALF_ROAD * 2
  );

  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);

  ctx.beginPath();
  ctx.moveTo(CENTER, 0);
  ctx.lineTo(CENTER, CENTER - HALF_ROAD);

  ctx.moveTo(CENTER, CENTER + HALF_ROAD);
  ctx.lineTo(CENTER, SIZE);

  ctx.moveTo(0, CENTER);
  ctx.lineTo(CENTER - HALF_ROAD, CENTER);

  ctx.moveTo(CENTER + HALF_ROAD, CENTER);
  ctx.lineTo(SIZE, CENTER);

  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#334155";

  for (let i = -50; i < 50; i += 12) {
    ctx.fillRect(CENTER + i, 227, 8, 14);
    ctx.fillRect(CENTER + i, 359, 8, 14);
    ctx.fillRect(227, CENTER + i, 14, 8);
    ctx.fillRect(359, CENTER + i, 14, 8);
  }

  ctx.strokeStyle = "#f87171";
  ctx.lineWidth = 3;
  ctx.beginPath();

  ctx.moveTo(245, 220);
  ctx.lineTo(300, 220);

  ctx.moveTo(300, 380);
  ctx.lineTo(355, 380);

  ctx.moveTo(220, 300);
  ctx.lineTo(220, 355);

  ctx.moveTo(380, 245);
  ctx.lineTo(380, 300);

  ctx.stroke();
}

function drawSignal(ctx, x, y, green) {
  ctx.save();

  ctx.fillStyle = "#090d16";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = green ? "#10b981" : "#ef4444";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawVehicle(ctx, v) {
  ctx.save();
  ctx.translate(v.x, v.y);

  const angle = {
    N: Math.PI / 2,
    S: -Math.PI / 2,
    W: 0,
    E: Math.PI
  }[v.dir];

  ctx.rotate(angle);

  const length =
    v.type === "BUS" ? 26 :
    v.type === "TRUCK" ? 28 :
    v.type === "BIKE" ? 12 : 20;

  const width =
    v.type === "BIKE" ? 8 :
    ["BUS", "TRUCK"].includes(v.type) ? 14 : 12;

  ctx.fillStyle = COLORS[v.type];
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = v.isEm ? 15 : 6;

  ctx.beginPath();
  ctx.roundRect(
    -length / 2,
    -width / 2,
    length,
    width,
    3
  );
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0f172a";

  ctx.fillRect(
    -length / 4,
    -width / 3,
    length / 2.5,
    width / 1.5
  );

  ctx.fillStyle = "#fef08a";
  ctx.fillRect(length / 2 - 2, -width / 2 + 1, 3, 2);
  ctx.fillRect(length / 2 - 2, width / 2 - 3, 3, 2);

  ctx.fillStyle = v.stopped ? "#ef4444" : "#991b1b";
  ctx.fillRect(-length / 2, -width / 2 + 1, 2, 2);
  ctx.fillRect(-length / 2, width / 2 - 3, 2, 2);

  if (
    v.isEm &&
    Math.floor(Date.now() / 150) % 2 === 0
  ) {
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function App() {
  const [backendStatus, setBackendStatus] =
    useState("Checking");

  const [trainingBusy, setTrainingBusy] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("LIVE_SIM");

  const [controlMode, setControlMode] =
    useState("AI");

  const [simSpeed, setSimSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const [emergencyActive, setEmergencyActive] =
    useState(false);

  const [rushHour, setRushHour] = useState(false);

  // Pedestrian crossing: 2s all-red clearance + 6s walk + 2s clearance.
  const [pedestrianPhase, setPedestrianPhase] = useState("IDLE");
  const [pedestrianSeconds, setPedestrianSeconds] = useState(0);
  const pedestrianRef = useRef("IDLE");
  const pedestrianEndRef = useRef(0);
  const pedestrianPauseRef = useRef(null);
  const pedestrianRequestedRef = useRef(false);

  const requestPedestrianCrossing = () => {
    if (pedestrianRef.current !== "IDLE" || pedestrianRequestedRef.current) return;
    pedestrianRequestedRef.current = true;
    setPedestrianPhase("REQUESTED");
  };
  const [showHeatmap, setShowHeatmap] = useState(true);

  const [activeSignal, setActiveSignal] =
    useState("NS");

  const [signalTimer, setSignalTimer] =
    useState(10);

  const [totalCleared, setTotalCleared] =
    useState(0);

  const [avgWaitTime, setAvgWaitTime] =
    useState(0);

  const [efficiencyScore, setEfficiencyScore] =
    useState(100);

  const [queueLengths, setQueueLengths] =
    useState(EMPTY_QUEUES);

  const [alpha, setAlpha] = useState(0.15);
  const [gamma, setGamma] = useState(0.92);
  const [epsilon, setEpsilon] = useState(0.08);

  const [rewardHistory, setRewardHistory] =
    useState(initialQLearningData);

  const [visionStats] = useState({
    cars: 18,
    buses: 4,
    trucks: 3,
    bikes: 9
  });

  const [isUploading, setIsUploading] =
    useState(false);

  const canvasRef = useRef(null);
  const vehiclesRef = useRef([]);
  const animationFrameRef = useRef(null);

  const queueRef = useRef(EMPTY_QUEUES);
  const signalRef = useRef("NS");
  const modeRef = useRef("AI");
  const pausedRef = useRef(false);
  const speedRef = useRef(1);
  const rushRef = useRef(false);
  const emergencyRef = useRef(false);
  const heatmapRef = useRef(true);

  const phaseStartedRef = useRef(Date.now());
  const phaseEndRef = useRef(Date.now() + 10000);

  const clearedRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastTelemetryRef = useRef(0);

  const emergencySpawnedRef = useRef(false);

  useEffect(() => {
    signalRef.current = activeSignal;
  }, [activeSignal]);

  useEffect(() => {
    modeRef.current = controlMode;

    if (controlMode === "FIXED") {
      phaseStartedRef.current = Date.now();
      phaseEndRef.current = Date.now() + 10000;
      setSignalTimer(10);
    }
  }, [controlMode]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    speedRef.current = simSpeed;
  }, [simSpeed]);

  useEffect(() => {
    rushRef.current = rushHour;
  }, [rushHour]);

  useEffect(() => {
    emergencyRef.current = emergencyActive;

    if (!emergencyActive) {
      emergencySpawnedRef.current = false;
    }
  }, [emergencyActive]);

  useEffect(() => {
    heatmapRef.current = showHeatmap;
  }, [showHeatmap]);

  useEffect(() => {
    api.health()
      .then(() => setBackendStatus("Connected"))
      .catch(() => setBackendStatus("Offline"));

    api.history()
      .then(data => {
        if (data.history?.length) {
          setRewardHistory(data.history);
        }
      })
      .catch(() => {});
  }, []);

  // Train the same backend agent used by live decisions.
  const trainModel = async () => {
    setTrainingBusy(true);

    try {
      const result = await api.train({
        episodes: 500,
        alpha,
        gamma,
        epsilon
      });

      setRewardHistory(result.history);
      setBackendStatus("Connected");

    } catch (error) {
      console.error(error);
      setBackendStatus("Offline");

      alert(
        "Backend unavailable. Start FastAPI on port 8000."
      );

    } finally {
      setTrainingBusy(false);
    }
  };

  // Changes a signal and records the green phase start.
  const changeSignal = (phase, duration = 8) => {
    if (!["NS", "EW"].includes(phase) || pedestrianRef.current !== "IDLE" || pedestrianRequestedRef.current) return;

    const now = Date.now();

    if (phase !== signalRef.current) {
      phaseStartedRef.current = now;
    }

    signalRef.current = phase;
    setActiveSignal(phase);

    const seconds = Math.max(
      5,
      Math.min(18, Number(duration) || 8)
    );

    phaseEndRef.current = now + seconds * 1000;
    setSignalTimer(Math.ceil(seconds));
  };

  useEffect(() => {
    if (isPaused) {
      pedestrianPauseRef.current = Date.now();
    } else if (pedestrianPauseRef.current !== null) {
      if (pedestrianRef.current !== "IDLE") {
        pedestrianEndRef.current += Date.now() - pedestrianPauseRef.current;
      }
      pedestrianPauseRef.current = null;
    }
  }, [isPaused]);

  // Pedestrian controller: wait for vehicles already in junction to clear.
  useEffect(() => {
    if (isPaused) return;
    const tick = () => {
      const now = Date.now();
      if (pedestrianRequestedRef.current && pedestrianRef.current === "IDLE") {
        const junctionBusy = vehiclesRef.current.some(v =>
          distanceToStop(v) < 0 && distanceToStop(v) > -175
        );
        if (!junctionBusy) {
          pedestrianRequestedRef.current = false;
          pedestrianRef.current = "WALK";
          pedestrianEndRef.current = now + 6000;
          setPedestrianPhase("WALK");
          setPedestrianSeconds(6);
        }
      } else if (pedestrianRef.current === "WALK") {
        const remaining = Math.max(0, Math.ceil((pedestrianEndRef.current - now) / 1000));
        setPedestrianSeconds(remaining);
        if (remaining === 0) {
          pedestrianRef.current = "CLEARANCE";
          pedestrianEndRef.current = now + 2000;
          setPedestrianPhase("CLEARANCE");
        }
      } else if (pedestrianRef.current === "CLEARANCE" && now >= pedestrianEndRef.current) {
        pedestrianRef.current = "IDLE";
        setPedestrianPhase("IDLE");
        phaseStartedRef.current = now;
        phaseEndRef.current = now + 10000;
      }
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [isPaused]);

  // Fair signal switching + Q-Learning.
  useEffect(() => {
    if (controlMode !== "AI" || isPaused || pedestrianPhase !== "IDLE") return;

    let cancelled = false;
    let busy = false;

    const applyDecision = (
      desiredPhase,
      duration,
      emergency = false
    ) => {
      const now = Date.now();
      const current = signalRef.current;
      const elapsed = now - phaseStartedRef.current;
      const queues = queueRef.current;
      const nsQueue = queues.N + queues.S;
      const ewQueue = queues.E + queues.W;
      const currentQueue = current === "NS" ? nsQueue : ewQueue;
      const oppositeQueue = current === "NS" ? ewQueue : nsQueue;
      const opposite = oppositePhase(current);

      // An approaching ambulance has immediate priority.
      if (emergency) {
        if (desiredPhase !== current) {
          changeSignal(desiredPhase, 8);
        } else if (now >= phaseEndRef.current) {
          changeSignal(current, 8);
        }
        return;
      }

      // Avoid flickering: each normal green lasts at least 5 seconds.
      if (elapsed < MIN_GREEN_MS) return;

      // If the opposite road is much busier, switch once the
      // minimum safe green period has elapsed.
      const oppositeHasPriority =
        oppositeQueue > 0 &&
        oppositeQueue >= currentQueue + QUEUE_PRIORITY_MARGIN;

      // Maximum continuous green: prevent starvation even if
      // the current road keeps receiving new vehicles.
      const reachedMaxGreen =
        elapsed >= MAX_GREEN_MS && oppositeQueue > 0;

      if (oppositeHasPriority || reachedMaxGreen) {
        const nextDuration = Math.max(
          5,
          Math.min(18, oppositeQueue * 2 + 5)
        );
        changeSignal(opposite, nextDuration);
        return;
      }

      // Otherwise respect the running countdown.
      if (now < phaseEndRef.current) return;

      // On countdown expiry, avoid starving either approach.
      // If both have vehicles, give the waiting side a turn;
      // otherwise serve the only occupied side.
      let nextPhase = current;
      if (oppositeQueue > 0) {
        nextPhase = opposite;
      } else if (currentQueue === 0) {
        nextPhase = ["NS", "EW"].includes(desiredPhase)
          ? desiredPhase
          : opposite;
      }

      const selectedQueue = nextPhase === "NS" ? nsQueue : ewQueue;
      const nextDuration = Math.max(5, Math.min(18, selectedQueue * 2 + 5));
      // Only reset timer when it has expired or a real switch occurs.
      changeSignal(nextPhase, nextDuration);
    };

    const decide = async () => {
      if (busy) return;

      busy = true;

      const emergency = vehiclesRef.current.find(
        v =>
          v.isEm &&
          distanceToStop(v) >= -20
      );

      const queues = { ...queueRef.current };

      try {
        const result = await api.decide({
          queues,
          current_signal: signalRef.current,
          emergency_direction: emergency?.dir || null
        });

        if (
          cancelled ||
          modeRef.current !== "AI" ||
          pausedRef.current
        ) {
          return;
        }

        setBackendStatus("Connected");

        const duration = Math.max(
          5,
          Math.min(
            18,
            Number(result.duration) || 8
          )
        );

        applyDecision(
          result.phase,
          duration,
          Boolean(emergency)
        );

      } catch (error) {
        if (cancelled) return;

        console.error("AI decision error:", error);
        setBackendStatus("Offline");

        const ns = queues.N + queues.S;
        const ew = queues.E + queues.W;

        const fallback =
          ns > ew ? "NS" :
          ew > ns ? "EW" :
          signalRef.current;

        const emergencyPhase = emergency
          ? (["N", "S"].includes(emergency.dir)
              ? "NS"
              : "EW")
          : null;

        applyDecision(
          emergencyPhase || fallback,
          8,
          Boolean(emergency)
        );

      } finally {
        busy = false;
      }
    };

    decide();

    const interval = setInterval(decide, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [controlMode, isPaused, pedestrianPhase]);

  // Fixed Timer: alternates every 10 seconds.
  useEffect(() => {
    if (controlMode !== "FIXED" || isPaused || pedestrianPhase !== "IDLE") {
      return;
    }

    const interval = setInterval(() => {
      if (Date.now() >= phaseEndRef.current) {
        changeSignal(
          oppositePhase(signalRef.current),
          10
        );
      }
    }, 250);

    return () => clearInterval(interval);
  }, [controlMode, isPaused, pedestrianPhase]);

  // 2D traffic simulation.
  useEffect(() => {
    if (activeTab !== "LIVE_SIM") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;

    let running = true;

    function spawnVehicle(forceEmergency = false) {
      const dir = DIRECTIONS[
        Math.floor(Math.random() * DIRECTIONS.length)
      ];

      const isEm = forceEmergency;

      const types = [
        "CAR", "CAR", "CAR",
        "BUS", "TRUCK", "BIKE"
      ];

      const type = isEm
        ? "AMBULANCE"
        : types[Math.floor(Math.random() * types.length)];

      const pos = getPosition(dir);

      const blocked = vehiclesRef.current.some(
        v =>
          v.dir === dir &&
          Math.hypot(
            v.x - pos.x,
            v.y - pos.y
          ) < 45
      );

      if (blocked) return false;

      const speed = isEm
        ? 3.2
        : type === "BIKE"
          ? 2.6
          : ["BUS", "TRUCK"].includes(type)
            ? 1.6
            : 2.2;

      vehiclesRef.current.push({
        id: Math.random(),
        dir,
        type,
        isEm,
        ...pos,
        speed,
        stopped: false,
        waitTime: 0
      });

      return true;
    }

    function render(time) {
      if (!running) return;

      const delta = lastFrameRef.current
        ? Math.min(
            (time - lastFrameRef.current) / 16.67,
            2
          )
        : 1;

      lastFrameRef.current = time;

      drawRoad(ctx);

      if (!pausedRef.current) {
        const speedMultiplier = speedRef.current;

        const spawnInterval =
          rushRef.current ? 230 : 700;

        if (
          time - lastSpawnRef.current >
          spawnInterval / speedMultiplier
        ) {
          spawnVehicle();
          lastSpawnRef.current = time;
        }

        if (
          emergencyRef.current &&
          !emergencySpawnedRef.current
        ) {
          if (spawnVehicle(true)) {
            emergencySpawnedRef.current = true;
          }
        }

        const ordered = [
          ...vehiclesRef.current
        ].sort(
          (a, b) =>
            distanceToStop(a) -
            distanceToStop(b)
        );

        for (const v of ordered) {
          const phase =
            ["N", "S"].includes(v.dir)
              ? "NS"
              : "EW";

          const remaining = distanceToStop(v);

          const step =
            v.speed * speedMultiplier * delta;

          // An ambulance still obeys the signal until the controller
          // switches its corridor green (no red-light teleporting).
          const isRed = pedestrianRef.current !== "IDLE" ||
            pedestrianRequestedRef.current || signalRef.current !== phase;

          let shouldStop =
            isRed &&
            remaining >= 0 &&
            remaining <= step + 2;

          // Keep a safe gap behind the vehicle in front.
          // Only compare cars on the same approach; do not let
          // a car that has left the junction block the queue.
          const ahead = ordered.find(other => {
            if (other.id === v.id || other.dir !== v.dir) {
              return false;
            }
            const gap = distanceToStop(v) - distanceToStop(other);
            return gap > 0 && gap < 34;
          });

          if (ahead) shouldStop = true;

          if (shouldStop) {
            v.stopped = true;
            v.waitTime += delta / 60;

          } else {
            v.stopped = false;

            const move =
              isRed && remaining >= 0
                ? Math.max(
                    0,
                    Math.min(step, remaining)
                  )
                : step;

            v.x += v.vx * move;
            v.y += v.vy * move;
          }
        }

        vehiclesRef.current =
          vehiclesRef.current.filter(v => {
            const outside =
              v.x < -50 ||
              v.x > 650 ||
              v.y < -50 ||
              v.y > 650;

            if (outside) {
              clearedRef.current++;
            }

            return !outside;
          });

        const queues = { ...EMPTY_QUEUES };

        for (const v of vehiclesRef.current) {
          // Count the approaching queue, not only the front stopped car.
          // Vehicles that already crossed the stop line are excluded.
          const distance = distanceToStop(v);
          if (distance >= -5 && distance <= 350) {
            queues[v.dir]++;
          }
        }

        queueRef.current = queues;

        if (
          time - lastTelemetryRef.current >= 500
        ) {
          setQueueLengths(queues);
          setTotalCleared(clearedRef.current);

          const count =
            vehiclesRef.current.length;

          const totalWait =
            vehiclesRef.current.reduce(
              (sum, v) => sum + v.waitTime,
              0
            );

          const avg = count
            ? totalWait / count
            : 0;

          const queueTotal =
            Object.values(queues).reduce(
              (a, b) => a + b,
              0
            );

          setAvgWaitTime(avg.toFixed(1));

          const flow = count
            ? Math.max(
                0,
                100 * (1 - queueTotal / count)
              )
            : 100;

          setEfficiencyScore(flow.toFixed(1));

          lastTelemetryRef.current = time;
        }
      }

      // Queue heatmap.
      if (heatmapRef.current) {
        const queues = queueRef.current;

        const locations = [
          [272, 190, queues.N],
          [328, 410, queues.S],
          [190, 328, queues.W],
          [410, 272, queues.E]
        ];

        for (const [x, y, count] of locations) {
          if (!count) continue;

          const gradient =
            ctx.createRadialGradient(
              x, y, 2,
              x, y, 55
            );

          gradient.addColorStop(
            0,
            `rgba(239,68,68,${Math.min(
              0.7,
              count * 0.1
            )})`
          );

          gradient.addColorStop(
            1,
            "rgba(239,68,68,0)"
          );

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 55, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      vehiclesRef.current.forEach(
        v => drawVehicle(ctx, v)
      );

      const crossing = pedestrianRef.current !== "IDLE" || pedestrianRequestedRef.current;
      const nsGreen = !crossing && signalRef.current === "NS";
      const ewGreen = !crossing && signalRef.current === "EW";

      drawSignal(ctx, 225, 225, nsGreen);
      drawSignal(ctx, 375, 375, nsGreen);

      drawSignal(ctx, 225, 375, ewGreen);
      drawSignal(ctx, 375, 225, ewGreen);

      animationFrameRef.current =
        requestAnimationFrame(render);
    }

    animationFrameRef.current =
      requestAnimationFrame(render);

    return () => {
      running = false;

      cancelAnimationFrame(
        animationFrameRef.current
      );

      lastFrameRef.current = 0;
    };
  }, [activeTab]);

  // Signal countdown.
  useEffect(() => {
    if (isPaused || pedestrianPhase !== "IDLE") return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (phaseEndRef.current - Date.now()) /
          1000
        )
      );

      setSignalTimer(remaining);
    }, 250);

    return () => clearInterval(interval);
  }, [isPaused, pedestrianPhase]);

  const moduleProps = {
    totalCleared,
    pedestrianPhase,
    pedestrianSeconds,
    requestPedestrianCrossing,
    avgWaitTime,
    activeSignal,
    signalTimer,
    efficiencyScore,
    queueLengths,
    canvasRef,

    showHeatmap,
    setShowHeatmap,

    controlMode,
    setControlMode,

    setActiveSignal: phase =>
      changeSignal(phase, 10),

    emergencyActive,
    setEmergencyActive,

    rushHour,
    setRushHour,

    simSpeed,
    setSimSpeed,

    isUploading,
    setIsUploading,

    visionStats,

    alpha,
    setAlpha,

    gamma,
    setGamma,

    epsilon,
    setEpsilon,

    rewardHistory,
    trainModel,
    trainingBusy,
    backendStatus
  };

  const tabs = [
    {
      id: "LIVE_SIM",
      name: "Live Traffic Sim",
      icon: Compass
    },
    {
      id: "VISION_AI",
      name: "YOLO Vision Stream",
      icon: Camera
    },
    {
      id: "ML_LAB",
      name: "RL Training & Benchmarks",
      icon: BarChart3
    },
    {
      id: "EXPLAINER",
      name: "Project Architecture",
      icon: Info
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans">
      <header className="border-b border-cyan-500/20 bg-[#060b19]/90 sticky top-0 z-50">
        <div className="max-w-[1850px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl">
              <Cpu className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-wider text-white">
                NEXUS AI SMART TRAFFIC OPTIMIZER
              </h1>

              <p className="text-xs text-slate-400">
                Adaptive Signal Timing • Q-Learning Engine • Emergency Corridor
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-1.5 bg-[#02050e] p-1.5 rounded-xl border border-slate-800">
            {tabs.map(tab => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold ${
                backendStatus === "Connected"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              Backend: {backendStatus}
            </span>

            <button
              onClick={() => {
                if (isPaused) {
                  phaseStartedRef.current =
                    Date.now() -
                    Math.max(
                      0,
                      10000 - signalTimer * 1000
                    );

                  phaseEndRef.current =
                    Date.now() +
                    Math.max(1, signalTimer) * 1000;
                }

                setIsPaused(!isPaused);
              }}
              className="px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-2"
            >
              {isPaused
                ? <Play className="w-4 h-4" />
                : <Pause className="w-4 h-4" />}

              {isPaused ? "RESUME" : "PAUSE"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1850px] mx-auto p-4 md:p-6 space-y-6">

        {activeTab === "LIVE_SIM" && (
          <LiveSimulation {...moduleProps} />
        )}

        {activeTab === "VISION_AI" && (
          <VisionAI {...moduleProps} />
        )}

        {activeTab === "ML_LAB" && (
          <MLLab {...moduleProps} />
        )}

        {activeTab === "EXPLAINER" && (
          <Architecture {...moduleProps} />
        )}

      </main>
    </div>
  );
}
