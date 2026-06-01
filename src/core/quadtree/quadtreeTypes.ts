export interface Point {
  x: number;
  y: number;
}

export interface PointEntry {
  id: string;
  point: Point;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type QuadTreeQuadrant = 'nw' | 'ne' | 'sw' | 'se' | 'root';

export interface QuadTreeNode {
  id: string;
  bounds: Bounds;
  depth: number;
  quadrant: QuadTreeQuadrant;
  parent: QuadTreeNode | null;
  points: PointEntry[];
  children: QuadTreeNode[];
  isLeaf: boolean;
}

export interface QuadTreeInsertResult {
  point: PointEntry;
  inserted: boolean;
  path: string[];
  chosenQuadrants: Array<{
    nodeId: string;
    childNodeId: string;
    quadrant: Exclude<QuadTreeQuadrant, 'root'>;
  }>;
  insertedNodeId?: string;
  splitNodeIds: string[];
  redistributedPoints: Array<{
    pointId: string;
    fromNodeId: string;
    toNodeId: string;
    quadrant: Exclude<QuadTreeQuadrant, 'root'>;
  }>;
  rejectedPoint?: PointEntry;
  reason?: string;
}

export interface QuadTreeSearchResult {
  points: PointEntry[];
  visitedNodeIds: string[];
  prunedNodeIds: string[];
}

export interface QuadTreeViewPoint extends PointEntry {
  nodeId: string;
}

export interface QuadTreeViewNode {
  id: string;
  bounds: Bounds;
  depth: number;
  quadrant: QuadTreeQuadrant;
  isLeaf: boolean;
  children?: string[];
  points: QuadTreeViewPoint[];
}

export interface QuadTreeViewModel {
  indexType: 'quadtree';
  rootId: string;
  bounds: Bounds;
  nodes: QuadTreeViewNode[];
  points: QuadTreeViewPoint[];
  width: number;
  height: number;
}

export interface QuadTreeOptions {
  worldBounds?: Bounds;
  capacity?: number;
  maxDepth?: number;
}
