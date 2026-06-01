import type { Bounds, Point } from './quadtreeTypes';

export function containsPoint(bounds: Bounds, point: Point) {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function intersectsBounds(left: Bounds, right: Bounds) {
  return !(
    left.x > right.x + right.width ||
    left.x + left.width < right.x ||
    left.y > right.y + right.height ||
    left.y + left.height < right.y
  );
}

export function splitBounds(bounds: Bounds) {
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;

  return {
    nw: { x: bounds.x, y: bounds.y, width: halfWidth, height: halfHeight },
    ne: { x: bounds.x + halfWidth, y: bounds.y, width: halfWidth, height: halfHeight },
    sw: { x: bounds.x, y: bounds.y + halfHeight, width: halfWidth, height: halfHeight },
    se: { x: bounds.x + halfWidth, y: bounds.y + halfHeight, width: halfWidth, height: halfHeight },
  };
}

export function chooseQuadrant(bounds: Bounds, point: Point) {
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;
  const eastWest = point.x < midX ? 'w' : 'e';
  const northSouth = point.y < midY ? 'n' : 's';

  return `${northSouth}${eastWest}` as 'nw' | 'ne' | 'sw' | 'se';
}
