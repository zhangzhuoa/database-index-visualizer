export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialEntry {
  id: string;
  rect: Rect;
}

interface RTreeBaseNode {
  id: string;
  mbr: Rect | null;
  parent: RTreeInternalNode | null;
}

export interface RTreeLeafNode extends RTreeBaseNode {
  kind: 'leaf';
  entries: SpatialEntry[];
}

export interface RTreeInternalNode extends RTreeBaseNode {
  kind: 'internal';
  children: RTreeNode[];
}

export type RTreeNode = RTreeLeafNode | RTreeInternalNode;

export interface RTreeSearchResult {
  entries: SpatialEntry[];
  visitedNodeIds: string[];
  prunedNodeIds: string[];
}

export interface RTreeInsertResult {
  entry: SpatialEntry;
  leafId: string;
  path: string[];
  expandedNodeIds: string[];
  splitNodeIds: string[];
  createdRootId?: string;
}

export interface RTreeViewEntry extends SpatialEntry {
  nodeId: string;
}

export interface RTreeViewNode {
  id: string;
  kind: 'internal' | 'leaf';
  mbr: Rect | null;
  x: number;
  y: number;
  children?: string[];
  entries?: RTreeViewEntry[];
}

export interface RTreeViewModel {
  indexType: 'rtree';
  rootId: string;
  nodes: RTreeViewNode[];
  entries: RTreeViewEntry[];
  width: number;
  height: number;
}
