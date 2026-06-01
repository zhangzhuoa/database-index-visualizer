import { describe, expect, test } from 'vitest';
import type { IndexEngine } from '../../common';
import { GridIndexEngine } from '../GridIndexEngine';
import type { GridIndexViewModel } from '../gridTypes';

describe('GridIndexEngine', () => {
  test('exposes grid type through IndexEngine', () => {
    const engine: IndexEngine<
      'grid',
      { x: number; y: number },
      unknown,
      unknown,
      object,
      Record<string, unknown>,
      Record<string, unknown>,
      GridIndexViewModel
    > = new GridIndexEngine();

    expect(engine.getType()).toBe('grid');
  });

  test('insert returns animation events and view model data', () => {
    const engine = new GridIndexEngine({ rows: 5, cols: 5 });

    const result = engine.insert({ x: 10, y: 10 });
    const viewModel = engine.getViewModel();

    expect(result.events.map((event) => event.type)).toEqual([
      'grid_compute_cell',
      'grid_highlight_cell',
      'grid_insert_point',
    ]);
    expect(result.point.id).toBeTruthy();
    expect(result.inserted).toBe(true);
    expect(result.cellId).toBe('cell-0-0');
    expect(viewModel.indexType).toBe('grid');
    expect(viewModel.cells).toHaveLength(25);
    expect(viewModel.points).toHaveLength(1);
  });

  test('insert reports rejected points outside world bounds', () => {
    const engine = new GridIndexEngine();

    const result = engine.insert({ id: 'outside', point: { x: 120, y: 10 } });

    expect(result.inserted).toBe(false);
    expect(result.events.some((event) => event.type === 'grid_reject_point')).toBe(true);
    expect(engine.getViewModel().points).toEqual([]);
  });

  test('rangeSearch returns matching points and query events', () => {
    const engine = new GridIndexEngine({ rows: 5, cols: 5 });
    engine.insert({ id: 'a', point: { x: 10, y: 10 } });
    engine.insert({ id: 'b', point: { x: 80, y: 80 } });

    const result = engine.rangeSearch({ x: 0, y: 0, width: 20, height: 20 });

    expect(result.points.map((point) => point.id)).toEqual(['a']);
    expect(result.events.some((event) => event.type === 'grid_query_start')).toBe(true);
    expect(result.events.some((event) => event.type === 'grid_query_visit_cell')).toBe(true);
    expect(result.events.some((event) => event.type === 'grid_query_hit')).toBe(true);
  });

  test('reset clears grid index state', () => {
    const engine = new GridIndexEngine();
    engine.insert({ x: 10, y: 10 });

    engine.reset();

    expect(engine.getViewModel().points).toEqual([]);
  });
});
