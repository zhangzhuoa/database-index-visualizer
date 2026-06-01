export interface Point {
  x: number;
  y: number;
}

export interface GridPointEntry {
  id: string;
  point: Point;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridCellCoord {
  row: number;
  col: number;
}

export interface GridCell {
  id: string;
  row: number;
  col: number;
  bounds: Bounds;
  entries: GridPointEntry[];
}

export interface GridIndexOptions {
  worldBounds?: Bounds;
  rows?: number;
  cols?: number;
}

export interface GridIndexInsertResult {
  point: GridPointEntry;
  inserted: boolean;
  cellId?: string;
  row?: number;
  col?: number;
  cellBounds?: Bounds;
  rejectedPoint?: GridPointEntry;
  reason?: string;
}

export interface GridIndexSearchResult {
  points: GridPointEntry[];
  visitedCellIds: string[];
  prunedCellIds: string[];
  scannedPointIds: string[];
}

export interface GridIndexViewPoint extends GridPointEntry {
  cellId: string;
}

export interface GridIndexViewCell {
  id: string;
  row: number;
  col: number;
  bounds: Bounds;
  entries: GridIndexViewPoint[];
}

export interface GridIndexViewModel {
  indexType: 'grid';
  bounds: Bounds;
  rows: number;
  cols: number;
  cells: GridIndexViewCell[];
  points: GridIndexViewPoint[];
  width: number;
  height: number;
}
