/*
Parametric Vase Generator for OpenSCAD

This script creates a hollow vase that can be customised through a set of
parameters.  The vase is described by multiple cross‑sections: bottom,
midpoint and top by default, with an optional second midpoint to vary
faceting further.  Up to three adjustable waist positions allow the
radius to neck in or flare out at arbitrary heights.  The number of
sides (facets) at the bottom, midpoint and top cross‑sections can be
selected independently; an extra_mid parameter introduces another
intermediate side count.  Waist points control where the vase necks in
or flares out.  The shape can be twisted around its vertical axis and
decorative variations can be added via simple sinusoidal patterns on
the circumference and/or along the height.  Additional options include
elliptical scaling, rounded edges via Minkowski, wall thickness for
hollow vessels, ventilation slots, bottom drainage holes and more.

Mathematical details:
  • Regular polygons are approximated using the special variable $fn to
    set the number of segments.  The OpenSCAD manual notes that small
    values of $fn produce non‑circular shapes such as triangles or
    squares【730653112143853†L430-L443】.
  • Extruding a 2D shape with linear_extrude() allows twist and scale to
    be applied along the height; these parameters flare the shape and
    rotate it【255344405456993†L1079-L1096】.
  • The polyhedron() primitive is used to assemble the vase from
    successive cross‑sections; each face connects vertices on adjacent
    slices【730653112143853†L475-L503】.

Usage:
  Set the parameters in the call to `vase()` below.  Render with F5 to
  preview or F6 to generate an STL.

Note:
  Because the number of vertices in each cross‑section must match for
  the polyhedron, this script uses the maximum of the three side
  counts.  Cross‑sections with fewer sides are mapped onto this larger
  vertex count by repeating vertices.  This approach maintains the
  overall outline while simplifying the generation of faces.
*/

// Helper function for linear interpolation
function lerp(a, b, t) = a + (b - a) * t;

// Compute the number of sides at a given relative height.  We linearly
// interpolate between the bottom, middle and top values.  The middle
// position is fixed at 0.5 (halfway up the vase).  Returns an integer.
/*
  Compute the number of sides at a given relative height (t ∈ [0,1]).
  By default the shape interpolates between bottom_sides, mid_sides and
  top_sides with the midpoint fixed at t=0.5.  To allow more control
  over faceting, an optional extra_mid_pos and extra_mid_sides can be
  supplied.  When extra_mid_sides > 0, the interpolation is broken
  into three regions: bottom → mid → extra_mid → top.  The extra
  midpoint must lie between 0 and 1 (exclusive) and represents the
  relative height of the second interpolation point.  Values below
  extra_mid_pos use the classic bottom/mid interpolation; values
  between extra_mid_pos and 1 interpolate from extra_mid_sides to
  top_sides.  This piecewise formulation keeps the logic simple while
  providing an extra degree of freedom for sculptural variation.  The
  return value is rounded down to an integer with floor().
*/
function sides_at(t, bottom_sides, mid_sides, top_sides,
                  extra_mid_sides = 0, extra_mid_pos = 0.75) =
    (extra_mid_sides > 0 && extra_mid_pos > 0 && extra_mid_pos < 1) ?
        (
            t <= 0.5 ?
                floor(lerp(bottom_sides, mid_sides, t / 0.5)) :
            (t <= extra_mid_pos) ?
                // interpolate from mid_sides to extra_mid_sides between 0.5 and extra_mid_pos
                floor(lerp(mid_sides, extra_mid_sides,
                           (t - 0.5) / (extra_mid_pos - 0.5))) :
                // interpolate from extra_mid_sides to top_sides above extra_mid_pos
                floor(lerp(extra_mid_sides, top_sides,
                           (t - extra_mid_pos) / (1 - extra_mid_pos)))
        ) :
        (
            // default case with a single midpoint at t=0.5
            t <= 0.5 ?
                floor(lerp(bottom_sides, mid_sides, t / 0.5)) :
                floor(lerp(mid_sides, top_sides, (t - 0.5) / 0.5))
        );

