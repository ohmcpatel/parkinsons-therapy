import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// returns x,y for a point on a spiral
export function generateSpiralPoint(maxRadius: number, angle: number) {
  const radius = (maxRadius * angle) / (6 * Math.PI);
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  return { x, y };
}

// returns how well a spiral matches a stroke
export function calculateRadialError(stroke: { x: number, y: number }[], maxRadius: number) {
  let totalRadialError = 0;
  for(let i = 0; i < stroke.length; i++) {
    const { x, y } = stroke[i];
    const angle = Math.atan2(y, x);
    // find best match for this point
    let bestDistance = Infinity;
    let bestAngle = 0;
    for(let testAngle = angle; testAngle < 6 * Math.PI; testAngle += 2 * Math.PI) {
      if (testAngle < 0) continue;
      const { x: testX, y: testY } = generateSpiralPoint(maxRadius, testAngle);
      const distance = Math.sqrt((x - testX) ** 2 + (y - testY) ** 2);
      if(distance < bestDistance) {
        bestDistance = distance;
        bestAngle = testAngle;
      }
    }
    let actualRadius = Math.sqrt(x ** 2 + y ** 2);
    let spiralRadius = Math.abs((maxRadius * bestAngle) / (6 * Math.PI));
    let radialError = Math.abs(actualRadius - spiralRadius);
    totalRadialError += radialError;
  }
  return totalRadialError / maxRadius;
}