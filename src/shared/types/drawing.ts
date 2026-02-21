export interface DrawingData {
  version: 1;
  width: number;
  height: number;
  strokes: ReadonlyArray<{
    points: ReadonlyArray<readonly [x: number, y: number, pressure: number]>;
    color: string;
    size: number;
    tool?: "pencil" | "marker" | "eraser";
    opacity?: number;
  }>;
}

export const MAX_STROKE_DATA_SIZE = 50 * 1024; // 50KB
export const MAX_STROKES = 100;
export const MAX_POINTS_TOTAL = 5000;
