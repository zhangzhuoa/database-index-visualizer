import type { QuadTreeNode, QuadTreeViewModel, QuadTreeViewNode, QuadTreeViewPoint } from './quadtreeTypes';

const VIEW_PADDING = 32;
const DEFAULT_SIZE = 640;

export function createQuadTreeViewModel(root: QuadTreeNode): QuadTreeViewModel {
  const nodes: QuadTreeViewNode[] = [];
  const points: QuadTreeViewPoint[] = [];

  collectNode(root, nodes, points);

  return {
    indexType: 'quadtree',
    rootId: root.id,
    bounds: { ...root.bounds },
    nodes,
    points,
    width: DEFAULT_SIZE + VIEW_PADDING * 2,
    height: DEFAULT_SIZE + VIEW_PADDING * 2,
  };
}

function collectNode(node: QuadTreeNode, nodes: QuadTreeViewNode[], points: QuadTreeViewPoint[]) {
  const nodePoints = node.points.map((point) => ({
    ...point,
    point: { ...point.point },
    nodeId: node.id,
  }));

  points.push(...nodePoints);

  nodes.push({
    id: node.id,
    bounds: { ...node.bounds },
    depth: node.depth,
    quadrant: node.quadrant,
    isLeaf: node.isLeaf,
    children: node.children.length > 0 ? node.children.map((child) => child.id) : undefined,
    points: nodePoints,
  });

  for (const child of node.children) {
    collectNode(child, nodes, points);
  }
}
