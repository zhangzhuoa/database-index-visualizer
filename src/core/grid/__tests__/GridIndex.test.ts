import { describe, expect, test } from 'vitest';
import { GridIndex } from '../GridIndex';
import type { GridPointEntry } from '../gridTypes';

const POINTS: GridPointEntry[] = [
  { id: 'north-west', point: { x: 10, y: 10 } },
  { id: 'center', point: { x: 50, y: 50 } },
  { id: 'south-east', point: { x: 90, y: 90 } },
  { id: 'right-bottom-edge', point: { x: 100, y: 100 } },
];

describe('GridIndex core logic', () => {
  test('initializes fixed grid cells for the configured rows and columns', () => {
    const index = new GridIndex({ rows: 2, cols: 3 });

    expect(index.getCells()).toHaveLength(6);
    expect(index.getCell('cell-0-0')?.bounds).toEqual({ x: 0, y: 0, width: 100 / 3, height: 50 });
    expect(index.getCell('cell-1-2')?.bounds).toEqual({ x: 200 / 3, y: 50, width: 100 / 3, height: 50 });
  });

  test('inserts points into deterministic grid cells', () => {
    const index = new GridIndex({ rows: 5, cols: 5 });

    const first = index.insert(POINTS[0]);
    const second = index.insert(POINTS[2]);

    expect(first.inserted).toBe(true);
    expect(first.cellId).toBe('cell-0-0');
    expect(second.cellId).toBe('cell-4-4');
    expect(index.getCell('cell-0-0')?.entries.map((entry) => entry.id)).toEqual(['north-west']);
    expect(index.getCell('cell-4-4')?.entries.map((entry) => entry.id)).toEqual(['south-east']);
  });

  test('uses stable east and south cell rules for boundary points', () => {
    const index = new GridIndex({ rows: 5, cols: 5 });

    const center = index.insert(POINTS[1]);
    const edge = index.insert(POINTS[3]);

    expect(center.cellId).toBe('cell-2-2');
    expect(edge.cellId).toBe('cell-4-4');
  });

  test('does not insert points outside the world bounds', () => {
    const index = new GridIndex();

    const result = index.insert({ id: 'outside', point: { x: 120, y: 10 } });

    expect(result.inserted).toBe(false);
    expect(result.rejectedPoint?.id).toBe('outside');
    expect(index.getCells().flatMap((cell) => cell.entries)).toEqual([]);
  });

  test('range query scans intersecting cells and returns points inside the query rectangle only', () => {
    const index = new GridIndex({ rows: 5, cols: 5 });
    for (const point of POINTS.slice(0, 3)) {
      index.insert(point);
    }

    const result = index.search({ x: 0, y: 0, width: 55, height: 55 });

    expect(result.points.map((point) => point.id).sort()).toEqual(['center', 'north-west']);
    expect(result.visitedCellIds).toContain('cell-0-0');
    expect(result.visitedCellIds).toContain('cell-2-2');
    expect(result.prunedCellIds).toContain('cell-4-4');
  });

  test('range query outside the world bounds returns no points', () => {
    const index = new GridIndex();
    index.insert(POINTS[0]);

    const result = index.search({ x: 120, y: 120, width: 10, height: 10 });

    expect(result.points).toEqual([]);
    expect(result.visitedCellIds).toEqual([]);
  });

  test('reset clears all grid cells', () => {
    const index = new GridIndex();
    index.insert(POINTS[0]);

    index.reset();

    expect(index.getCells().flatMap((cell) => cell.entries)).toEqual([]);
  });
});
