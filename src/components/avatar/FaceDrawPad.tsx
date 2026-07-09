"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { encodeFaceDrawing } from "@/lib/avatars";
import type { DrawStroke } from "@/lib/avatars";

interface FaceDrawPadProps {
  /** Called with the new "draw:..." encoding whenever strokes change */
  onChange: (faceEncoding: string) => void;
  /** Initial strokes to populate (decoded from face string) */
  initialStrokes?: DrawStroke[];
  /** Brush color — controlled by the shared Ink Color section outside the pad */
  brushColor?: string;
}

const PAD_SIZE = 240; // px square canvas
const DEFAULT_INK = "#2C1810";

// ── Stroke simplification (Ramer-Douglas-Peucker) ─────────────────────────
function vecDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function perpendicularDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return vecDist(px, py, ax, ay);
  return Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
}

function rdp(pts: number[], epsilon: number): number[] {
  if (pts.length < 4) return pts;
  const n = pts.length / 2;
  let maxDist = 0;
  let maxIdx = 0;
  const ax = pts[0], ay = pts[1];
  const bx = pts[n * 2 - 2], by = pts[n * 2 - 1];
  for (let i = 1; i < n - 1; i++) {
    const d = perpendicularDist(pts[i * 2], pts[i * 2 + 1], ax, ay, bx, by);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left  = rdp(pts.slice(0, (maxIdx + 1) * 2), epsilon);
    const right = rdp(pts.slice(maxIdx * 2), epsilon);
    return [...left.slice(0, -2), ...right];
  }
  return [ax, ay, bx, by];
}

// ── Brush size config ──────────────────────────────────────────────────────
type BrushMode = "thin" | "medium" | "thick" | "eraser";

const BRUSH_WIDTHS: Record<BrushMode, number> = {
  thin:   1.6,
  medium: 3.5,
  thick:  6.0,
  eraser: 14.0,
};

// Map display pixel widths to stored integer widths (1-9)
const BRUSH_STORED_WIDTH: Record<Exclude<BrushMode, "eraser">, number> = {
  thin:   1,
  medium: 4,
  thick:  8,
};

