import type { AnimationEvent } from '../events';
import type { BPlusTreeInternalNode, BPlusTreeLeafNode, BPlusTreeNode } from './types';
import { createBPlusTreeViewModel } from './viewModel';

export interface BPlusTreeInsertResult {
  events: AnimationEvent[];
}

export interface BPlusTreeSearchResult {
  found: boolean;
  path: string[];
  events: AnimationEvent[];
}

export interface BPlusTreeRangeSearchResult {
  keys: number[];
  path: string[];
  events: AnimationEvent[];
}

interface LeafSplitResult {
  promotedKey: number;
  left: BPlusTreeLeafNode;
  right: BPlusTreeLeafNode;
}

interface InternalSplitResult {
  promotedKey: number;
  left: BPlusTreeInternalNode;
  right: BPlusTreeInternalNode;
}

export class BPlusTree {
  private readonly order: number;

  private root: BPlusTreeNode;

  private nextNodeId = 1;

  constructor(order = 4) {
    if (!Number.isInteger(order) || order < 3) {
      throw new Error('B+ tree order must be an integer greater than or equal to 3.');
    }

    this.order = order;
    this.root = this.createLeafNode('root');
  }

  getOrder() {
    return this.order;
  }

  getRoot() {
    return this.root;
  }

  toViewModel() {
    return createBPlusTreeViewModel(this.root);
  }

  insert(key: number): BPlusTreeInsertResult {
    const events: AnimationEvent[] = [];
    const leaf = this.findLeaf(key, events);

    this.insertKeyIntoLeaf(leaf, key);
    events.push({
      type: 'insert-key',
      nodeId: leaf.id,
      key,
      keys: [...leaf.keys],
    });

    if (!this.isOverflow(leaf)) {
      return { events };
    }

    const split = this.splitLeaf(leaf);
    events.push({
      type: 'split-node',
      nodeId: leaf.id,
      keys: [...leaf.keys, ...split.right.keys],
      leftNodeId: split.left.id,
      rightNodeId: split.right.id,
      promotedKey: split.promotedKey,
    });

    this.insertIntoParent(split.left, split.promotedKey, split.right, events);

    return { events };
  }

  search(key: number): BPlusTreeSearchResult {
    const events: AnimationEvent[] = [];
    const leaf = this.findLeaf(key, events);
    const found = leaf.keys.includes(key);

    events.push({
      type: found ? 'search-hit' : 'search-miss',
      nodeId: leaf.id,
      key,
    });

    return {
      found,
      path: this.getPathFromEvents(events),
      events,
    };
  }

  rangeSearch(left: number, right: number): BPlusTreeRangeSearchResult {
    if (left > right) {
      throw new Error('Range left boundary must be less than or equal to right boundary.');
    }

    const events: AnimationEvent[] = [];
    const keys: number[] = [];
    let leaf: BPlusTreeLeafNode | null = this.findLeaf(left, events);

    while (leaf) {
      events.push({
        type: 'range-scan',
        nodeId: leaf.id,
        keys: [...leaf.keys],
      });

      for (const key of leaf.keys) {
        if (key >= left && key <= right) {
          keys.push(key);
        }
      }

      const lastKey = leaf.keys[leaf.keys.length - 1];
      if (lastKey === undefined || lastKey > right) {
        break;
      }

      leaf = leaf.next;
    }

    return {
      keys,
      path: this.getPathFromEvents(events),
      events,
    };
  }

  private findLeaf(key: number, events: AnimationEvent[]) {
    let current = this.root;

    while (current.kind === 'internal') {
      events.push({
        type: 'visit-node',
        nodeId: current.id,
        key,
        keys: [...current.keys],
      });

      const childIndex = this.findChildIndex(current.keys, key);
      current = current.children[childIndex];
    }

    events.push({
      type: 'visit-node',
      nodeId: current.id,
      key,
      keys: [...current.keys],
    });

    return current;
  }

  private findChildIndex(keys: number[], key: number) {
    let index = 0;

    while (index < keys.length && key >= keys[index]) {
      index += 1;
    }

    return index;
  }

  private insertKeyIntoLeaf(leaf: BPlusTreeLeafNode, key: number) {
    const insertIndex = leaf.keys.findIndex((currentKey) => key < currentKey);

    if (insertIndex === -1) {
      leaf.keys.push(key);
      return;
    }

    leaf.keys.splice(insertIndex, 0, key);
  }

  private insertIntoParent(
    left: BPlusTreeNode,
    promotedKey: number,
    right: BPlusTreeNode,
    events: AnimationEvent[],
  ) {
    if (!left.parent) {
      const newRoot = this.createInternalNode(this.createNodeId());
      newRoot.keys = [promotedKey];
      newRoot.children = [left, right];
      left.parent = newRoot;
      right.parent = newRoot;
      this.root = newRoot;

      events.push({
        type: 'promote-key',
        nodeId: newRoot.id,
        promotedKey,
        keys: [...newRoot.keys],
      });
      return;
    }

    const parent = left.parent;
    const leftIndex = parent.children.indexOf(left);
    parent.keys.splice(leftIndex, 0, promotedKey);
    parent.children.splice(leftIndex + 1, 0, right);
    right.parent = parent;

    events.push({
      type: 'promote-key',
      nodeId: parent.id,
      promotedKey,
      keys: [...parent.keys],
    });

    if (!this.isOverflow(parent)) {
      return;
    }

    const split = this.splitInternal(parent);
    events.push({
      type: 'split-node',
      nodeId: parent.id,
      keys: [...split.left.keys, split.promotedKey, ...split.right.keys],
      leftNodeId: split.left.id,
      rightNodeId: split.right.id,
      promotedKey: split.promotedKey,
    });

    this.insertIntoParent(split.left, split.promotedKey, split.right, events);
  }

  private splitLeaf(leaf: BPlusTreeLeafNode): LeafSplitResult {
    const splitIndex = Math.ceil(leaf.keys.length / 2);
    const right = this.createLeafNode(this.createNodeId());
    right.keys = leaf.keys.splice(splitIndex);
    right.parent = leaf.parent;
    right.next = leaf.next;
    leaf.next = right;

    return {
      promotedKey: right.keys[0],
      left: leaf,
      right,
    };
  }

  private splitInternal(node: BPlusTreeInternalNode): InternalSplitResult {
    const splitIndex = Math.floor(node.keys.length / 2);
    const promotedKey = node.keys[splitIndex];
    const right = this.createInternalNode(this.createNodeId());

    right.keys = node.keys.splice(splitIndex + 1);
    node.keys.splice(splitIndex);
    right.children = node.children.splice(splitIndex + 1);
    right.parent = node.parent;

    for (const child of right.children) {
      child.parent = right;
    }

    return {
      promotedKey,
      left: node,
      right,
    };
  }

  private isOverflow(node: BPlusTreeNode) {
    return node.keys.length >= this.order;
  }

  private createLeafNode(id: string): BPlusTreeLeafNode {
    return {
      id,
      kind: 'leaf',
      keys: [],
      parent: null,
      next: null,
    };
  }

  private createInternalNode(id: string): BPlusTreeInternalNode {
    return {
      id,
      kind: 'internal',
      keys: [],
      parent: null,
      children: [],
    };
  }

  private createNodeId() {
    const id = `node-${this.nextNodeId}`;
    this.nextNodeId += 1;
    return id;
  }

  private getPathFromEvents(events: AnimationEvent[]) {
    return events.filter((event) => event.type === 'visit-node').map((event) => event.nodeId);
  }
}
