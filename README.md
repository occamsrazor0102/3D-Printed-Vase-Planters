# 3D-Printed-Vase-Planters

Parametric vase/planter generator for 3D printing, featuring a desktop GUI
built with Electron, React and TypeScript.

## Repository Structure

- **`parametric_vase.scad`** — OpenSCAD parametric vase generator (the
  authoritative geometry source).
- **`gui/`** — Electron-based desktop application for visually designing vases
  and exporting OpenSCAD files.

## GUI — Parametric Vase Designer

The GUI provides:

- **Real-time 3D preview** powered by Three.js — rotate with click-drag, zoom
  with the scroll wheel.
- **Parameter controls** for all 30+ vase parameters, organised into
  collapsible groups (Shape, Waist, Pattern, Slots, Drainage Holes, etc.).
- **OpenSCAD code view** — inspect the generated `.scad` code before exporting.
- **Export** — download a `.scad` file configured with your chosen parameters,
  ready to render in OpenSCAD.

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [OpenSCAD](https://openscad.org/) (to render exported `.scad` files into STL)

### Quick Start

```bash
cd gui
npm install
npm start
```

### Build Distributables

```bash
cd gui
npm run make
```

The packaged application will be placed in `gui/out/`.

## OpenSCAD (Command-Line / Direct Use)

You can also open `parametric_vase.scad` directly in OpenSCAD and adjust
parameters via its built-in Customizer panel. Press **F5** to preview or **F6**
to render an STL for printing.