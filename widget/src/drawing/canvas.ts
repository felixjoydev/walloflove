import type { DrawingData } from "@shared/types/drawing";
import { MAX_STROKES, MAX_POINTS_TOTAL } from "@shared/types/drawing";
import { PEN_COLORS, PEN_SIZES } from "./colors";
import type { PenColor, PenSize } from "./colors";
import { strokeDataToSvg } from "./stroke-to-svg";

interface Stroke {
  points: [number, number, number][];
  color: string;
  size: number;
}

export class DrawingCanvas {
  #canvas: HTMLCanvasElement;
  #ctx: CanvasRenderingContext2D;
  #svgPreview: HTMLElement;
  #strokes: Stroke[] = [];
  #currentStroke: Stroke | null = null;
  #activePointerId: number | null = null;
  #color: PenColor = PEN_COLORS[0];
  #size: PenSize = PEN_SIZES[1].value;
  #canvasWidth: number;
  #canvasHeight: number;
  #dpr: number;
  #onChange: () => void;

  constructor(
    container: HTMLElement,
    width: number,
    height: number,
    onChange: () => void
  ) {
    this.#canvasWidth = width;
    this.#canvasHeight = height;
    this.#onChange = onChange;
    this.#dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.#canvas = document.createElement("canvas");
    this.#canvas.width = width * this.#dpr;
    this.#canvas.height = height * this.#dpr;
    this.#canvas.style.width = `${width}px`;
    this.#canvas.style.height = `${height}px`;
    this.#canvas.style.touchAction = "none";
    this.#canvas.className = "sb-canvas";

    this.#ctx = this.#canvas.getContext("2d")!;
    this.#ctx.scale(this.#dpr, this.#dpr);

    this.#svgPreview = document.createElement("div");
    this.#svgPreview.className = "sb-canvas-preview";
    this.#svgPreview.style.display = "none";

    container.appendChild(this.#canvas);
    container.appendChild(this.#svgPreview);

    this.#bindEvents();
    this.#clearCanvas();
  }

  #bindEvents() {
    this.#canvas.addEventListener("pointerdown", this.#onPointerDown, {
      passive: false,
    });
    this.#canvas.addEventListener("pointermove", this.#onPointerMove, {
      passive: false,
    });
    this.#canvas.addEventListener("pointerup", this.#onPointerUp);
    this.#canvas.addEventListener("pointercancel", this.#onPointerUp);
    this.#canvas.addEventListener("pointerleave", this.#onPointerUp);
  }

  #onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    if (this.#activePointerId !== null) return; // Single pointer only
    if (this.#strokes.length >= MAX_STROKES) return;

    this.#activePointerId = e.pointerId;
    this.#canvas.setPointerCapture(e.pointerId);

    const [x, y] = this.#getCoords(e);
    this.#currentStroke = {
      points: [[x, y, e.pressure || 0.5]],
      color: this.#color,
      size: this.#size,
    };
  };

  #onPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    if (e.pointerId !== this.#activePointerId || !this.#currentStroke) return;

    const totalPoints = this.#strokes.reduce(
      (sum, s) => sum + s.points.length,
      0
    );
    if (totalPoints + this.#currentStroke.points.length >= MAX_POINTS_TOTAL)
      return;

    const [x, y] = this.#getCoords(e);
    this.#currentStroke.points.push([x, y, e.pressure || 0.5]);
    this.#redraw();
  };

  #onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== this.#activePointerId) return;
    this.#activePointerId = null;

    if (this.#currentStroke && this.#currentStroke.points.length > 1) {
      this.#strokes.push(this.#currentStroke);
      this.#onChange();
    }
    this.#currentStroke = null;
    this.#redraw();
  };

  #getCoords(e: PointerEvent): [number, number] {
    const rect = this.#canvas.getBoundingClientRect();
    const x = Math.round(
      ((e.clientX - rect.left) / rect.width) * this.#canvasWidth
    );
    const y = Math.round(
      ((e.clientY - rect.top) / rect.height) * this.#canvasHeight
    );
    return [x, y];
  }

  #clearCanvas() {
    this.#ctx.clearRect(0, 0, this.#canvasWidth, this.#canvasHeight);
  }

  #redraw() {
    this.#clearCanvas();

    // Render all strokes + current stroke as SVG overlay for crisp display
    const allStrokes = this.#currentStroke
      ? [...this.#strokes, this.#currentStroke]
      : this.#strokes;

    if (allStrokes.length === 0) return;

    const data: DrawingData = {
      version: 1,
      width: this.#canvasWidth,
      height: this.#canvasHeight,
      strokes: allStrokes,
    };

    const svg = strokeDataToSvg(data);
    this.#svgPreview.innerHTML = svg;
    this.#svgPreview.style.display = "block";
    this.#canvas.style.opacity = "0";
  }

  setColor(color: PenColor) {
    this.#color = color;
  }

  setSize(size: PenSize) {
    this.#size = size;
  }

  undo() {
    if (this.#strokes.length === 0) return;
    this.#strokes.pop();
    this.#onChange();
    if (this.#strokes.length === 0) {
      this.#svgPreview.style.display = "none";
      this.#canvas.style.opacity = "1";
      this.#clearCanvas();
    } else {
      this.#redraw();
    }
  }

  clear() {
    this.#strokes = [];
    this.#svgPreview.style.display = "none";
    this.#canvas.style.opacity = "1";
    this.#clearCanvas();
    this.#onChange();
  }

  isEmpty(): boolean {
    return this.#strokes.length === 0;
  }

  getDrawingData(): DrawingData {
    return {
      version: 1,
      width: this.#canvasWidth,
      height: this.#canvasHeight,
      strokes: this.#strokes.map((s) => ({
        points: s.points.map(
          ([x, y, p]) => [x, y, p] as readonly [number, number, number]
        ),
        color: s.color,
        size: s.size,
      })),
    };
  }

  destroy() {
    this.#canvas.removeEventListener("pointerdown", this.#onPointerDown);
    this.#canvas.removeEventListener("pointermove", this.#onPointerMove);
    this.#canvas.removeEventListener("pointerup", this.#onPointerUp);
    this.#canvas.removeEventListener("pointercancel", this.#onPointerUp);
    this.#canvas.removeEventListener("pointerleave", this.#onPointerUp);
  }
}

