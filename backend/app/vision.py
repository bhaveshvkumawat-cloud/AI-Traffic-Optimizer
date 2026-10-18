
from collections import Counter
from pathlib import Path
import tempfile
import os

import cv2
from fastapi import HTTPException

# ==========================================
# NEXUS AI - YOLO VEHICLE DETECTION
# ==========================================

MODEL = None

MODEL_NAME = "yolov8s.pt"

LABELS = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

ALLOWED = {
    ".jpg",
    ".jpeg",
    ".png",
    ".mp4",
    ".avi",
    ".mov"
}

MAX_BYTES = 500 * 1024 * 1024

CONFIDENCE = 0.45
IMAGE_SIZE = 960

MAX_VIDEO_SAMPLES = 12


# ==========================================
# LOAD YOLO MODEL
# ==========================================

def get_model():
    global MODEL

    if MODEL is None:
        from ultralytics import YOLO

        print("Loading YOLOv8s model...")

        MODEL = YOLO(MODEL_NAME)

        print("YOLOv8s model loaded successfully!")

    return MODEL


# ==========================================
# DETECT VEHICLES IN FRAME
# ==========================================

def infer(frame, model):

    result = model.predict(
        source=frame,
        conf=CONFIDENCE,
        imgsz=IMAGE_SIZE,
        classes=list(LABELS.keys()),
        verbose=False,
        device="cpu"
    )[0]

    boxes = []
    counts = Counter()

    if result.boxes is None:
        return boxes, counts

    for box in result.boxes:

        class_id = int(box.cls.item())

        if class_id not in LABELS:
            continue

        label = LABELS[class_id]

        confidence = round(
            float(box.conf.item()),
            3
        )

        coordinates = [
            round(float(value), 1)
            for value in box.xyxy[0].tolist()
        ]

        counts[label] += 1

        boxes.append({
            "label": label,
            "confidence": confidence,
            "xyxy": coordinates
        })

    return boxes, counts


# ==========================================
# FORMAT VEHICLE COUNTS
# ==========================================

def format_counts(counts):

    return {
        "car": counts["car"],
        "motorcycle": counts["motorcycle"],
        "bus": counts["bus"],
        "truck": counts["truck"]
    }


# ==========================================
# ANALYZE UPLOADED IMAGE OR VIDEO
# ==========================================

async def analyze_upload(file):

    suffix = Path(
        file.filename or ""
    ).suffix.lower()

    if suffix not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=(
                "Supported formats: "
                "JPG, JPEG, PNG, MP4, AVI, MOV"
            )
        )

    path = None

    try:

        # ----------------------------------
        # SAVE UPLOADED FILE TEMPORARILY
        # ----------------------------------

        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            delete=False
        ) as temp_file:

            path = temp_file.name

            total_size = 0

            while True:

                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "File must be "
                            "500 MB or smaller"
                        )
                    )

                temp_file.write(chunk)

        # ----------------------------------
        # LOAD YOLO MODEL
        # ----------------------------------

        model = get_model()

        # ==================================
        # IMAGE DETECTION
        # ==================================

        if suffix in {
            ".jpg",
            ".jpeg",
            ".png"
        }:

            frame = cv2.imread(path)

            if frame is None:
                raise HTTPException(
                    status_code=400,
                    detail="Could not read image"
                )

            boxes, counts = infer(
                frame,
                model
            )

            return {
                "media_type": "image",
                "width": frame.shape[1],
                "height": frame.shape[0],
                "detections": boxes,
                "counts": format_counts(counts),
                "sampled_frames": 1,
                "note": (
                    "YOLOv8s vehicle detections "
                    "in uploaded image"
                )
            }

        # ==================================
        # VIDEO DETECTION
        # ==================================

        cap = cv2.VideoCapture(path)

        if not cap.isOpened():
            raise HTTPException(
                status_code=400,
                detail="Could not read video"
            )

        try:

            fps = cap.get(
                cv2.CAP_PROP_FPS
            )

            if fps <= 0:
                fps = 25

            frame_count = int(
                cap.get(
                    cv2.CAP_PROP_FRAME_COUNT
                )
            )

            if frame_count <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Video frame count "
                        "unavailable"
                    )
                )

            sample_count = min(
                MAX_VIDEO_SAMPLES,
                frame_count
            )

            indexes = sorted(
                set(
                    int(
                        i * (frame_count - 1)
                        / max(
                            1,
                            sample_count - 1
                        )
                    )
                    for i in range(sample_count)
                )
            )

            samples = []

            peak_counts = Counter()

            # ------------------------------
            # PROCESS SAMPLED VIDEO FRAMES
            # ------------------------------

            for index in indexes:

                cap.set(
                    cv2.CAP_PROP_POS_FRAMES,
                    index
                )

                success, frame = cap.read()

                if not success:
                    continue

                boxes, counts = infer(
                    frame,
                    model
                )

                # Highest count seen in
                # any analyzed frame

                for label in LABELS.values():

                    peak_counts[label] = max(
                        peak_counts[label],
                        counts[label]
                    )

                samples.append({
                    "time_seconds": round(
                        index / fps,
                        2
                    ),
                    "width": frame.shape[1],
                    "height": frame.shape[0],
                    "detections": boxes,
                    "counts": format_counts(
                        counts
                    )
                })

            if not samples:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "No video frames "
                        "could be decoded"
                    )
                )

            # ------------------------------
            # RETURN VIDEO DETECTION RESULT
            # ------------------------------

            return {
                "media_type": "video",
                "samples": samples,
                "sampled_frames": len(samples),
                "counts": format_counts(
                    peak_counts
                ),
                "note": (
                    "YOLOv8s peak detections "
                    "across sampled frames. "
                    "Not unique vehicle totals."
                )
            }

        finally:
            cap.release()

    # ======================================
    # ERROR HANDLING
    # ======================================

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "YOLO detection failed: "
                f"{str(error)[:200]}"
            )
        )

    # ======================================
    # CLEANUP TEMPORARY FILE
    # ======================================

    finally:

        await file.close()

        if path and os.path.exists(path):
            os.unlink(path)
