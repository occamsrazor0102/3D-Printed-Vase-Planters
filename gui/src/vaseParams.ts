/** Parameter definitions for the parametric vase generator. */

export interface VaseParams {
  height: number;
  bottom_sides: number;
  mid_sides: number;
  top_sides: number;
  base_radius: number;
  top_radius: number;
  waist1_pos: number;
  waist1_scale: number;
  waist2_pos: number;
  waist2_scale: number;
  twist_degrees: number;
  segments: number;
  pattern_type: number;
  pattern_amplitude: number;
  pattern_freq_phi: number;
  pattern_freq_z: number;
  ellipse_ratio: number;
  rounded_radius: number;
  wall_thickness: number;
  add_slots: boolean;
  slot_count: number;
  slot_radius: number;
  slot_height: number;
  slot_offset: number;
  slot_distance_ratio: number;
  extra_mid_sides: number;
  extra_mid_pos: number;
  extra_waist_scale: number;
  extra_waist_pos: number;
  add_bottom_holes: boolean;
  bottom_hole_count: number;
  bottom_hole_radius: number;
  bottom_hole_distance_ratio: number;
}

export const defaultParams: VaseParams = {
  height: 200,
  bottom_sides: 6,
  mid_sides: 12,
  top_sides: 8,
  base_radius: 40,
  top_radius: 20,
  waist1_pos: 0.33,
  waist1_scale: 0.7,
  waist2_pos: 0.66,
  waist2_scale: 1.2,
  twist_degrees: 0,
  segments: 80,
  pattern_type: 0,
  pattern_amplitude: 0.1,
  pattern_freq_phi: 5,
  pattern_freq_z: 5,
  ellipse_ratio: 1.0,
  rounded_radius: 0,
  wall_thickness: 2,
  add_slots: false,
  slot_count: 8,
  slot_radius: 2,
  slot_height: 0.5,
  slot_offset: 0.5,
  slot_distance_ratio: 0.8,
  extra_mid_sides: 0,
  extra_mid_pos: 0.75,
  extra_waist_scale: 0,
  extra_waist_pos: 0,
  add_bottom_holes: false,
  bottom_hole_count: 6,
  bottom_hole_radius: 3,
  bottom_hole_distance_ratio: 0.6,
};

export interface ParamMeta {
  key: keyof VaseParams;
  label: string;
  min: number;
  max: number;
  step: number;
  group: string;
  type: 'number' | 'boolean';
}

export const paramMeta: ParamMeta[] = [
  // Shape
  { key: 'height', label: 'Height (mm)', min: 10, max: 500, step: 1, group: 'Shape', type: 'number' },
  { key: 'bottom_sides', label: 'Bottom Sides', min: 3, max: 64, step: 1, group: 'Shape', type: 'number' },
  { key: 'mid_sides', label: 'Middle Sides', min: 3, max: 64, step: 1, group: 'Shape', type: 'number' },
  { key: 'top_sides', label: 'Top Sides', min: 3, max: 64, step: 1, group: 'Shape', type: 'number' },
  { key: 'base_radius', label: 'Base Radius (mm)', min: 5, max: 200, step: 1, group: 'Shape', type: 'number' },
  { key: 'top_radius', label: 'Top Radius (mm)', min: 5, max: 200, step: 1, group: 'Shape', type: 'number' },

  // Waist
  { key: 'waist1_pos', label: 'Waist 1 Position', min: 0, max: 1, step: 0.01, group: 'Waist', type: 'number' },
  { key: 'waist1_scale', label: 'Waist 1 Scale', min: 0.1, max: 3, step: 0.01, group: 'Waist', type: 'number' },
  { key: 'waist2_pos', label: 'Waist 2 Position', min: 0, max: 1, step: 0.01, group: 'Waist', type: 'number' },
  { key: 'waist2_scale', label: 'Waist 2 Scale', min: 0.1, max: 3, step: 0.01, group: 'Waist', type: 'number' },

  // Twist & Segments
  { key: 'twist_degrees', label: 'Twist (degrees)', min: -360, max: 360, step: 1, group: 'Twist & Segments', type: 'number' },
  { key: 'segments', label: 'Segments', min: 8, max: 200, step: 1, group: 'Twist & Segments', type: 'number' },

  // Pattern
  { key: 'pattern_type', label: 'Pattern Type (0–3)', min: 0, max: 3, step: 1, group: 'Pattern', type: 'number' },
  { key: 'pattern_amplitude', label: 'Pattern Amplitude', min: 0, max: 1, step: 0.01, group: 'Pattern', type: 'number' },
  { key: 'pattern_freq_phi', label: 'Pattern Freq (circumference)', min: 1, max: 30, step: 1, group: 'Pattern', type: 'number' },
  { key: 'pattern_freq_z', label: 'Pattern Freq (height)', min: 1, max: 30, step: 1, group: 'Pattern', type: 'number' },

  // Advanced Shape
  { key: 'ellipse_ratio', label: 'Ellipse Ratio', min: 0.5, max: 3, step: 0.01, group: 'Advanced', type: 'number' },
  { key: 'rounded_radius', label: 'Rounded Radius (mm)', min: 0, max: 20, step: 0.5, group: 'Advanced', type: 'number' },
  { key: 'wall_thickness', label: 'Wall Thickness (mm)', min: 0, max: 20, step: 0.5, group: 'Advanced', type: 'number' },

  // Extra Midpoint
  { key: 'extra_mid_sides', label: 'Extra Mid Sides', min: 0, max: 64, step: 1, group: 'Extra Midpoint', type: 'number' },
  { key: 'extra_mid_pos', label: 'Extra Mid Position', min: 0, max: 1, step: 0.01, group: 'Extra Midpoint', type: 'number' },

  // Extra Waist
  { key: 'extra_waist_scale', label: 'Extra Waist Scale', min: 0, max: 3, step: 0.01, group: 'Extra Waist', type: 'number' },
  { key: 'extra_waist_pos', label: 'Extra Waist Position', min: 0, max: 1, step: 0.01, group: 'Extra Waist', type: 'number' },

  // Slots
  { key: 'add_slots', label: 'Add Ventilation Slots', min: 0, max: 1, step: 1, group: 'Slots', type: 'boolean' },
  { key: 'slot_count', label: 'Slot Count', min: 1, max: 24, step: 1, group: 'Slots', type: 'number' },
  { key: 'slot_radius', label: 'Slot Radius (mm)', min: 1, max: 20, step: 0.5, group: 'Slots', type: 'number' },
  { key: 'slot_height', label: 'Slot Height (fraction)', min: 0, max: 1, step: 0.01, group: 'Slots', type: 'number' },
  { key: 'slot_offset', label: 'Slot Offset (fraction)', min: 0, max: 1, step: 0.01, group: 'Slots', type: 'number' },
  { key: 'slot_distance_ratio', label: 'Slot Distance Ratio', min: 0.1, max: 1, step: 0.01, group: 'Slots', type: 'number' },

  // Bottom Holes
  { key: 'add_bottom_holes', label: 'Add Drainage Holes', min: 0, max: 1, step: 1, group: 'Drainage Holes', type: 'boolean' },
  { key: 'bottom_hole_count', label: 'Hole Count', min: 1, max: 24, step: 1, group: 'Drainage Holes', type: 'number' },
  { key: 'bottom_hole_radius', label: 'Hole Radius (mm)', min: 1, max: 20, step: 0.5, group: 'Drainage Holes', type: 'number' },
  { key: 'bottom_hole_distance_ratio', label: 'Hole Distance Ratio', min: 0.1, max: 1, step: 0.01, group: 'Drainage Holes', type: 'number' },
];
