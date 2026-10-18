
import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Car,
  Bus,
  Truck,
  Bike,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const VEHICLES = [
  { key: "car", label: "Cars / Sedans", color: "#06b6d4", Icon: Car },
  { key: "bus", label: "Transit Buses", color: "#f59e0b", Icon: Bus },
  { key: "truck", label: "Freight Trucks", color: "#a855f7", Icon: Truck },
  { key: "motorcycle", label: "Motorcycles", color: "#10b981", Icon: Bike },
];

function DetectionBoxes({ detections, width, height }) {
  if (!width || !height || !detections?.length) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {detections.map((item, index) => {
        const [x1, y1, x2, y2] = item.xyxy;
        const vehicle = VEHICLES.find((v) => v.key === item.label);
        const color = vehicle?.color || "#ffffff";

        return (
          <g key={index}>
            <rect
              x={x1}
              y={y1}
              width={Math.max(0, x2 - x1)}
              height={Math.max(0, y2 - y1)}
              stroke={color}
              strokeWidth="3"
              fill="none"
            />

            <rect
              x={x1}
              y={Math.max(0, y1 - 25)}
              width="150"
              height="24"
              rx="4"
              fill={color}
            />

            <text
              x={x1 + 7}
              y={Math.max(18, y1 - 8)}
              fill="#020617"
              fontSize="15"
              fontWeight="bold"
            >
              {item.label.toUpperCase()}{" "}
              {(item.confidence * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function VisionAI() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFrame, setSelectedFrame] = useState(0);

  const videoRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isVideo = file
    ? /\.(mp4|avi|mov)$/i.test(file.name)
    : false;

  const currentFrame =
    result?.media_type === "video"
      ? result.samples?.[selectedFrame]
      : result;

  const counts = currentFrame?.counts || {};

  const total = Object.values(counts).reduce(
    (sum, count) => sum + Number(count || 0),
    0
  );

  function handleFileChange(event) {
    const selected = event.target.files?.[0];

    if (!selected) return;

    setFile(selected);
    setResult(null);
    setError("");
    setSelectedFrame(0);
  }

  async function runDetection() {
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/vision/detect`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Detection failed: HTTP ${response.status}`
        );
      }

      setResult(data);
      setSelectedFrame(0);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the YOLO detection backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function chooseFrame(index) {
    setSelectedFrame(index);

    if (videoRef.current && result?.samples?.[index]) {
      videoRef.current.currentTime =
        result.samples[index].time_seconds;
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-white">
      <section className="xl:col-span-8 rounded-2xl border border-slate-800 bg-[#060c1b] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Camera size={19} className="text-purple-400" />
              YOLO VISION — REAL VEHICLE DETECTION
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload traffic footage for AI-powered analysis
            </p>
          </div>

          <span className="text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-900 rounded-full px-3 py-1">
            YOLOv8 Detection
          </span>
        </div>

        <div className="relative w-full aspect-video rounded-xl border border-slate-800 bg-[#020617] overflow-hidden flex items-center justify-center">
          {!file ? (
            <div className="text-center px-5">
              <Camera
                size={48}
                className="mx-auto text-slate-600 mb-4"
              />
              <p className="text-slate-300 font-semibold">
                No Traffic Footage Selected
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Upload an image or video to begin YOLO detection
              </p>
            </div>
          ) : isVideo ? (
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="relative w-full h-full">
              <img
                src={previewUrl}
                alt="Traffic footage"
                className="w-full h-full object-contain"
              />

              {result?.media_type === "image" && (
                <DetectionBoxes
                  detections={result.detections}
                  width={result.width}
                  height={result.height}
                />
              )}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-4">
              <Loader2
                size={38}
                className="animate-spin text-cyan-400"
              />
              <p className="text-sm font-bold">
                YOLO AI IS ANALYZING...
              </p>
              <p className="text-xs text-slate-400">
                Please wait for detection results
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-5">
          <p className="text-center text-xs text-slate-400 mb-4">
            Upload CCTV Video / Traffic Image for YOLO Inference
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold transition">
              <Upload size={17} />
              CHOOSE TRAFFIC FILE

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.mp4,.avi,.mov"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <button
              type="button"
              onClick={runDetection}
              disabled={!file || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 text-sm font-bold transition"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Camera size={17} />
              )}
              {loading ? "DETECTING..." : "RUN YOLO DETECTION"}
            </button>
          </div>

          {file && (
            <p className="text-center text-xs text-cyan-400 mt-3 break-all">
              Selected: {file.name}
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 flex items-start gap-2 text-emerald-400 text-sm">
              <CheckCircle2 size={18} className="shrink-0" />
              Detection completed successfully!
              Analyzed {result.sampled_frames} frame(s).
            </div>
          )}
        </div>

        {result?.media_type === "video" && (
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-3">
              ANALYZED VIDEO FRAMES
            </h3>

            <div className="flex flex-wrap gap-2">
              {result.samples?.map((frame, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => chooseFrame(index)}
                  className={`rounded-lg px-3 py-2 text-xs border ${
                    selectedFrame === index
                      ? "bg-cyan-600 border-cyan-400"
                      : "bg-slate-900 border-slate-700"
                  }`}
                >
                  {frame.time_seconds}s
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Video frames are sampled for analysis.
              Detection boxes for video are listed below,
              not drawn on the video.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-3">
              DETECTED OBJECTS
            </h3>

            {currentFrame?.detections?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentFrame.detections.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex justify-between text-sm"
                  >
                    <span className="capitalize text-slate-200">
                      {item.label}
                    </span>
                    <span className="text-cyan-400 font-semibold">
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No supported vehicles detected in this frame.
              </p>
            )}
          </div>
        )}
      </section>

      <aside className="xl:col-span-4 rounded-2xl border border-slate-800 bg-[#060c1b] p-5">
        <h3 className="font-bold text-sm mb-5">
          DETECTED VEHICLE BREAKDOWN
        </h3>

        <div className="relative w-44 h-44 mx-auto mb-7">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                total > 0
                  ? `conic-gradient(
                      #06b6d4 0% ${(counts.car || 0) / total * 100}%,
                      #f59e0b ${(counts.car || 0) / total * 100}% ${((counts.car || 0) + (counts.bus || 0)) / total * 100}%,
                      #a855f7 ${((counts.car || 0) + (counts.bus || 0)) / total * 100}% ${((counts.car || 0) + (counts.bus || 0) + (counts.truck || 0)) / total * 100}%,
                      #10b981 ${((counts.car || 0) + (counts.bus || 0) + (counts.truck || 0)) / total * 100}% 100%
                    )`
                  : "#1e293b",
            }}
          />

          <div className="absolute inset-5 rounded-full bg-[#060c1b] flex flex-col items-center justify-center">
            <span className="text-3xl font-black">{total}</span>
            <span className="text-xs text-slate-400">
              Vehicles
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {VEHICLES.map(({ key, label, color, Icon }) => (
            <div
              key={key}
              className="rounded-lg border border-slate-800 bg-slate-950 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Icon size={19} style={{ color }} />
                <span className="text-sm text-slate-300">
                  {label}
                </span>
              </div>

              <span
                className="text-xl font-bold"
                style={{ color }}
              >
                {result ? counts[key] || 0 : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
          <h4 className="text-sm font-bold text-blue-300 mb-2">
            AI VISION STATUS
          </h4>

          <p className="text-xs text-slate-400 leading-relaxed">
            {loading
              ? "YOLO model is processing your footage."
              : result
              ? "Actual detection results received from the Python backend."
              : "Waiting for traffic footage upload."}
          </p>
        </div>

        <p className="text-xs text-slate-500 mt-5 leading-relaxed">
          Counts represent detections in the selected
          frame. For videos, they are not unique
          vehicle totals across the full video.
        </p>
      </aside>
    </div>
  );
}
