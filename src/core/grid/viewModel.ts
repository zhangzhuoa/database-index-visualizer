import type { GridCell, GridIndexViewCell, GridIndexViewModel, GridIndexViewPoint } from './gridTypes';

const VIEW_PADDING = 32;
const DEFAULT_SIZE = 640;

export function createGridIndexViewModel(
  cells: GridCell[],
  bounds: GridIndexViewModel['bounds'],
  rows: number,
  cols: number,
): GridIndexViewModel {
  const viewCells: GridIndexViewCell[] = [];
  const points: GridIndexViewPoint[] = [];

  for (const cell of cells) {
    const entries = cell.entries.map((entry) => ({
      ...entry,
      point: { ...entry.point },
      cellId: cell.id,
    }));

    points.push(...entries);
    viewCells.push({
      id: cell.id,
      row: cell.row,
      col: cell.col,
      bounds: { ...cell.bounds },
      entries,
    });
  }

  return {
    indexType: 'grid',
    bounds: { ...bounds },
    rows,
    cols,
    cells: viewCells,
    points,
    width: DEFAULT_SIZE + VIEW_PADDING * 2,
    height: DEFAULT_SIZE + VIEW_PADDING * 2,
  };
}
