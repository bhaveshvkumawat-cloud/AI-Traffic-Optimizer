
import React from "react";
import {
  Monitor,
  Server,
  BrainCircuit,
  Camera,
  TrafficCone,
  BarChart3,
  ArrowDown,
} from "lucide-react";

const technologies = [
  ["Frontend", "React.js, Vite, Tailwind CSS"],
  ["Backend", "Python, FastAPI"],
  ["AI Algorithm", "Q-Learning"],
  ["Vehicle Detection", "YOLOv8, OpenCV"],
  ["Simulation", "HTML5 Canvas 2D"],
  ["Charts", "Recharts"],
];

export default function Architecture() {
  return (
    <div className="space-y-5 text-white">

      {/* HEADER */}
      <div className="rounded-xl border border-slate-800 bg-[#080f20] p-5">
        <h2 className="text-xl font-bold text-cyan-400">
          NEXUS AI — Project Architecture
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          An AI-based traffic signal optimization system that
          uses Q-Learning to manage traffic and YOLOv8 to
          detect vehicles.
        </p>
      </div>

      {/* ARCHITECTURE FLOW */}
      <div className="rounded-xl border border-slate-800 bg-[#080f20] p-5">
        <h3 className="mb-5 font-bold">
          How Our Project Works
        </h3>

        <div className="flex flex-col items-center gap-3">

          <div className="w-full max-w-lg rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4 text-center">
            <Monitor className="mx-auto mb-2 text-cyan-400" />
            <h4 className="font-bold">React Frontend</h4>
            <p className="text-xs text-slate-400">
              Displays live traffic simulation and dashboard
            </p>
          </div>

          <ArrowDown className="text-slate-500" />

          <div className="w-full max-w-lg rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-center">
            <Server className="mx-auto mb-2 text-blue-400" />
            <h4 className="font-bold">Python FastAPI Backend</h4>
            <p className="text-xs text-slate-400">
              Processes traffic data and AI requests
            </p>
          </div>

          <ArrowDown className="text-slate-500" />

          <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">

            <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 text-center">
              <BrainCircuit className="mx-auto mb-2 text-purple-400" />
              <h4 className="font-bold">Q-Learning AI</h4>
              <p className="mt-2 text-xs text-slate-400">
                Selects traffic signal direction based on
                vehicle queues
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center">
              <Camera className="mx-auto mb-2 text-amber-400" />
              <h4 className="font-bold">YOLOv8 Detection</h4>
              <p className="mt-2 text-xs text-slate-400">
                Detects cars, buses, trucks and motorcycles
                from uploaded footage
              </p>
            </div>

          </div>

          <ArrowDown className="text-slate-500" />

          <div className="w-full max-w-lg rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
            <TrafficCone className="mx-auto mb-2 text-emerald-400" />
            <h4 className="font-bold">Traffic Simulation</h4>
            <p className="text-xs text-slate-400">
              Shows signal changes, vehicle movement and queues
            </p>
          </div>

        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Note: YOLO video detection is currently separate
          from the live traffic signal simulation.
        </p>
      </div>

      {/* TECHNOLOGIES */}
      <div className="rounded-xl border border-slate-800 bg-[#080f20] p-5">
        <h3 className="mb-4 font-bold">
          Technologies Used
        </h3>

        <div className="grid gap-3 md:grid-cols-2">
          {technologies.map(([name, tools]) => (
            <div
              key={name}
              className="rounded-lg border border-slate-800 bg-[#0d172b] p-3"
            >
              <p className="text-xs text-slate-400">
                {name}
              </p>
              <p className="mt-1 text-sm font-semibold text-cyan-400">
                {tools}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="rounded-xl border border-slate-800 bg-[#080f20] p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={18} className="text-emerald-400" />
          <h3 className="font-bold">Main Features</h3>
        </div>

        <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <p>✓ AI-based traffic signal control</p>
          <p>✓ Vehicle detection using YOLOv8</p>
          <p>✓ Emergency vehicle priority simulation</p>
          <p>✓ Q-Learning training and reward graph</p>
          <p>✓ Live traffic simulation</p>
          <p>✓ Traffic queue and waiting-time statistics</p>
        </div>
      </div>

    </div>
  );
}
