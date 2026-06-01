import { describe, expect, test } from 'vitest';
import type { IndexEngine } from '../../common';
import { QuadTreeEngine } from '../QuadTreeEngine';
import type { QuadTreeViewModel } from '../quadtreeTypes';

describe('QuadTreeEngine', () => {
  test('exposes quadtree type through IndexEngine', () => {
    const engine: IndexEngine<
      'quadtree',
      { x: number; y: number },
      unknown,
      unknown,
      object,
      Record<string, unknown>,
      Record<string, unknown>,
      QuadTreeViewModel
    > = new QuadTreeEngine();

    expect(engine.getType()).toBe('quadtree');
  });

  test('insert returns animation events and view model data', () => {
    const engine = new QuadTreeEngine({ capacity: 2 });

    const result = engine.insert({ x: 10, y: 10 });
    const viewModel = engine.getViewModel();

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.point.id).toBeTruthy();
    expect(result.inserted).toBe(true);
    expect(viewModel.indexType).toBe('quadtree');
    expect(viewModel.nodes.length).toBeGreaterThan(0);
    expect(viewModel.points).toHaveLength(1);
  });

  test('insert reports rejected points outside world bounds', () => {
    const engine = new QuadTreeEngine();

    const result = engine.insert({ id: 'outside', point: { x: 120, y: 10 } });

    expect(result.inserted).toBe(false);
    expect(result.events.some((event) => event.type === 'quadtree_reject_point')).toBe(true);
    expect(engine.getViewModel().points).toEqual([]);
  });

  test('rangeSearch returns matching points and query events', () => {
    const engine = new QuadTreeEngine({ capacity: 2 });
    engine.insert({ id: 'a', point: { x: 10, y: 10 } });
    engine.insert({ id: 'b', point: { x: 80, y: 80 } });

    const result = engine.rangeSearch({ x: 0, y: 0, width: 20, height: 20 });

    expect(result.points.map((point) => point.id)).toEqual(['a']);
    expect(result.events.some((event) => event.type === 'quadtree_query_visit')).toBe(true);
    expect(result.events.some((event) => event.type === 'quadtree_query_hit')).toBe(true);
  });

  test('reset clears quadtree state', () => {
    const engine = new QuadTreeEngine();
    engine.insert({ x: 10, y: 10 });

    engine.reset();

    expect(engine.getViewModel().points).toEqual([]);
  });
});
