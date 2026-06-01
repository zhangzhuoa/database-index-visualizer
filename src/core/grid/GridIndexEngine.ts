import type { AnimationEvent, AnimationResult, IndexEngine } from '../common';
import { GridIndex } from './GridIndex';
import type { Bounds, GridIndexOptions, GridIndexViewModel, GridPointEntry, Point } from './gridTypes';
import { createGridIndexViewModel } from './viewModel';

export type GridIndexInsertInput = GridPointEntry | Point;
export type GridIndexSearchInput = Bounds;
export type GridIndexRangeSearchInput = Bounds;

export type GridIndexInsertResult = AnimationResult<{
  point: GridPointEntry;
  inserted: boolean;
  cellId?: string;
}>;

export type GridIndexSearchResult = AnimationResult<{
  points: GridPointEntry[];
  path: string[];
}>;

export type GridIndexRangeSearchResult = GridIndexSearchResult;

export type GridIndexEngineAdapter = IndexEngine<
  'grid',
  GridIndexInsertInput,
  GridIndexSearchInput,
  GridIndexRangeSearchInput,
  { point: GridPointEntry; inserted: boolean; cellId?: string },
  { points: GridPointEntry[]; path: string[] },
  { points: GridPointEntry[]; path: string[] },
  GridIndexViewModel
>;

export class GridIndexEngine implements GridIndexEngineAdapter {
  private index: GridIndex;

  constructor(private readonly options: GridIndexOptions = {}) {
    this.index = new GridIndex(options);
  }

  getType() {
    return 'grid' as const;
  }

  insert(input: GridIndexInsertInput): GridIndexInsertResult {
    const result = this.index.insert(input);
    const rootNodeId = result.cellId ?? 'grid';
    const events: AnimationEvent[] = [];

    if (result.rejectedPoint) {
      events.push({
        type: 'grid_reject_point',
        nodeId: rootNodeId,
        pointId: result.rejectedPoint.id,
        point: result.rejectedPoint.point,
        reason: result.reason,
      });
    } else if (result.cellId) {
      events.push(
        {
          type: 'grid_compute_cell',
          nodeId: result.cellId,
          cellId: result.cellId,
          row: result.row,
          col: result.col,
          pointId: result.point.id,
          point: result.point.point,
          bounds: result.cellBounds,
        },
        {
          type: 'grid_highlight_cell',
          nodeId: result.cellId,
          cellId: result.cellId,
          row: result.row,
          col: result.col,
          pointId: result.point.id,
          point: result.point.point,
          bounds: result.cellBounds,
        },
        {
          type: 'grid_insert_point',
          nodeId: result.cellId,
          cellId: result.cellId,
          row: result.row,
          col: result.col,
          pointId: result.point.id,
          point: result.point.point,
          bounds: result.cellBounds,
        },
      );
    }

    return {
      point: result.point,
      inserted: result.inserted,
      cellId: result.cellId,
      events,
    };
  }

  search(input: GridIndexSearchInput): GridIndexSearchResult {
    return this.query(input);
  }

  rangeSearch(input: GridIndexRangeSearchInput): GridIndexRangeSearchResult {
    return this.query(input);
  }

  getViewModel(): GridIndexViewModel {
    return createGridIndexViewModel(
      this.index.getCells(),
      this.index.getBounds(),
      this.index.getRows(),
      this.index.getCols(),
    );
  }

  reset() {
    this.index = new GridIndex(this.options);
  }

  private query(input: Bounds): GridIndexSearchResult {
    const result = this.index.search(input);
    const events: AnimationEvent[] = [
      {
        type: 'grid_query_start',
        nodeId: 'grid',
        queryBounds: input,
      },
    ];

    for (const cellId of result.visitedCellIds) {
      events.push({
        type: 'grid_query_visit_cell',
        nodeId: cellId,
        cellId,
        queryBounds: input,
      });
    }

    for (const cellId of result.prunedCellIds) {
      events.push({
        type: 'grid_query_prune_cell',
        nodeId: cellId,
        cellId,
        queryBounds: input,
      });
    }

    for (const pointId of result.scannedPointIds) {
      events.push({
        type: 'grid_query_scan_point',
        nodeId: findPointCellId(this.index.getCells(), pointId),
        pointId,
        queryBounds: input,
      });
    }

    for (const point of result.points) {
      events.push({
        type: 'grid_query_hit',
        nodeId: findPointCellId(this.index.getCells(), point.id),
        pointId: point.id,
        point: point.point,
        queryBounds: input,
      });
    }

    if (result.points.length === 0) {
      events.push({
        type: 'grid_query_miss',
        nodeId: 'grid',
        queryBounds: input,
      });
    }

    return {
      points: result.points,
      path: result.visitedCellIds,
      events,
    };
  }
}

function findPointCellId(cells: ReturnType<GridIndex['getCells']>, pointId: string) {
  return cells.find((cell) => cell.entries.some((entry) => entry.id === pointId))?.id ?? 'grid';
}
