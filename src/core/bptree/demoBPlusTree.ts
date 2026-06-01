import type { BPlusTreeViewModel } from './viewModel';

export const demoBPlusTree: BPlusTreeViewModel = {
  rootId: 'root',
  width: 720,
  height: 380,
  nodes: [
    {
      id: 'root',
      kind: 'internal',
      keys: [10, 20],
      x: 360,
      y: 80,
      children: ['leaf-1', 'leaf-2', 'leaf-3'],
    },
    {
      id: 'leaf-1',
      kind: 'leaf',
      keys: [5, 6, 7],
      x: 130,
      y: 260,
      nextLeaf: 'leaf-2',
    },
    {
      id: 'leaf-2',
      kind: 'leaf',
      keys: [10, 12, 17],
      x: 360,
      y: 260,
      nextLeaf: 'leaf-3',
    },
    {
      id: 'leaf-3',
      kind: 'leaf',
      keys: [20, 30],
      x: 590,
      y: 260,
    },
  ],
};
