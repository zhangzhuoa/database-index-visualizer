import { describe, expect, test } from 'vitest';
import { BPlusTreeEngine } from '../../bptree';
import { GridIndexEngine } from '../../grid';
import { HashIndexEngine } from '../../hash';
import { QuadTreeEngine } from '../../quadtree';
import { RTreeEngine } from '../../rtree';
import type { IndexEngine } from '../types';

describe('IndexEngine implementations', () => {
  test('B+ tree, hash, R tree, quadtree, and grid engines expose stable index types through the common interface', () => {
    const bplusTreeEngine: IndexEngine<'bptree', number, number, { left: number; right: number }> =
      new BPlusTreeEngine(4);
    const hashIndexEngine: IndexEngine<'hash', number, number, { left: number; right: number }> =
      new HashIndexEngine();
    const rtreeEngine = new RTreeEngine();
    const quadTreeEngine = new QuadTreeEngine();
    const gridIndexEngine = new GridIndexEngine();

    expect(bplusTreeEngine.getType()).toBe('bptree');
    expect(hashIndexEngine.getType()).toBe('hash');
    expect(rtreeEngine.getType()).toBe('rtree');
    expect(quadTreeEngine.getType()).toBe('quadtree');
    expect(gridIndexEngine.getType()).toBe('grid');
  });

  test('reset clears index implementations through the common interface', () => {
    const bplusTreeEngine = new BPlusTreeEngine(4);
    const hashIndexEngine = new HashIndexEngine();
    const rtreeEngine = new RTreeEngine();
    const quadTreeEngine = new QuadTreeEngine();
    const gridIndexEngine = new GridIndexEngine();

    bplusTreeEngine.insert(10);
    hashIndexEngine.insert(10);
    rtreeEngine.insert({ x: 10, y: 10, width: 10, height: 10 });
    quadTreeEngine.insert({ x: 10, y: 10 });
    gridIndexEngine.insert({ x: 10, y: 10 });

    bplusTreeEngine.reset();
    hashIndexEngine.reset();
    rtreeEngine.reset();
    quadTreeEngine.reset();
    gridIndexEngine.reset();

    expect(bplusTreeEngine.getViewModel().nodes).toHaveLength(1);
    expect(bplusTreeEngine.getViewModel().nodes[0]).toMatchObject({ kind: 'leaf', keys: [] });
    expect(hashIndexEngine.getViewModel().buckets.every((bucket) => bucket.keys.length === 0)).toBe(true);
    expect(rtreeEngine.getViewModel().entries).toEqual([]);
    expect(quadTreeEngine.getViewModel().points).toEqual([]);
    expect(gridIndexEngine.getViewModel().points).toEqual([]);
  });
});
