export type BPlusTreeNodeKind = 'internal' | 'leaf';

interface BPlusTreeBaseNode {
  id: string;
  kind: BPlusTreeNodeKind;
  keys: number[];
  parent: BPlusTreeInternalNode | null;
}

export interface BPlusTreeInternalNode extends BPlusTreeBaseNode {
  kind: 'internal';
  children: BPlusTreeNode[];
}

export interface BPlusTreeLeafNode extends BPlusTreeBaseNode {
  kind: 'leaf';
  next: BPlusTreeLeafNode | null;
}

export type BPlusTreeNode = BPlusTreeInternalNode | BPlusTreeLeafNode;