// Compute the nominal radius at a given relative height (t ∈ [0,1]).
// This uses two waist positions and scales.  Radii are specified for
// the bottom, middle and top.  Between the bottom and waist1 the
// radius transitions to waist1_scale * base_radius.  Between waist1 and
// waist2 it transitions from waist1_scale * base_radius to
// waist2_scale * base_radius.  Above waist2 it transitions to the
// specified top_radius.
/*
  Compute the nominal radius at a given relative height (t ∈ [0,1]).
  The vase radius interpolates from base_radius to top_radius while
  applying up to three scaling points (waists) along the way.  The
  parameters waist1_pos and waist2_pos specify two internal points
  where the radius is multiplied by waist1_scale and waist2_scale,
  respectively.  An optional extra_waist_pos and extra_waist_scale
  provide a third scaling point; values beyond this extra waist are
  interpolated from the extra scale to the top radius.  If
  extra_waist_scale is ≤ 0 or extra_waist_pos lies outside (0,1), the
  function falls back to the two‑waist version.  The result is
  piecewise linear interpolation of both the underlying base/top
  radii and the scaling factors.
*/
function radius_at(t, base_radius, top_radius,
                   waist1_pos, waist1_scale,
                   waist2_pos, waist2_scale,
                   extra_waist_pos = 0, extra_waist_scale = 1) =
    (extra_waist_scale > 0 && extra_waist_pos > max(waist1_pos, waist2_pos) && extra_waist_pos < 1) ?
        (
            t <= waist1_pos ?
                // bottom to waist1
                lerp(base_radius, base_radius * waist1_scale, t / waist1_pos) :
            (t <= waist2_pos) ?
                // waist1 to waist2
                lerp(base_radius * waist1_scale,
                     base_radius * waist2_scale,
                     (t - waist1_pos) / (waist2_pos - waist1_pos)) :
            (t <= extra_waist_pos) ?
                // waist2 to extra waist
                lerp(base_radius * waist2_scale,
                     base_radius * extra_waist_scale,
                     (t - waist2_pos) / (extra_waist_pos - waist2_pos)) :
                // extra waist to top
                lerp(base_radius * extra_waist_scale, top_radius,
                     (t - extra_waist_pos) / (1 - extra_waist_pos))
        ) :
        (
            // Two waists only
            t <= waist1_pos ?
                lerp(base_radius, base_radius * waist1_scale, t / waist1_pos) :
            (t <= waist2_pos) ?
                lerp(base_radius * waist1_scale,
                     base_radius * waist2_scale,
                     (t - waist1_pos) / (waist2_pos - waist1_pos)) :
                lerp(base_radius * waist2_scale, top_radius,
                     (t - waist2_pos) / (1 - waist2_pos))
        );

// Compute a pattern factor.  The pattern type controls how the
// radius is modulated.  Pattern amplitude determines the depth of
// modulation, pattern_freq_phi the frequency around the circumference,
// and pattern_freq_z the frequency along the height.  Types:
// 0 – none; 1 – scalloped (around circumference); 2 – ribbed (along height);
// 3 – mesh (product of sinusoids in both directions).  Phi is the
// fractional vertex index (0..1), and t is the relative height (0..1).
function pattern_factor(pattern_type, amplitude, freq_phi, freq_z,
                        phi, t) =
    (pattern_type == 0) ? 1 :
    (pattern_type == 1) ? 1 + amplitude * sin(2 * PI * freq_phi * phi) :
    (pattern_type == 2) ? 1 + amplitude * sin(2 * PI * freq_z * t) :
    // pattern_type == 3
    1 + amplitude * sin(2 * PI * freq_phi * phi) * sin(2 * PI * freq_z * t);

