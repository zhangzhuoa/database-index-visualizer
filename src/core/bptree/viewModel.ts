import type { BPlusTreeNode } from './types';

export type BPlusTreeViewNodeKind = 'internal' | 'leaf';

export interface BPlusTreeViewNode {
  id: string;
  kind: BPlusTreeViewNodeKind;
  keys: number[];
  x: number;
  y: number;
  children?: string[];
  nextLeaf?: string;
}

export interface BPlusTreeViewModel {
  rootId: string;
  nodes: BPlusTreeViewNode[];
  width: number;
  height: number;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 56;
const HORIZONTAL_GAP = 96;
const VERTICAL_GAP = 150;
const PADDING = 48;

export function createBPlusTreeViewModel(root: BPlusTreeNode): BPlusTreeViewModel {
  const nodes: BPlusTreeViewNode[] = [];
  let nextLeafX = PADDING;
  let maxDepth = 0;

  layoutNode(root, 0, nodes, () => {
    const x = nextLeafX;
    nextLeafX += NODE_WIDTH + HORIZONTAL_GAP;
    return x;
  });

  for (const node of nodes) {
    maxDepth = Math.max(maxDepth, Math.round((node.y - PADDING) / VERTICAL_GAP));
  }

  const contentWidth = Math.max(PADDING * 2 + NODE_WIDTH, nextLeafX - HORIZONTAL_GAP + PADDING);

  return {
    rootId: root.id,
    nodes,
    width: contentWidth,
    height: PADDING * 2 + maxDepth * VERTICAL_GAP + NODE_HEIGHT,
  };
}

function layoutNode(
  node: BPlusTreeNode,
  depth: number,
  nodes: BPlusTreeViewNode[],
  takeNextLeafX: () => number,
) {
  let x: number;

  if (node.kind === 'internal') {
    const childCenters = node.children.map((child) => layoutNode(child, depth + 1, nodes, takeNextLeafX));
    const firstChildCenter = childCenters[0];
    const lastChildCenter = childCenters[childCenters.length - 1];
    x = (firstChildCenter + lastChildCenter) / 2 - NODE_WIDTH / 2;
  } else {
    x = takeNextLeafX();
  }

  nodes.push({
    id: node.id,
    kind: node.kind,
    keys: [...node.keys],
    x,
    y: PADDING + depth * VERTICAL_GAP,
    children: node.kind === 'internal' ? node.children.map((child) => child.id) : undefined,
    nextLeaf: node.kind === 'leaf' ? node.next?.id : undefined,
  });

  return x + NODE_WIDTH / 2;
}
