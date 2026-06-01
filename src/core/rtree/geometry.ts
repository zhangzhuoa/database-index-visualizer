import type { Rect } from './rtreeTypes';

export function rectRight(rect: Rect) {
  return rect.x + rect.width;
}

export function rectBottom(rect: Rect) {
  return rect.y + rect.height;
}

export function rectArea(rect: Rect) {
  return rect.width * rect.height;
}

export function unionRects(rects: Rect[]) {
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map(rectRight));
  const maxY = Math.max(...rects.map(rectBottom));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function expandRect(base: Rect | null, rect: Rect) {
  return base ? unionRects([base, rect]) : { ...rect };
}

export function enlargement(base: Rect | null, rect: Rect) {
  if (!base) {
    return rectArea(rect);
  }

  return rectArea(expandRect(base, rect)) - rectArea(base);
}

export function intersectsRect(left: Rect, right: Rect) {
  return left.x <= rectRight(right) && rectRight(left) >= right.x && left.y <= rectBottom(right) && rectBottom(left) >= right.y;
}

export function rectCenterX(rect: Rect) {
  return rect.x + rect.width / 2;
}