/*
  Generate the points and faces for the vase polyhedron.
  Parameters:
    height – total height of the vase (mm)
    bottom_sides, mid_sides, top_sides – number of sides at bottom, mid and top
    base_radius – radius at the bottom (mm)
    top_radius – radius at the top (mm)
    waist1_pos, waist2_pos – positions of the two waist points (fractions 0..1)
    waist1_scale, waist2_scale – radius scaling factors at the waists
    twist_degrees – total twist applied from bottom to top (degrees)
    segments – number of slices along height for constructing the mesh
    pattern_type, pattern_amplitude, pattern_freq_phi, pattern_freq_z – pattern control
*/
module vase(height=200,
            bottom_sides=6,
            mid_sides=12,
            top_sides=8,
            base_radius=40,
            top_radius=20,
            waist1_pos=0.33,
            waist1_scale=0.7,
            waist2_pos=0.66,
            waist2_scale=1.2,
            twist_degrees=0,
            segments=80,
            pattern_type=0,
            pattern_amplitude=0.1,
            pattern_freq_phi=5,
            pattern_freq_z=5,
            // Additional options
            ellipse_ratio=1.0,
            rounded_radius=0,
            wall_thickness=0,
            add_slots=false,
            slot_count=8,
            slot_radius=2,
            slot_height=0.5,
            slot_offset=0.5,
            slot_distance_ratio=0.8,
            // Optional extra midpoint for side count interpolation
            extra_mid_sides=0,
            extra_mid_pos=0.75,
            // Optional extra waist for radius scaling
            extra_waist_scale=0,
            extra_waist_pos=0,
            // Optional drainage holes on bottom
            add_bottom_holes=false,
            bottom_hole_count=6,
            bottom_hole_radius=3,
            bottom_hole_distance_ratio=0.6)
{
    /*
      This extended vase module builds both an outer and inner polyhedron
      when wall_thickness > 0, allowing for a hollow vessel.  It also
      supports elliptical cross‑sections (via ellipse_ratio), optional
      ventilation slots, and an optional Minkowski rounding.  Slots are
      placed around the circumference at a specified height and
      distance from the centre.
    */
    // Determine the maximum vertex count across all cross‑sections.
    // Include extra_mid_sides so that the polyhedron has enough
    // vertices to accommodate the additional midpoint if used.
    // Compute the maximum number of sides across all specified cross‑sections.
    // Use max() with a list for consistency and to safely handle the variable
    // number of arguments without risking undef values in face indices.
    max_sides = max([bottom_sides, mid_sides, top_sides, extra_mid_sides]);
    // Construct outer and inner point lists using list comprehensions.
    // Each slice is divided into max_sides subdivisions, mapping
    // cross‑sections with fewer sides onto the larger vertex count.  A
    // nested for‑loop builds all vertices in a single expression to
    // avoid repeated reassignment, which can lead to scope issues.
    pts_outer = [
        for (slice = [0 : segments], i = [0 : max_sides - 1])
            let(
                t = slice / segments,
                // nominal radius at this height
                r_nom = radius_at(t, base_radius, top_radius,
                                  waist1_pos, waist1_scale,
                                  waist2_pos, waist2_scale,
                                  extra_waist_pos, extra_waist_scale),
                // number of sides at this height
                s_at = sides_at(t, bottom_sides, mid_sides, top_sides,
                                extra_mid_sides, extra_mid_pos),
                twist_angle = twist_degrees * t,
                phi = i / max_sides,
                idx = floor(i * s_at / max_sides),
                angle = 360 * idx / s_at,
                theta = angle + twist_angle,
                p_fac = pattern_factor(pattern_type,
                                       pattern_amplitude,
                                       pattern_freq_phi,
                                       pattern_freq_z,
                                       phi, t),
                rad_o = r_nom * p_fac,
                xo = rad_o * cos(theta) * ellipse_ratio,
                yo = rad_o * sin(theta),
                zc = height * t
            )
            [xo, yo, zc]
    ];
    // Construct inner point list similarly.  If the radius collapses to
    // zero, the point will be at the origin.
    pts_inner = [
        for (slice = [0 : segments], i = [0 : max_sides - 1])
            let(
                t = slice / segments,
                r_nom = radius_at(t, base_radius, top_radius,
                                  waist1_pos, waist1_scale,
                                  waist2_pos, waist2_scale,
                                  extra_waist_pos, extra_waist_scale),
                r_inner_nom = max(r_nom - wall_thickness, 0),
                s_at = sides_at(t, bottom_sides, mid_sides, top_sides,
                                extra_mid_sides, extra_mid_pos),
                twist_angle = twist_degrees * t,
                phi = i / max_sides,
                idx = floor(i * s_at / max_sides),
                angle = 360 * idx / s_at,
                theta = angle + twist_angle,
                p_fac = pattern_factor(pattern_type,
                                       pattern_amplitude,
                                       pattern_freq_phi,
                                       pattern_freq_z,
                                       phi, t),
                rad_i = (r_inner_nom > 0) ? r_inner_nom * p_fac : 0,
                xi = rad_i * cos(theta) * ellipse_ratio,
                yi = rad_i * sin(theta),
                zc = height * t
            )
            [xi, yi, zc]
    ];
    // Build faces using list comprehensions.  The bottom and top faces are
    // single polygons, while the sides are quads connecting adjacent
    // slices.
    bottom_face = [for (i = [max_sides - 1 : -1 : 0]) i];
    faces_side = [
        for (j = [0 : segments - 1], i = [0 : max_sides - 1])
            let(
                base_index = j * max_sides,
                next_index = (j + 1) * max_sides,
                i_next = (i + 1) % max_sides
            )
            [base_index + i, base_index + i_next, next_index + i_next, next_index + i]
    ];
    top_face = [for (i = [0 : max_sides - 1]) segments * max_sides + i];
    faces = concat(concat([bottom_face], faces_side), [top_face]);
    // Module to create the base shape (outer minus inner and slots)
    module base_shape() {
        difference() {
            // Outer surface
            polyhedron(points = pts_outer, faces = faces, convexity = 10);
            // Subtract inner surface if thickness > 0
            if (wall_thickness > 0) {
                polyhedron(points = pts_inner, faces = faces, convexity = 10);
            }
            // Add ventilation slots on the side wall.  Each slot is a
            // vertical cylinder cut through the wall at a constant
            // height (slot_z).  The radial distance from the centre is
            // determined by slot_distance_ratio, scaled by the base
            // radius and ellipse_ratio so that the holes sit flush with
            // an elliptical cross‑section.
            if (add_slots) {
                slot_r = base_radius * slot_distance_ratio;
                slot_z = height * slot_offset;
                slot_h = height * slot_height;
                for (n = [0 : slot_count - 1]) {
                    a = 360 * n / slot_count;
                    rotate([0,0,a]) {
                        translate([slot_r * ellipse_ratio, 0, slot_z])
                            cylinder(h = slot_h, r = slot_radius, center = false);
                    }
                }
            }
            // Add drainage holes on the bottom.  These are vertical
            // cylinders that intersect the bottom face.  When
            // wall_thickness > 0 the hole height is extended slightly
            // beyond the inner surface to ensure a through‑hole.
            if (add_bottom_holes) {
                bh_r = base_radius * bottom_hole_distance_ratio;
                bh_h = max(1, wall_thickness * 1.5 + 0.5);
                for (n = [0 : bottom_hole_count - 1]) {
                    a = 360 * n / bottom_hole_count;
                    rotate([0, 0, a]) {
                        translate([bh_r * ellipse_ratio, 0, 0])
                            cylinder(h = bh_h, r = bottom_hole_radius, center = false);
                    }
                }
            }
        }
    }
    // Apply optional rounding using minkowski sum
    if (rounded_radius > 0) {
        minkowski() {
            base_shape();
            sphere(r = rounded_radius);
        }
    } else {
        base_shape();
    }
}

