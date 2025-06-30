import { math, Node, Tween, tween, Vec3 } from 'cc';

function doPunch(node: Node, punch: Vec3, property: string, duration: number, vibrato: number = 10, elasticity: number = 1) {
  if (duration <= 0) {
    console.warn('DOPunchRotation: duration must be greater than 0');
    return;
  }

  elasticity = math.clamp01(elasticity);
  const strength = punch.length();
  let totalIterations = Math.floor(vibrato * duration);
  if (totalIterations < 2) totalIterations = 2;

  const decayPerStep = strength / totalIterations;

  // Step durations calculated like in DOTween
  const tDurations: number[] = [];
  let sum = 0;
  for (let i = 0; i < totalIterations; ++i) {
    const iterPercent = (i + 1) / totalIterations;
    const t = duration * iterPercent;
    tDurations.push(t);
    sum += t;
  }
  const multiplier = duration / sum;
  for (let i = 0; i < tDurations.length; ++i) {
    tDurations[i] *= multiplier;
  }

  // Prepare rotation targets
  const directions: Vec3[] = [];
  let currentStrength = strength;
  for (let i = 0; i < totalIterations; ++i) {
    let dir: Vec3;
    if (i < totalIterations - 1) {
      if (i === 0) {
        dir = punch.clone();
      } else if (i % 2 !== 0) {
        dir = punch
          .clone()
          .normalize()
          .multiplyScalar(currentStrength * elasticity)
          .negative();
      } else {
        dir = punch.clone().normalize().multiplyScalar(currentStrength);
      }
      currentStrength -= decayPerStep;
    } else {
      dir = Vec3.ZERO.clone(); // End at rest
    }
    directions.push(dir);
  }

  // Tween sequence
  const baseRot = node[property].clone();
  let seq: Tween<Node> = tween(node);

  for (let i = 0; i < totalIterations; ++i) {
    const targetRot = baseRot.clone().add(directions[i]);
    seq.to(tDurations[i], { [property]: targetRot }, { easing: 'sineOut' });
  }

  seq.start();
}

export function punchRotation(node: Node, punch: Vec3, duration: number, vibrato: number = 10, elasticity: number = 1) {
  doPunch(node, punch, 'eulerAngles', duration, vibrato, elasticity);
}

export function punchPosition(node: Node, punch: Vec3, duration: number, vibrato: number = 10, elasticity: number = 1) {
  doPunch(node, punch, 'position', duration, vibrato, elasticity);
}

export function remap(value: number, from1: number, to1: number, from2: number, to2: number) {
  return ((value - from1) / (to1 - from1)) * (to2 - from2) + from2;
}
