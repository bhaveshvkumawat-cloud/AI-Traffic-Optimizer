
import React, { useState } from "react";
import {
  Car,
  Siren,
  Radio,
  Flame,
  Sliders,
  TrendingUp,
  CheckCircle2,
  Activity,
  Award,
  BarChart3,
} from "lucide-react";

export default function LiveSimulation(props) {
  const {
    totalCleared,
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
    setActiveSignal,
    emergencyActive,
    setEmergencyActive,
    rushHour,
    setRushHour,
    simSpeed,
    setSimSpeed,
    pedestrianPhase = "IDLE",
    pedestrianSeconds = 0,
    requestPedestrianCrossing = () => {},
  } = props;

  // Save results from each simulation mode
  const [comparison, setComparison] = useState({
    AI: null,
    FIXED: null,
  });

  const saveComparison = () => {
    if (controlMode === "MANUAL") {
      alert("Select AI Q-Learning or Fixed Timer first.");
      return;
    }

    setComparison((previous) => ({
      ...previous,
      [controlMode]: {
        cleared: Number(totalCleared),
        waiting: Number(avgWaitTime),
      },
    }));
  };

  const aiResult = comparison.AI;
  const fixedResult = comparison.FIXED;

  const waitingImprovement =
    aiResult && fixedResult && fixedResult.waiting > 0
      ? (
          ((fixedResult.waiting - aiResult.waiting) /
            fixedResult.waiting) *
          100
        ).toFixed(1)
      : null;

  const throughputImprovement =
    aiResult && fixedResult && fixedResult.cleared > 0
      ? (
          ((aiResult.cleared - fixedResult.cleared) /
            fixedResult.cleared) *
          100
        ).toFixed(1)
      : null;

  const totalQueue =
    queueLengths.N +
    queueLengths.S +
    queueLengths.E +
    queueLengths.W;

  return (
    <div className="space-y-6">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* VEHICLES CLEARED */}
        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#060b19] p-4 shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Total Vehicles Cleared
            </p>

            <h3 className="mt-2 font-mono text-3xl font-black text-white">
              {totalCleared}
            </h3>

            <span className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400">
              <Car size={12} />
              Simulation Output
            </span>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-400">
            <Car size={24} />
          </div>

          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
        </div>

        {/* WAITING TIME */}
        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#060b19] p-4 shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Avg Queue Waiting Time
            </p>

            <h3 className="mt-2 font-mono text-3xl font-black text-emerald-400">
              {avgWaitTime}s
            </h3>

            <span className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400">
              <Activity size={12} />
              Live Simulation Metric
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400">
            <Activity size={24} />
          </div>

          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* ACTIVE SIGNAL */}
        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#060b19] p-4 shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Active Signal Corridor
            </p>

            <h3 className="mt-2 font-mono text-xl font-black text-amber-400">
              {pedestrianPhase !== "IDLE"
                ? "ALL RED — PEDESTRIAN"
                : activeSignal === "NS"
                  ? "NORTH-SOUTH"
                  : "EAST-WEST"}
            </h3>

            <span className="mt-2 block text-[10px] text-slate-400">
              Phase Countdown:{" "}
              <b className="text-amber-300">
                {pedestrianPhase === "IDLE" ? signalTimer : pedestrianSeconds}s
              </b>
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400">
            <Radio size={24} />
          </div>

          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>

        {/* NETWORK FLOW */}
        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-800 bg-[#060b19] p-4 shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Overall Network Flow
            </p>

            <h3 className="mt-2 font-mono text-3xl font-black text-purple-400">
              {efficiencyScore}%
            </h3>

            <span className="mt-2 block text-[10px] text-purple-300">
              Simulation Flow Metric
            </span>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-purple-400">
            <Award size={24} />
          </div>

          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* SIMULATION + CONTROLS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SIMULATION CANVAS */}
        <div className="relative flex flex-col items-center rounded-2xl border border-slate-800 bg-[#060b19] p-4 shadow-2xl lg:col-span-7">
          <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />

              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Junction 04 - Live Traffic Simulation
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Active Queue:{" "}
                <b className="font-mono text-cyan-400">
                  {totalQueue}
                </b>
              </span>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`rounded border px-3 py-1 text-[11px] font-bold ${
                  showHeatmap
                    ? "border-red-500/40 bg-red-500/20 text-red-400"
                    : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                Heatmap {showHeatmap ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <div className="relative flex aspect-square w-full max-w-[540px] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-[#050914] shadow-2xl">
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
            />

            <div className="absolute bottom-3 left-3 space-y-1 rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-[10px] text-white">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Sedan / SUV
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Transit Bus
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                Freight Truck
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Emergency Ambulance
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTROL PANEL */}
        <div className="space-y-4 lg:col-span-5">
          {/* SIGNAL MODES */}
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#060b19] p-5 shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase text-white">
              <Sliders size={18} className="text-cyan-400" />
              Signal Control Mode
            </h3>

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1.5">
              {[
                { key: "AI", label: "AI Q-Learning" },
                { key: "FIXED", label: "Fixed Timer" },
                { key: "MANUAL", label: "Manual" },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setControlMode(mode.key)}
                  className={`rounded-lg py-2 text-xs font-bold transition ${
                    controlMode === mode.key
                      ? "bg-cyan-500 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* MANUAL OVERRIDE */}
            {controlMode === "MANUAL" && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setActiveSignal("NS")}
                  className={`rounded-xl border px-2 py-3 text-xs font-bold ${
                    activeSignal === "NS"
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  Force North-South Green
                </button>

                <button
                  onClick={() => setActiveSignal("EW")}
                  className={`rounded-xl border px-2 py-3 text-xs font-bold ${
                    activeSignal === "EW"
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  Force East-West Green
                </button>
              </div>
            )}

            {/* SMART PEDESTRIAN CROSSING */}
            <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <h3 className="text-sm font-bold text-emerald-400">
                🚶 Smart Pedestrian Crossing
              </h3>
              <p className="text-xs text-slate-400">
                Request a safe crossing. Vehicles stop before the junction,
                then pedestrians get a timed WALK phase.
              </p>
              <button
                type="button"
                onClick={requestPedestrianCrossing}
                disabled={pedestrianPhase !== "IDLE"}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pedestrianPhase === "IDLE"
                  ? "🚶 REQUEST PEDESTRIAN CROSSING"
                  : pedestrianPhase === "REQUESTED"
                    ? "⏳ WAITING FOR JUNCTION TO CLEAR"
                    : pedestrianPhase === "WALK"
                      ? `🚶 WALK NOW — ${pedestrianSeconds}s`
                      : "🛑 CROSSING CLOSING"}
              </button>
              {pedestrianPhase === "WALK" && (
                <div className="text-center" aria-live="polite">
                  <p className="text-3xl font-black text-emerald-400">
                    {pedestrianSeconds}s
                  </p>
                  <p className="text-xs text-slate-400">Pedestrian crossing countdown</p>
                </div>
              )}
            </div>

            {/* AMBULANCE */}
            <button
              onClick={() => setEmergencyActive(!emergencyActive)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-extrabold ${
                emergencyActive
                  ? "border-red-500/60 bg-red-500/20 text-red-400"
                  : "border-slate-800 bg-slate-900 text-slate-300"
              }`}
            >
              <Siren size={16} />
              {emergencyActive
                ? "CLEAR EMERGENCY CORRIDOR"
                : "SPAWN PRIORITY AMBULANCE"}
            </button>

            {/* RUSH HOUR */}
            <button
              onClick={() => setRushHour(!rushHour)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-extrabold ${
                rushHour
                  ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                  : "border-slate-800 bg-slate-900 text-slate-300"
              }`}
            >
              <Flame size={16} />
              {rushHour
                ? "NORMAL TRAFFIC FLOW"
                : "TRIGGER PEAK RUSH HOUR"}
            </button>

            {/* SIMULATION SPEED */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold text-slate-400">
                Simulation Speed Multiplier
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSimSpeed(speed)}
                    className={`rounded-lg border py-2 text-xs font-bold ${
                      simSpeed === speed
                        ? "border-cyan-400 bg-cyan-500 text-slate-950"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI VS FIXED TIMER */}
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#060b19] p-5 shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
              <BarChart3 size={20} className="text-cyan-400" />
              AI vs Fixed Timer
            </h3>

            <p className="text-xs leading-relaxed text-slate-400">
              Run AI and Fixed Timer under similar traffic
              conditions. Save each mode's simulation results
              to compare performance.
            </p>

            <button
              onClick={saveComparison}
              disabled={controlMode === "MANUAL"}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save{" "}
              {controlMode === "AI"
                ? "AI Q-Learning"
                : controlMode === "FIXED"
                ? "Fixed Timer"
                : "Comparison"}{" "}
              Result
            </button>

            <div className="grid grid-cols-2 gap-3">
              {/* AI RESULT */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                <p className="text-xs font-bold text-cyan-400">
                  AI Q-Learning
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Vehicles Cleared
                </p>

                <p className="text-xl font-black text-white">
                  {aiResult?.cleared ?? "--"}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Avg Waiting Time
                </p>

                <p className="text-lg font-bold text-white">
                  {aiResult
                    ? `${aiResult.waiting}s`
                    : "--"}
                </p>
              </div>

              {/* FIXED RESULT */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                <p className="text-xs font-bold text-purple-400">
                  Fixed Timer
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Vehicles Cleared
                </p>

                <p className="text-xl font-black text-white">
                  {fixedResult?.cleared ?? "--"}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Avg Waiting Time
                </p>

                <p className="text-lg font-bold text-white">
                  {fixedResult
                    ? `${fixedResult.waiting}s`
                    : "--"}
                </p>
              </div>
            </div>

            {/* COMPARISON METRICS */}
            {aiResult && fixedResult && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <p className="text-xs text-slate-400">
                    Waiting-Time Change
                  </p>

                  <p className="mt-2 text-xl font-black text-emerald-400">
                    {waitingImprovement !== null
                      ? `${waitingImprovement}%`
                      : "--"}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Positive means AI waited less
                  </p>
                </div>

                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-center">
                  <p className="text-xs text-slate-400">
                    Vehicles-Cleared Change
                  </p>

                  <p className="mt-2 text-xl font-black text-blue-400">
                    {throughputImprovement !== null
                      ? `${throughputImprovement}%`
                      : "--"}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Positive means AI cleared more
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() =>
                setComparison({ AI: null, FIXED: null })
              }
              className="w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Clear Comparison
            </button>

            <p className="text-[10px] leading-relaxed text-slate-500">
              Results are snapshots of simulation metrics.
              A validated comparison requires equal run
              durations, identical traffic conditions, and
              separate counter resets.
            </p>
          </div>

          {/* QUEUE BREAKDOWN */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-[#060b19] p-5 shadow-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Lane Queue Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "N", label: "North", color: "text-cyan-400" },
                { key: "S", label: "South", color: "text-cyan-400" },
                { key: "E", label: "East", color: "text-purple-400" },
                { key: "W", label: "West", color: "text-purple-400" },
              ].map((lane) => (
                <div
                  key={lane.key}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <span className="text-xs text-slate-400">
                    {lane.label}:
                  </span>

                  <span
                    className={`font-mono text-sm font-extrabold ${lane.color}`}
                  >
                    {queueLengths[lane.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
