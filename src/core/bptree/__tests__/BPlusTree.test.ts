import { describe, expect, test } from 'vitest';
import { BPlusTree } from '../BPlusTree';
import type { BPlusTreeLeafNode, BPlusTreeNode } from '../types';

const INSERT_SEQUENCE = [10, 20, 5, 6, 12, 30, 7, 17];

function createTreeWithSequence() {
  const tree = new BPlusTree(4);

  for (const key of INSERT_SEQUENCE) {
    tree.insert(key);
  }

  return tree;
}

function getLeftmostLeaf(root: BPlusTreeNode): BPlusTreeLeafNode {
  let current = root;

  while (current.kind === 'internal') {
    current = current.children[0];
  }

  return current;
}

function collectLeafKeys(root: BPlusTreeNode) {
  const keys: number[] = [];
  let leaf: BPlusTreeLeafNode | null = getLeftmostLeaf(root);

  while (leaf) {
    expect(leaf.keys).toEqual([...leaf.keys].sort((left, right) => left - right));
    keys.push(...leaf.keys);
    leaf = leaf.next;
  }

  return keys;
}

describe('BPlusTree core logic', () => {
  test('inserts keys and finds existing or missing keys', () => {
    const tree = createTreeWithSequence();

    expect(tree.search(12).found).toBe(true);
    expect(tree.search(99).found).toBe(false);
  });

  test('returns keys in range from leaf-chain scan order', () => {
    const tree = createTreeWithSequence();

    expect(tree.rangeSearch(6, 17).keys).toEqual([6, 7, 10, 12, 17]);
  });

  test('keeps leaf keys sorted and links leaves in ascending order', () => {
    const tree = createTreeWithSequence();

    expect(collectLeafKeys(tree.getRoot())).toEqual([...INSERT_SEQUENCE].sort((left, right) => left - right));
  });

  test('creates a view model with node kinds and leaf links', () => {
    const tree = createTreeWithSequence();
    const viewModel = tree.toViewModel();

    expect(viewModel.rootId).toBeTruthy();
    expect(viewModel.nodes.length).toBeGreaterThan(0);
    expect(viewModel.nodes.some((node) => node.kind === 'internal')).toBe(true);
    expect(viewModel.nodes.some((node) => node.kind === 'leaf')).toBe(true);
    expect(viewModel.nodes.some((node) => node.kind === 'leaf' && node.nextLeaf)).toBe(true);
  });

  test('generates animation events for insert, search, and range search', () => {
    const tree = createTreeWithSequence();

    const insertEvents = tree.insert(25).events;
    const searchEvents = tree.search(12).events;
    const rangeEvents = tree.rangeSearch(6, 17).events;

    expect(insertEvents.length).toBeGreaterThan(0);
    expect(searchEvents.length).toBeGreaterThan(0);
    expect(rangeEvents.length).toBeGreaterThan(0);
    expect(searchEvents.some((event) => event.type === 'visit-node')).toBe(true);
    expect(rangeEvents.some((event) => event.type === 'range-scan')).toBe(true);
  });
});
