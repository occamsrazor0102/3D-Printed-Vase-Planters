/**
 * Generates a Three.js BufferGeometry that approximates the parametric vase
 * defined in parametric_vase.scad.  This is a simplified version used for
 * real-time preview in the GUI — the authoritative geometry comes from
 * OpenSCAD at export time.
 */

import * as THREE from 'three';
import { VaseParams } from '../vaseParams';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sidesAt(
  t: number,
  bottomSides: number,
  midSides: number,
  topSides: number,
  extraMidSides: number,
  extraMidPos: number,
): number {
  if (extraMidSides > 0 && extraMidPos > 0 && extraMidPos < 1) {
    if (t <= 0.5) return Math.floor(lerp(bottomSides, midSides, t / 0.5));
    if (t <= extraMidPos)
      return Math.floor(lerp(midSides, extraMidSides, (t - 0.5) / (extraMidPos - 0.5)));
    return Math.floor(lerp(extraMidSides, topSides, (t - extraMidPos) / (1 - extraMidPos)));
  }
  if (t <= 0.5) return Math.floor(lerp(bottomSides, midSides, t / 0.5));
  return Math.floor(lerp(midSides, topSides, (t - 0.5) / 0.5));
}

function radiusAt(
  t: number,
  baseRadius: number,
  topRadius: number,
  w1Pos: number,
  w1Scale: number,
  w2Pos: number,
  w2Scale: number,
  extraWaistScale: number,
  extraWaistPos: number,
): number {
  const useExtra = extraWaistScale > 0 && extraWaistPos > 0 && extraWaistPos < 1;
  if (t <= w1Pos) {
    return lerp(baseRadius, baseRadius * w1Scale, t / w1Pos);
  }
  if (t <= w2Pos) {
    return lerp(baseRadius * w1Scale, baseRadius * w2Scale, (t - w1Pos) / (w2Pos - w1Pos));
  }
  if (useExtra && t <= extraWaistPos) {
    return lerp(baseRadius * w2Scale, baseRadius * extraWaistScale, (t - w2Pos) / (extraWaistPos - w2Pos));
  }
  if (useExtra) {
    return lerp(baseRadius * extraWaistScale, topRadius, (t - extraWaistPos) / (1 - extraWaistPos));
  }
  return lerp(baseRadius * w2Scale, topRadius, (t - w2Pos) / (1 - w2Pos));
}

function patternFactor(
  patternType: number,
  amplitude: number,
  freqPhi: number,
  freqZ: number,
  phi: number,
  t: number,
): number {
  if (patternType === 0) return 1;
  if (patternType === 1) return 1 + amplitude * Math.sin(2 * Math.PI * freqPhi * phi);
  if (patternType === 2) return 1 + amplitude * Math.sin(2 * Math.PI * freqZ * t);
  return 1 + amplitude * Math.sin(2 * Math.PI * freqPhi * phi) * Math.sin(2 * Math.PI * freqZ * t);
}

export function buildVaseGeometry(params: VaseParams): THREE.BufferGeometry {
  const {
    height,
    bottom_sides,
    mid_sides,
    top_sides,
    base_radius,
    top_radius,
    waist1_pos,
    waist1_scale,
    waist2_pos,
    waist2_scale,
    twist_degrees,
    segments,
    pattern_type,
    pattern_amplitude,
    pattern_freq_phi,
    pattern_freq_z,
    ellipse_ratio,
    wall_thickness,
    extra_mid_sides,
    extra_mid_pos,
    extra_waist_scale,
    extra_waist_pos,
  } = params;

  // Use a reasonable number of segments for the preview (cap for performance)
  const seg = Math.min(segments, 120);
  const maxSides = Math.max(bottom_sides, mid_sides, top_sides, extra_mid_sides, 3);

  const vertices: number[] = [];
  const indices: number[] = [];

  // Generate vertices for each ring
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const y = t * height;
    const sides = sidesAt(t, bottom_sides, mid_sides, top_sides, extra_mid_sides, extra_mid_pos);
    const r = radiusAt(t, base_radius, top_radius, waist1_pos, waist1_scale, waist2_pos, waist2_scale, extra_waist_scale, extra_waist_pos);
    const twistAngle = (twist_degrees * t * Math.PI) / 180;

    for (let j = 0; j < maxSides; j++) {
      const phi = j / maxSides;
      // Map to actual polygon vertex — repeat vertices if sides < maxSides
      const effectiveJ = (j / maxSides) * sides;
      const angle = (effectiveJ / sides) * 2 * Math.PI + twistAngle;

      const pf = patternFactor(pattern_type, pattern_amplitude, pattern_freq_phi, pattern_freq_z, phi, t);
      const rx = r * pf * ellipse_ratio;
      const rz = r * pf;

      vertices.push(rx * Math.cos(angle), y, rz * Math.sin(angle));
    }
  }

  // Generate faces connecting adjacent rings
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < maxSides; j++) {
      const curr = i * maxSides + j;
      const next = i * maxSides + ((j + 1) % maxSides);
      const currUp = (i + 1) * maxSides + j;
      const nextUp = (i + 1) * maxSides + ((j + 1) % maxSides);

      indices.push(curr, next, currUp);
      indices.push(next, nextUp, currUp);
    }
  }

  // If wall_thickness > 0, build inner wall
  if (wall_thickness > 0) {
    const outerVertCount = vertices.length / 3;

    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const y = t * height;
      const sides = sidesAt(t, bottom_sides, mid_sides, top_sides, extra_mid_sides, extra_mid_pos);
      const r = radiusAt(t, base_radius, top_radius, waist1_pos, waist1_scale, waist2_pos, waist2_scale, extra_waist_scale, extra_waist_pos);
      const innerR = Math.max(r - wall_thickness, 1);
      const twistAngle = (twist_degrees * t * Math.PI) / 180;

      for (let j = 0; j < maxSides; j++) {
        const phi = j / maxSides;
        const effectiveJ = (j / maxSides) * sides;
        const angle = (effectiveJ / sides) * 2 * Math.PI + twistAngle;

        const pf = patternFactor(pattern_type, pattern_amplitude, pattern_freq_phi, pattern_freq_z, phi, t);
        const rx = innerR * pf * ellipse_ratio;
        const rz = innerR * pf;

        vertices.push(rx * Math.cos(angle), y, rz * Math.sin(angle));
      }
    }

    // Inner faces (reversed winding order)
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < maxSides; j++) {
        const curr = outerVertCount + i * maxSides + j;
        const next = outerVertCount + i * maxSides + ((j + 1) % maxSides);
        const currUp = outerVertCount + (i + 1) * maxSides + j;
        const nextUp = outerVertCount + (i + 1) * maxSides + ((j + 1) % maxSides);

        indices.push(curr, currUp, next);
        indices.push(next, currUp, nextUp);
      }
    }

    // Top rim connecting outer and inner walls
    const topOuterStart = seg * maxSides;
    const topInnerStart = outerVertCount + seg * maxSides;
    for (let j = 0; j < maxSides; j++) {
      const o1 = topOuterStart + j;
      const o2 = topOuterStart + ((j + 1) % maxSides);
      const i1 = topInnerStart + j;
      const i2 = topInnerStart + ((j + 1) % maxSides);

      indices.push(o1, o2, i1);
      indices.push(o2, i2, i1);
    }
  }

  // Build bottom cap
  const bottomCenter = vertices.length / 3;
  vertices.push(0, 0, 0);
  for (let j = 0; j < maxSides; j++) {
    const next = (j + 1) % maxSides;
    indices.push(bottomCenter, next, j);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
