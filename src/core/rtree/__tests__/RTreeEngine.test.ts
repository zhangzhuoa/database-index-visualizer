import { describe, expect, test } from 'vitest';
import type { IndexEngine } from '../../common';
import { RTreeEngine } from '../RTreeEngine';
import type { RTreeViewModel } from '../rtreeTypes';

describe('RTreeEngine', () => {
  test('exposes rtree type through IndexEngine', () => {
    const engine: IndexEngine<
      'rtree',
      { x: number; y: number; width: number; height: number },
      unknown,
      unknown,
      object,
      Record<string, unknown>,
      Record<string, unknown>,
      RTreeViewModel
    > = new RTreeEngine();

    expect(engine.getType()).toBe('rtree');
  });

  test('insert returns animation events and view model data', () => {
    const engine = new RTreeEngine();

    const result = engine.insert({ x: 10, y: 10, width: 10, height: 10 });
    const viewModel = engine.getViewModel();

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.entry.id).toBeTruthy();
    expect(viewModel.indexType).toBe('rtree');
    expect(viewModel.nodes.length).toBeGreaterThan(0);
    expect(viewModel.entries).toHaveLength(1);
  });

  test('rangeSearch returns intersecting spatial entries and query events', () => {
    const engine = new RTreeEngine();
    engine.insert({ id: 'a', rect: { x: 10, y: 10, width: 10, height: 10 } });
    engine.insert({ id: 'b', rect: { x: 80, y: 80, width: 10, height: 10 } });

    const result = engine.rangeSearch({ x: 8, y: 8, width: 20, height: 20 });

    expect(result.entries.map((entry) => entry.id)).toEqual(['a']);
    expect(result.events.some((event) => event.type === 'rtree_visit_node')).toBe(true);
    expect(result.events.some((event) => event.type === 'rtree_search_hit')).toBe(true);
  });

  test('reset clears R tree state', () => {
    const engine = new RTreeEngine();
    engine.insert({ x: 10, y: 10, width: 10, height: 10 });

    engine.reset();

    expect(engine.getViewModel().entries).toEqual([]);
  });
});
