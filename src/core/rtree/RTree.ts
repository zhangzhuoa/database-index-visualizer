import { enlargement, intersectsRect, rectArea, rectCenterX, unionRects } from './geometry';
import type {
  Rect,
  RTreeInsertResult,
  RTreeInternalNode,
  RTreeLeafNode,
  RTreeNode,
  RTreeSearchResult,
  SpatialEntry,
} from './rtreeTypes';

export class RTree {
  private root: RTreeNode;

  private nextNodeId = 1;

  private nextEntryId = 1;

  constructor(
    private readonly maxEntries = 4,
    private readonly minEntries = 2,
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 3) {
      throw new Error('R tree maxEntries must be an integer greater than or equal to 3.');
    }

    if (!Number.isInteger(minEntries) || minEntries < 1 || minEntries > maxEntries) {
      throw new Error('R tree minEntries must be between 1 and maxEntries.');
    }

    this.root = this.createLeafNode('root');
  }

  getRoot() {
    return this.root;
  }

  insert(input: SpatialEntry | Rect): RTreeInsertResult {
    const entry = this.normalizeEntry(input);
    const path: string[] = [];
    const leaf = this.chooseLeaf(this.root, entry.rect, path);

    leaf.entries.push(entry);
    const expandedNodeIds = this.adjustMbrsFrom(leaf);
    const splitNodeIds: string[] = [];
    let createdRootId: string | undefined;

    if (leaf.entries.length > this.maxEntries) {
      createdRootId = this.splitUpward(leaf, splitNodeIds);
    }

    return {
      entry,
      leafId: leaf.id,
      path,
      expandedNodeIds,
      splitNodeIds,
      createdRootId,
    };
  }

  search(query: Rect): RTreeSearchResult {
    const entries: SpatialEntry[] = [];
    const visitedNodeIds: string[] = [];
    const prunedNodeIds: string[] = [];

    this.searchNode(this.root, query, entries, visitedNodeIds, prunedNodeIds);

    return { entries, visitedNodeIds, prunedNodeIds };
  }

  reset() {
    this.nextNodeId = 1;
    this.nextEntryId = 1;
    this.root = this.createLeafNode('root');
  }

  private chooseLeaf(node: RTreeNode, rect: Rect, path: string[]): RTreeLeafNode {
    path.push(node.id);

    if (node.kind === 'leaf') {
      return node;
    }

    const child = [...node.children].sort((left, right) => {
      const leftGrowth = enlargement(left.mbr, rect);
      const rightGrowth = enlargement(right.mbr, rect);

      if (leftGrowth !== rightGrowth) {
        return leftGrowth - rightGrowth;
      }

      return rectArea(left.mbr ?? rect) - rectArea(right.mbr ?? rect);
    })[0];

    return this.chooseLeaf(child, rect, path);
  }

  private adjustMbrsFrom(node: RTreeNode) {
    const expandedNodeIds: string[] = [];
    let current: RTreeNode | null = node;

    while (current) {
      const previous = current.mbr;
      this.recalculateMbr(current);

      if (JSON.stringify(previous) !== JSON.stringify(current.mbr)) {
        expandedNodeIds.push(current.id);
      }

      current = current.parent;
    }

    return expandedNodeIds;
  }

  private splitUpward(node: RTreeNode, splitNodeIds: string[]): string | undefined {
    const right = this.splitNode(node);
    splitNodeIds.push(node.id, right.id);

    if (!node.parent) {
      const newRoot = this.createInternalNode(this.createNodeId());
      newRoot.children = [node, right];
      node.parent = newRoot;
      right.parent = newRoot;
      this.recalculateMbr(node);
      this.recalculateMbr(right);
      this.recalculateMbr(newRoot);
      this.root = newRoot;
      return newRoot.id;
    }

    const parent = node.parent;
    right.parent = parent;
    parent.children.push(right);
    this.adjustMbrsFrom(parent);

    if (parent.children.length > this.maxEntries) {
      return this.splitUpward(parent, splitNodeIds);
    }

    return undefined;
  }

  private splitNode(node: RTreeNode): RTreeNode {
    if (node.kind === 'leaf') {
      const sortedEntries = [...node.entries].sort((left, right) => rectCenterX(left.rect) - rectCenterX(right.rect));
      const splitIndex = Math.max(this.minEntries, Math.ceil(sortedEntries.length / 2));
      const right = this.createLeafNode(this.createNodeId());
      node.entries = sortedEntries.slice(0, splitIndex);
      right.entries = sortedEntries.slice(splitIndex);
      right.parent = node.parent;
      this.recalculateMbr(node);
      this.recalculateMbr(right);
      return right;
    }

    const sortedChildren = [...node.children].sort((left, right) => rectCenterX(left.mbr ?? zeroRect()) - rectCenterX(right.mbr ?? zeroRect()));
    const splitIndex = Math.max(this.minEntries, Math.ceil(sortedChildren.length / 2));
    const right = this.createInternalNode(this.createNodeId());
    node.children = sortedChildren.slice(0, splitIndex);
    right.children = sortedChildren.slice(splitIndex);
    right.parent = node.parent;

    for (const child of node.children) {
      child.parent = node;
    }

    for (const child of right.children) {
      child.parent = right;
    }

    this.recalculateMbr(node);
    this.recalculateMbr(right);
    return right;
  }

  private searchNode(
    node: RTreeNode,
    query: Rect,
    entries: SpatialEntry[],
    visitedNodeIds: string[],
    prunedNodeIds: string[],
  ) {
    if (!node.mbr || !intersectsRect(node.mbr, query)) {
      prunedNodeIds.push(node.id);
      return;
    }

    visitedNodeIds.push(node.id);

    if (node.kind === 'leaf') {
      entries.push(...node.entries.filter((entry) => intersectsRect(entry.rect, query)));
      return;
    }

    for (const child of node.children) {
      this.searchNode(child, query, entries, visitedNodeIds, prunedNodeIds);
    }
  }

  private recalculateMbr(node: RTreeNode) {
    const rects = node.kind === 'leaf' ? node.entries.map((entry) => entry.rect) : node.children.flatMap((child) => (child.mbr ? [child.mbr] : []));
    node.mbr = rects.length > 0 ? unionRects(rects) : null;
  }

  private normalizeEntry(input: SpatialEntry | Rect): SpatialEntry {
    if ('rect' in input) {
      return {
        id: input.id,
        rect: { ...input.rect },
      };
    }

    const id = `entry-${this.nextEntryId}`;
    this.nextEntryId += 1;

    return {
      id,
      rect: { ...input },
    };
  }

  private createLeafNode(id: string): RTreeLeafNode {
    return {
      id,
      kind: 'leaf',
      mbr: null,
      parent: null,
      entries: [],
    };
  }

  private createInternalNode(id: string): RTreeInternalNode {
    return {
      id,
      kind: 'internal',
      mbr: null,
      parent: null,
      children: [],
    };
  }

  private createNodeId() {
    const id = `rtree-node-${this.nextNodeId}`;
    this.nextNodeId += 1;
    return id;
  }
}

function zeroRect(): Rect {
  return { x: 0, y: 0, width: 0, height: 0 };
}