export function createToolbar(
  container: HTMLElement,
  canvas: DrawingCanvas
): void {
  const toolbar = document.createElement("div");
  toolbar.className = "sb-toolbar";

  // Color picker
  const colorRow = document.createElement("div");
  colorRow.className = "sb-color-row";
  PEN_COLORS.forEach((color) => {
    const btn = document.createElement("button");
    btn.className = "sb-color-btn";
    btn.style.backgroundColor = color;
    btn.setAttribute("aria-label", `Pen color ${color}`);
    btn.addEventListener("click", () => {
      canvas.setColor(color);
      colorRow.querySelectorAll(".sb-color-btn").forEach((b) =>
        b.classList.remove("sb-active")
      );
      btn.classList.add("sb-active");
    });
    if (color === PEN_COLORS[0]) btn.classList.add("sb-active");
    colorRow.appendChild(btn);
  });
  toolbar.appendChild(colorRow);

  // Size picker
  const sizeRow = document.createElement("div");
  sizeRow.className = "sb-size-row";
  PEN_SIZES.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = "sb-size-btn";
    btn.textContent = s.label;
    btn.setAttribute("aria-label", `Pen size ${s.label}`);
    btn.addEventListener("click", () => {
      canvas.setSize(s.value);
      sizeRow.querySelectorAll(".sb-size-btn").forEach((b) =>
        b.classList.remove("sb-active")
      );
      btn.classList.add("sb-active");
    });
    if (s.value === PEN_SIZES[1].value) btn.classList.add("sb-active");
    sizeRow.appendChild(btn);
  });
  toolbar.appendChild(sizeRow);

  // Action buttons
  const actionRow = document.createElement("div");
  actionRow.className = "sb-action-row";

  const undoBtn = document.createElement("button");
  undoBtn.className = "sb-action-btn";
  undoBtn.textContent = "Undo";
  undoBtn.setAttribute("aria-label", "Undo last stroke");
  undoBtn.addEventListener("click", () => canvas.undo());
  actionRow.appendChild(undoBtn);

  const clearBtn = document.createElement("button");
  clearBtn.className = "sb-action-btn";
  clearBtn.textContent = "Clear";
  clearBtn.setAttribute("aria-label", "Clear drawing");
  clearBtn.addEventListener("click", () => canvas.clear());
  actionRow.appendChild(clearBtn);

  toolbar.appendChild(actionRow);
  container.appendChild(toolbar);
}
