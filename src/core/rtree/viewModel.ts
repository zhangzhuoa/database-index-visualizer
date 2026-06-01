import type { RTreeNode, RTreeViewEntry, RTreeViewModel, RTreeViewNode } from './rtreeTypes';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 108;
const HORIZONTAL_GAP = 72;
const VERTICAL_GAP = 150;
const PADDING = 48;

export function createRTreeViewModel(root: RTreeNode): RTreeViewModel {
  const nodes: RTreeViewNode[] = [];
  const entries: RTreeViewEntry[] = [];
  let nextLeafX = PADDING;
  let maxDepth = 0;

  layoutNode(root, 0, nodes, entries, () => {
    const x = nextLeafX;
    nextLeafX += NODE_WIDTH + HORIZONTAL_GAP;
    return x;
  });

  for (const node of nodes) {
    maxDepth = Math.max(maxDepth, Math.round((node.y - PADDING) / VERTICAL_GAP));
  }

  return {
    indexType: 'rtree',
    rootId: root.id,
    nodes,
    entries,
    width: Math.max(PADDING * 2 + NODE_WIDTH, nextLeafX - HORIZONTAL_GAP + PADDING),
    height: PADDING * 2 + maxDepth * VERTICAL_GAP + NODE_HEIGHT,
  };
}

function layoutNode(
  node: RTreeNode,
  depth: number,
  nodes: RTreeViewNode[],
  entries: RTreeViewEntry[],
  takeNextLeafX: () => number,
) {
  let x: number;

  if (node.kind === 'internal') {
    const childCenters = node.children.map((child) => layoutNode(child, depth + 1, nodes, entries, takeNextLeafX));
    x = (childCenters[0] + childCenters[childCenters.length - 1]) / 2 - NODE_WIDTH / 2;
  } else {
    x = takeNextLeafX();
  }

  const nodeEntries =
    node.kind === 'leaf'
      ? node.entries.map((entry) => ({
          ...entry,
          rect: { ...entry.rect },
          nodeId: node.id,
        }))
      : undefined;

  if (nodeEntries) {
    entries.push(...nodeEntries);
  }

  nodes.push({
    id: node.id,
    kind: node.kind,
    mbr: node.mbr ? { ...node.mbr } : null,
    x,
    y: PADDING + depth * VERTICAL_GAP,
    children: node.kind === 'internal' ? node.children.map((child) => child.id) : undefined,
    entries: nodeEntries,
  });

  return x + NODE_WIDTH / 2;
}
