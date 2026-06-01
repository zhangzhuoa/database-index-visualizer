import { describe, expect, test } from 'vitest';
import { QuadTree } from '../QuadTree';
import type { PointEntry } from '../quadtreeTypes';

const POINTS: PointEntry[] = [
  { id: 'nw', point: { x: 10, y: 10 } },
  { id: 'ne', point: { x: 80, y: 10 } },
  { id: 'sw', point: { x: 10, y: 80 } },
  { id: 'se', point: { x: 80, y: 80 } },
  { id: 'center', point: { x: 50, y: 50 } },
];

describe('QuadTree core logic', () => {
  test('inserts a single point into the root leaf', () => {
    const tree = new QuadTree();

    const result = tree.insert(POINTS[0]);

    expect(result.inserted).toBe(true);
    expect(tree.getRoot().isLeaf).toBe(true);
    expect(tree.getRoot().points.map((point) => point.id)).toEqual(['nw']);
  });

  test('splits overflowing leaf nodes into four quadrants and redistributes points', () => {
    const tree = new QuadTree({ capacity: 2 });

    for (const point of POINTS.slice(0, 3)) {
      tree.insert(point);
    }

    const root = tree.getRoot();
    expect(root.isLeaf).toBe(false);
    expect(root.children).toHaveLength(4);
    expect(root.points).toEqual([]);
    expect(root.children.flatMap((child) => child.points.map((point) => point.id)).sort()).toEqual(['ne', 'nw', 'sw']);
  });

  test('uses a stable east and south rule for points on quadrant boundaries', () => {
    const tree = new QuadTree({ capacity: 1 });
    tree.insert({ id: 'a', point: { x: 10, y: 10 } });
    tree.insert({ id: 'boundary', point: { x: 50, y: 50 } });

    const root = tree.getRoot();
    const southEast = root.children.find((child) => child.quadrant === 'se');

    expect(southEast?.points.map((point) => point.id)).toEqual(['boundary']);
  });

  test('does not insert points outside the world bounds', () => {
    const tree = new QuadTree();

    const result = tree.insert({ id: 'outside', point: { x: 120, y: 20 } });

    expect(result.inserted).toBe(false);
    expect(result.rejectedPoint?.id).toBe('outside');
    expect(tree.getRoot().points).toEqual([]);
  });

  test('range query returns points inside the query rectangle only', () => {
    const tree = new QuadTree({ capacity: 2 });
    for (const point of POINTS) {
      tree.insert(point);
    }

    const result = tree.search({ x: 0, y: 0, width: 55, height: 55 });

    expect(result.points.map((point) => point.id).sort()).toEqual(['center', 'nw']);
    expect(result.points.some((point) => point.id === 'se')).toBe(false);
  });

  test('reset clears the tree', () => {
    const tree = new QuadTree();
    tree.insert(POINTS[0]);

    tree.reset();

    expect(tree.getRoot().isLeaf).toBe(true);
    expect(tree.getRoot().points).toEqual([]);
    expect(tree.getRoot().children).toEqual([]);
  });
});