/*
Example calls.  Uncomment one of the following blocks to preview
different configurations.  The first example generates a flared vase
with a mesh pattern and a gentle twist.  The second demonstrates
orchid‑friendly features: an elliptical, shallow shape with side slots
and drainage holes.  Feel free to adjust the parameters.

// Example 1: flared and twisted mesh vase
//vase(height=200,
//     bottom_sides=5,
//     mid_sides=12,
//     top_sides=6,
//     base_radius=30,
//     top_radius=15,
//     waist1_pos=0.3,
//     waist1_scale=0.6,
//     waist2_pos=0.7,
//     waist2_scale=1.3,
//     twist_degrees=90,
//     segments=100,
//     pattern_type=3,
//     pattern_amplitude=0.08,
//     pattern_freq_phi=7,
//     pattern_freq_z=4);

// Example 2: orchid pot with elliptical profile, ventilation and drainage
//vase(height=120,
//     bottom_sides=8,
//     mid_sides=12,
//     top_sides=8,
//     base_radius=50,
//     top_radius=45,
//     waist1_pos=0.4,
//     waist1_scale=0.9,
//     waist2_pos=0.8,
//     waist2_scale=1.1,
//     extra_waist_pos=0.95,
//     extra_waist_scale=0.8,
//     ellipse_ratio=1.4,
//     wall_thickness=2,
//     add_slots=true,
//     slot_count=12,
//     slot_radius=3,
//     slot_height=0.6,
//     slot_offset=0.5,
//     slot_distance_ratio=0.9,
//     add_bottom_holes=true,
//     bottom_hole_count=8,
//     bottom_hole_radius=4,
//     bottom_hole_distance_ratio=0.6);
*/

/*
  Parameter definitions for the OpenSCAD Customizer
  -------------------------------------------------
  The variables defined below can be adjusted via the Customizer UI.  Each
  variable corresponds to a parameter of the `vase()` module.  Modify
  these values in the Customizer to explore different vase shapes.  By
  assigning a positive `wall_thickness` the vase will be hollowed
  through the middle (i.e. it will have an inner cavity).  Feel free to
  set `wall_thickness` to 0 if you want a solid vase.
*/

