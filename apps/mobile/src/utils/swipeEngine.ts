export type SwipeDirection = "left" | "right" | "up" | "down";

export type SwipeVector = {
  translationX: number;
  translationY: number;
};

export const swipeThreshold = 96;

export function getSwipeDirection(
  vector: SwipeVector,
  threshold = swipeThreshold
): SwipeDirection | null {
  const absX = Math.abs(vector.translationX);
  const absY = Math.abs(vector.translationY);

  if (absX < threshold && absY < threshold) {
    return null;
  }

  if (absX >= absY) {
    return vector.translationX > 0 ? "right" : "left";
  }

  return vector.translationY > 0 ? "down" : "up";
}
