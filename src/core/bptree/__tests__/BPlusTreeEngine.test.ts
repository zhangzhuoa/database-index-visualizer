import { describe, expect, test } from 'vitest';
import type { IndexEngine } from '../../common';
import { BPlusTreeEngine } from '../BPlusTreeEngine';

const INSERT_SEQUENCE = [10, 20, 5, 6, 12, 30, 7, 17];

function createEngineWithSequence() {
  const engine: IndexEngine<'bptree', number, number, { left: number; right: number }> = new BPlusTreeEngine(4);

  for (const key of INSERT_SEQUENCE) {
    engine.insert(key);
  }

  return engine;
}

describe('BPlusTreeEngine', () => {
  test('exposes the B+ tree index type through the common engine interface', () => {
    const engine = new BPlusTreeEngine(4);

    expect(engine.getType()).toBe('bptree');
  });

  test('preserves B+ tree insert, search, and range search results', () => {
    const engine = createEngineWithSequence();

    expect(engine.search(12).found).toBe(true);
    expect(engine.search(99).found).toBe(false);
    expect(engine.rangeSearch({ left: 6, right: 17 }).keys).toEqual([6, 7, 10, 12, 17]);
  });

  test('adapts B+ tree animation events and view model to common result shapes', () => {
    const engine = createEngineWithSequence();

    const insertResult = engine.insert(25);
    const searchResult = engine.search(12);
    const rangeResult = engine.rangeSearch({ left: 6, right: 17 });
    const viewModel = engine.getViewModel();

    expect(insertResult.events.length).toBeGreaterThan(0);
    expect(searchResult.events.some((event) => event.type === 'visit-node')).toBe(true);
    expect(rangeResult.events.some((event) => event.type === 'range-scan')).toBe(true);
    expect(viewModel.indexType).toBe('bptree');
    expect(viewModel.rootId).toBeTruthy();
    expect(viewModel.nodes.some((node) => node.kind === 'leaf' && node.nextLeaf)).toBe(true);
  });

  test('resets to an empty B+ tree with stable engine configuration', () => {
    const engine = createEngineWithSequence();

    engine.reset();

    const viewModel = engine.getViewModel();
    expect(engine.getType()).toBe('bptree');
    expect(viewModel.nodes).toHaveLength(1);
    expect(viewModel.nodes[0]).toMatchObject({ id: 'root', kind: 'leaf', keys: [] });
  });
});