// [Height] Overall height of the vase (mm)
height = 200;

// [Bottom sides] Number of sides at the bottom cross‑section
bottom_sides = 6;

// [Middle sides] Number of sides at the midpoint cross‑section
mid_sides = 12;

// [Top sides] Number of sides at the top cross‑section
top_sides = 8;

// [Base radius] Radius at the bottom (mm)
base_radius = 40;

// [Top radius] Radius at the top (mm)
top_radius = 20;

// [Waist 1 position] Relative height of the first waist (0..1)
waist1_pos = 0.33;

// [Waist 1 scale] Scale factor at the first waist (multiplier on base_radius)
waist1_scale = 0.7;

// [Waist 2 position] Relative height of the second waist (0..1)
waist2_pos = 0.66;

// [Waist 2 scale] Scale factor at the second waist
waist2_scale = 1.2;

// [Twist] Total twist from bottom to top (degrees)
twist_degrees = 0;

// [Segments] Number of vertical slices used to construct the mesh
segments = 80;

// [Pattern type] 0 – none; 1 – scalloped; 2 – ribbed; 3 – mesh
pattern_type = 0;

// [Pattern amplitude] Depth of pattern modulation (0..1)
pattern_amplitude = 0.1;

// [Pattern freq phi] Frequency of pattern around circumference
pattern_freq_phi = 5;

// [Pattern freq z] Frequency of pattern along height
pattern_freq_z = 5;

// [Ellipse ratio] Ratio between x and y axes (1 for circle, >1 for ellipse)
ellipse_ratio = 1.0;

// [Rounded radius] Radius of Minkowski rounding (mm); 0 disables rounding
rounded_radius = 0;

// [Wall thickness] Thickness of the vase wall (mm).  >0 makes the vase hollow.
wall_thickness = 2;

// [Add slots] Toggle side ventilation slots
add_slots = false;

// [Slot count] Number of side slots
slot_count = 8;

// [Slot radius] Radius of side slots (mm)
slot_radius = 2;

// [Slot height] Height of side slots as a fraction of vase height
slot_height = 0.5;

// [Slot offset] Vertical offset of side slots as a fraction of height
slot_offset = 0.5;

// [Slot distance ratio] Radial position of side slots as a fraction of base radius
slot_distance_ratio = 0.8;

// [Extra mid sides] Additional midpoint side count (>0 to enable)
extra_mid_sides = 0;

// [Extra mid position] Relative height of the extra midpoint
extra_mid_pos = 0.75;

// [Extra waist scale] Scale factor at the third waist (>0 to enable)
extra_waist_scale = 0;

// [Extra waist position] Relative height of the third waist
extra_waist_pos = 0;

// [Add bottom holes] Toggle drainage holes at the bottom
add_bottom_holes = false;

// [Bottom hole count] Number of bottom holes
bottom_hole_count = 6;

// [Bottom hole radius] Radius of bottom holes (mm)
bottom_hole_radius = 3;

// [Bottom hole distance ratio] Radial position of bottom holes (fraction of base radius)
bottom_hole_distance_ratio = 0.6;

// Invoke the vase module with the variables defined above
vase(height=height,
     bottom_sides=bottom_sides,
     mid_sides=mid_sides,
     top_sides=top_sides,
     base_radius=base_radius,
     top_radius=top_radius,
     waist1_pos=waist1_pos,
     waist1_scale=waist1_scale,
     waist2_pos=waist2_pos,
     waist2_scale=waist2_scale,
     twist_degrees=twist_degrees,
     segments=segments,
     pattern_type=pattern_type,
     pattern_amplitude=pattern_amplitude,
     pattern_freq_phi=pattern_freq_phi,
     pattern_freq_z=pattern_freq_z,
     ellipse_ratio=ellipse_ratio,
     rounded_radius=rounded_radius,
     wall_thickness=wall_thickness,
     add_slots=add_slots,
     slot_count=slot_count,
     slot_radius=slot_radius,
     slot_height=slot_height,
     slot_offset=slot_offset,
     slot_distance_ratio=slot_distance_ratio,
     extra_mid_sides=extra_mid_sides,
     extra_mid_pos=extra_mid_pos,
     extra_waist_scale=extra_waist_scale,
     extra_waist_pos=extra_waist_pos,
     add_bottom_holes=add_bottom_holes,
     bottom_hole_count=bottom_hole_count,
     bottom_hole_radius=bottom_hole_radius,
     bottom_hole_distance_ratio=bottom_hole_distance_ratio);
