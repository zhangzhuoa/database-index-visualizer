import { containsPoint, intersectsBounds } from './geometry';
import type {
  Bounds,
  GridCell,
  GridCellCoord,
  GridIndexInsertResult,
  GridIndexOptions,
  GridIndexSearchResult,
  GridPointEntry,
  Point,
} from './gridTypes';

const DEFAULT_WORLD_BOUNDS: Bounds = { x: 0, y: 0, width: 100, height: 100 };
const DEFAULT_ROWS = 5;
const DEFAULT_COLS = 5;

export class GridIndex {
  private cells: GridCell[] = [];

  private nextPointId = 1;

  private readonly worldBounds: Bounds;

  private readonly rows: number;

  private readonly cols: number;

  constructor(options: GridIndexOptions = {}) {
    this.worldBounds = { ...(options.worldBounds ?? DEFAULT_WORLD_BOUNDS) };
    this.rows = options.rows ?? DEFAULT_ROWS;
    this.cols = options.cols ?? DEFAULT_COLS;

    if (!Number.isInteger(this.rows) || this.rows < 1) {
      throw new Error('GridIndex rows must be a positive integer.');
    }

    if (!Number.isInteger(this.cols) || this.cols < 1) {
      throw new Error('GridIndex cols must be a positive integer.');
    }

    this.cells = this.createCells();
  }

  getBounds() {
    return { ...this.worldBounds };
  }

  getRows() {
    return this.rows;
  }

  getCols() {
    return this.cols;
  }

  getCells() {
    return this.cells;
  }

  getCell(id: string) {
    return this.cells.find((cell) => cell.id === id);
  }

  insert(input: GridPointEntry | Point): GridIndexInsertResult {
    const point = this.normalizePoint(input);

    if (!containsPoint(this.worldBounds, point.point)) {
      return {
        point,
        inserted: false,
        rejectedPoint: point,
        reason: 'outside_world_bounds',
      };
    }

    const coord = this.computeCellCoord(point.point);
    const cell = this.getCellByCoord(coord);
    cell.entries.push(point);

    return {
      point,
      inserted: true,
      cellId: cell.id,
      row: cell.row,
      col: cell.col,
      cellBounds: { ...cell.bounds },
    };
  }

  search(query: Bounds): GridIndexSearchResult {
    const points: GridPointEntry[] = [];
    const visitedCellIds: string[] = [];
    const prunedCellIds: string[] = [];
    const scannedPointIds: string[] = [];

    if (!intersectsBounds(this.worldBounds, query)) {
      return { points, visitedCellIds, prunedCellIds, scannedPointIds };
    }

    for (const cell of this.cells) {
      if (!intersectsBounds(cell.bounds, query)) {
        prunedCellIds.push(cell.id);
        continue;
      }

      visitedCellIds.push(cell.id);

      for (const entry of cell.entries) {
        scannedPointIds.push(entry.id);

        if (containsPoint(query, entry.point)) {
          points.push(entry);
        }
      }
    }

    return { points, visitedCellIds, prunedCellIds, scannedPointIds };
  }

  reset() {
    this.nextPointId = 1;
    this.cells = this.createCells();
  }

  private createCells() {
    const cells: GridCell[] = [];
    const cellWidth = this.worldBounds.width / this.cols;
    const cellHeight = this.worldBounds.height / this.rows;

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        cells.push({
          id: createCellId(row, col),
          row,
          col,
          bounds: {
            x: this.worldBounds.x + col * cellWidth,
            y: this.worldBounds.y + row * cellHeight,
            width: cellWidth,
            height: cellHeight,
          },
          entries: [],
        });
      }
    }

    return cells;
  }

  private computeCellCoord(point: Point): GridCellCoord {
    const cellWidth = this.worldBounds.width / this.cols;
    const cellHeight = this.worldBounds.height / this.rows;

    return {
      row: Math.min(this.rows - 1, Math.floor((point.y - this.worldBounds.y) / cellHeight)),
      col: Math.min(this.cols - 1, Math.floor((point.x - this.worldBounds.x) / cellWidth)),
    };
  }

  private getCellByCoord(coord: GridCellCoord) {
    const cell = this.cells.find((candidate) => candidate.row === coord.row && candidate.col === coord.col);

    if (!cell) {
      throw new Error(`Missing grid cell at row ${coord.row}, col ${coord.col}.`);
    }

    return cell;
  }

  private normalizePoint(input: GridPointEntry | Point): GridPointEntry {
    if ('point' in input) {
      return {
        id: input.id,
        point: { ...input.point },
      };
    }

    const id = `point-${this.nextPointId}`;
    this.nextPointId += 1;

    return {
      id,
      point: { ...input },
    };
  }
}

function createCellId(row: number, col: number) {
  return `cell-${row}-${col}`;
}
