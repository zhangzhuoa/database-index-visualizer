import { describe, expect, test } from 'vitest';
import { RTree } from '../RTree';
import type { SpatialEntry } from '../rtreeTypes';

const ENTRIES: SpatialEntry[] = [
  { id: 'a', rect: { x: 10, y: 10, width: 10, height: 10 } },
  { id: 'b', rect: { x: 35, y: 12, width: 8, height: 8 } },
  { id: 'c', rect: { x: 60, y: 40, width: 12, height: 10 } },
  { id: 'd', rect: { x: 90, y: 52, width: 14, height: 16 } },
  { id: 'e', rect: { x: 120, y: 20, width: 8, height: 14 } },
];

describe('RTree core logic', () => {
  test('inserts a single rectangle into the root leaf', () => {
    const tree = new RTree();

    tree.insert(ENTRIES[0]);

    const root = tree.getRoot();
    expect(root.kind).toBe('leaf');
    expect(root.mbr).toEqual({ x: 10, y: 10, width: 10, height: 10 });
    expect(root.kind === 'leaf' ? root.entries.map((entry) => entry.id) : []).toEqual(['a']);
  });

  test('updates MBR to cover multiple entries', () => {
    const tree = new RTree();
    tree.insert(ENTRIES[0]);
    tree.insert(ENTRIES[1]);

    expect(tree.getRoot().mbr).toEqual({ x: 10, y: 10, width: 33, height: 10 });
  });

  test('splits overflowing nodes and creates a new root', () => {
    const tree = new RTree();

    for (const entry of ENTRIES) {
      tree.insert(entry);
    }

    const root = tree.getRoot();
    expect(root.kind).toBe('internal');
    expect(root.kind === 'internal' ? root.children.length : 0).toBe(2);
    expect(root.mbr).toEqual({ x: 10, y: 10, width: 118, height: 58 });
  });

  test('range query returns intersecting entries only', () => {
    const tree = new RTree();
    for (const entry of ENTRIES) {
      tree.insert(entry);
    }

    const result = tree.search({ x: 8, y: 8, width: 40, height: 20 });

    expect(result.entries.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(result.entries.some((entry) => entry.id === 'c')).toBe(false);
  });

  test('reset clears the tree', () => {
    const tree = new RTree();
    tree.insert(ENTRIES[0]);

    tree.reset();

    const root = tree.getRoot();
    expect(root.kind).toBe('leaf');
    expect(root.mbr).toBeNull();
    expect(root.kind === 'leaf' ? root.entries : []).toEqual([]);
  });
});