export default function FaceDrawPad({ onChange, initialStrokes = [], brushColor }: FaceDrawPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<DrawStroke[]>(initialStrokes);
  const [brushMode, setBrushMode] = useState<BrushMode>("thin");
  const currentStrokeRef = useRef<number[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Brush color comes from the shared Ink Color section; picking a color
  // there while erasing switches back to drawing.
  const activeColor = brushColor ?? DEFAULT_INK;
  useEffect(() => {
    setBrushMode((prev) => (prev === "eraser" ? "thin" : prev));
  }, [activeColor]);

  // ── Canvas rendering ─────────────────────────────────────────────────────

  const redrawCanvas = useCallback((strokeList: DrawStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, PAD_SIZE, PAD_SIZE);

    // Parchment background
    ctx.fillStyle = "rgba(245,240,232,0.92)";
    ctx.fillRect(0, 0, PAD_SIZE, PAD_SIZE);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokeList) {
      const pts = stroke.points;
      if (pts.length < 4) continue;
      const color = stroke.color ?? DEFAULT_INK;
      const storedW = stroke.width ?? 1;
      // Map stored 1-9 back to canvas px — thin=1.6, med=3.5, thick=6
      const canvasPx = storedW <= 1 ? 1.6 : storedW <= 4 ? 3.5 : storedW <= 7 ? 6.0 : 6.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = canvasPx;
      ctx.beginPath();
      // Smooth the simplified points with quadratics through midpoints, so
      // stored strokes redraw as flowing lines rather than visible corners.
      const px = (i: number) => (pts[i] / 100) * PAD_SIZE;
      ctx.moveTo(px(0), px(1));
      let i = 2;
      for (; i + 3 < pts.length; i += 2) {
        const midX = (px(i) + px(i + 2)) / 2;
        const midY = (px(i + 1) + px(i + 3)) / 2;
        ctx.quadraticCurveTo(px(i), px(i + 1), midX, midY);
      }
      if (i + 1 < pts.length) ctx.lineTo(px(i), px(i + 1));
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    redrawCanvas(strokes);
  }, [redrawCanvas, strokes]);

  function getCanvasPos(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * PAD_SIZE,
      y: ((e.clientY - rect.top)  / rect.height) * PAD_SIZE,
    };
  }

  // ── Eraser: find and remove the stroke nearest the touch point ────────────

  function handleErase(x: number, y: number, strokeList: DrawStroke[]): DrawStroke[] {
    // Find the stroke with any point within eraser radius
    const ERASE_RADIUS = BRUSH_WIDTHS.eraser / 2;
    const qx = (x / PAD_SIZE) * 100;
    const qy = (y / PAD_SIZE) * 100;
    const eR = (ERASE_RADIUS / PAD_SIZE) * 100;
    let closestIdx = -1;
    let closestDist = Infinity;

    for (let si = 0; si < strokeList.length; si++) {
      const pts = strokeList[si].points;
      for (let i = 0; i + 1 < pts.length; i += 2) {
        const d = Math.sqrt((pts[i] - qx) ** 2 + (pts[i + 1] - qy) ** 2);
        if (d < eR && d < closestDist) {
          closestDist = d;
          closestIdx = si;
        }
      }
    }

    if (closestIdx >= 0) {
      return strokeList.filter((_, i) => i !== closestIdx);
    }
    return strokeList;
  }

  // ── Pointer events ────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ }
    const { x, y } = getCanvasPos(e);

    if (brushMode === "eraser") {
      const updated = handleErase(x, y, strokes);
      if (updated.length !== strokes.length) {
        setStrokes(updated);
        redrawCanvas(updated);
        onChange(updated.length > 0 ? encodeFaceDrawing(updated) : "none");
      }
      isDrawingRef.current = true;
      lastPointRef.current = { x, y };
      return;
    }

    isDrawingRef.current = true;
    currentStrokeRef.current = [x, y];
    lastPointRef.current = { x, y };

    // Paint a starting dot
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      const lw = BRUSH_WIDTHS[brushMode];
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = activeColor;
      ctx.lineCap = "round";
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(x, y, lw / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    const last = lastPointRef.current;
    if (!last) return;

    if (brushMode === "eraser") {
      // Erase on drag too
      const updated = handleErase(x, y, strokes);
      if (updated.length !== strokes.length) {
        setStrokes(updated);
        redrawCanvas(updated);
        onChange(updated.length > 0 ? encodeFaceDrawing(updated) : "none");
      }
      lastPointRef.current = { x, y };
      return;
    }

    // Live draw
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      const lw = BRUSH_WIDTHS[brushMode];
      ctx.strokeStyle = activeColor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    currentStrokeRef.current.push(x, y);
    lastPointRef.current = { x, y };
  }

  function handlePointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (brushMode === "eraser") return;

    const rawPts = currentStrokeRef.current;
    currentStrokeRef.current = [];

    // A tap with no movement (e.g. placing an eye dot) only ever collects
    // the single starting point. Duplicate it into a zero-length 2-point
    // stroke so it round-trips through simplify/encode/parse like any other
    // stroke — otherwise the dot is painted once to the canvas pixels but
    // never saved to state, so it's invisible on the pot and vanishes on
    // the next redraw.
    if (rawPts.length === 2) {
      rawPts.push(rawPts[0], rawPts[1]);
    } else if (rawPts.length < 4) {
      return;
    }

    // Simplify with RDP (epsilon = 1.5px for the 160px canvas)
    const simplified = rdp(rawPts, 1.5);

    // Quantize to [0..100] face-zone space
    const quantized = simplified.map((v, i) => {
      // Even = x, odd = y; both use PAD_SIZE
      return Math.round((v / PAD_SIZE) * 100);
    });

    const storedWidth = BRUSH_STORED_WIDTH[brushMode as Exclude<BrushMode, "eraser">] ?? 1;

    const newStroke: DrawStroke = {
      points: quantized,
      color: activeColor,
      width: storedWidth,
    };

    // Cap: max 20 strokes or 300 total points
    const updatedStrokes = [...strokes, newStroke];
    let totalPts = updatedStrokes.reduce((sum, s) => sum + s.points.length, 0);
    while (totalPts > 300 && updatedStrokes.length > 1) {
      const removed = updatedStrokes.shift()!;
      totalPts -= removed.points.length;
    }
    if (updatedStrokes.length > 20) updatedStrokes.shift();

    setStrokes(updatedStrokes);
    onChange(encodeFaceDrawing(updatedStrokes));
  }

  function handlePointerCancel() {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    currentStrokeRef.current = [];
    // Redraw without the in-progress stroke
    redrawCanvas(strokes);
  }

  function handleUndo() {
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    redrawCanvas(updated);
    onChange(updated.length > 0 ? encodeFaceDrawing(updated) : "none");
  }

  function handleClear() {
    setStrokes([]);
    redrawCanvas([]);
    onChange("none");
  }

  const isEraser = brushMode === "eraser";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* ── Canvas ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          border: "2px dashed rgba(44,24,16,0.35)",
          boxShadow: "inset 0 2px 8px rgba(44,24,16,0.08)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={PAD_SIZE}
          height={PAD_SIZE}
          style={{
            display: "block",
            touchAction: "none",
            cursor: isEraser ? "cell" : "crosshair",
            borderRadius: 8,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          aria-label="Draw your face"
        />
        {/* Crosshair guide */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.10,
          }}
          width={PAD_SIZE}
          height={PAD_SIZE}
        >
          <line x1={PAD_SIZE / 2} y1="10" x2={PAD_SIZE / 2} y2={PAD_SIZE - 10}
            stroke="#2C1810" strokeWidth="0.8" strokeDasharray="2 4" />
          <line x1="10" y1={PAD_SIZE / 2} x2={PAD_SIZE - 10} y2={PAD_SIZE / 2}
            stroke="#2C1810" strokeWidth="0.8" strokeDasharray="2 4" />
        </svg>
      </div>

      {/* ── Tool row: brush sizes + eraser + undo + clear ─────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {/* Brush sizes */}
        {(["thin", "medium", "thick"] as const).map((mode) => {
          const isActive = brushMode === mode;
          const dotR = mode === "thin" ? 2 : mode === "medium" ? 3.5 : 5.5;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setBrushMode(mode);
              }}
              aria-label={`${mode} brush`}
              aria-pressed={isActive}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: isActive ? "2px solid #2C1810" : "1.5px solid rgba(44,24,16,0.25)",
                background: isActive ? "rgba(184,92,42,0.14)" : "rgba(232,213,176,0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "transform 0.1s",
                transform: isActive ? "scale(1.12)" : "scale(1)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r={dotR}
                  fill={isActive ? "#2C1810" : "rgba(44,24,16,0.5)"}
                />
              </svg>
            </button>
          );
        })}

        {/* Eraser */}
        <button
          type="button"
          onClick={() => setBrushMode("eraser")}
          aria-label="Eraser"
          aria-pressed={isEraser}
          title="Eraser (removes the nearest stroke)"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: isEraser ? "2px solid #B85C2A" : "1.5px solid rgba(44,24,16,0.25)",
            background: isEraser ? "rgba(184,92,42,0.18)" : "rgba(232,213,176,0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: "0.85rem",
            transition: "transform 0.1s",
            transform: isEraser ? "scale(1.12)" : "scale(1)",
          }}
        >
          ◻
        </button>

        {/* Undo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={strokes.length === 0}
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "0.76rem",
            color: strokes.length === 0 ? "rgba(44,24,16,0.3)" : "#5C3D2E",
            background: "rgba(232,213,176,0.4)",
            border: "1.5px solid rgba(44,24,16,0.2)",
            borderRadius: 7,
            padding: "3px 9px",
            cursor: strokes.length === 0 ? "default" : "pointer",
          }}
        >
          ↩
        </button>

        {/* Clear */}
        <button
          type="button"
          onClick={handleClear}
          disabled={strokes.length === 0}
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "0.76rem",
            color: strokes.length === 0 ? "rgba(44,24,16,0.3)" : "#B85C2A",
            background: "rgba(232,213,176,0.4)",
            border: "1.5px solid rgba(44,24,16,0.2)",
            borderRadius: 7,
            padding: "3px 9px",
            cursor: strokes.length === 0 ? "default" : "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <p
        style={{
          fontFamily: "var(--font-hand)",
          fontSize: "0.68rem",
          color: "rgba(92,61,46,0.55)",
          textAlign: "center",
          margin: 0,
        }}
      >
        draw a face — your strokes appear on the pot
      </p>
    </div>
  );
}
