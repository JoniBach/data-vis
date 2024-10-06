Note: This project is a work in progress and is subject to changes as it evolves.

# **Universal Chart Library: Making Complex Visualizations Simple**

### A D3.js Library for Multi-Coordinate System Charts, Made Easy

---

### **Problem Statement**

Creating charts in D3.js is incredibly powerful but often overwhelming due to its low-level nature and the complexity of managing different coordinate systems. Developers and analysts frequently face the challenge of implementing various chart types that span Cartesian, polar, and other more niche coordinate spaces—each with different configurations, rules, and limitations. The steep learning curve and the intricacies involved in managing these different systems make it hard to quickly get from data to insightful visual representation.

### **Expected Outcome**

A **synchronization-focused approach** will also be a key feature, allowing users to effortlessly link multiple charts across different coordinate systems. This will enable synchronized interactions, such as zooming or filtering across multiple axes, ensuring cohesive and insightful multi-chart visual narratives.

A **modular and user-friendly library** built on top of D3.js that allows developers to create **multi-coordinate system visualizations** with ease. Users will be able to select from a range of coordinate systems, drop in core chart components, and generate interactive, responsive charts without needing in-depth knowledge of D3.

### **Supported Coordinate Systems**

- **Cartesian Coordinates (x, y)**
  - Line, bar, scatter, area
- **Polar Coordinates (Radius, Angle)**
  - Pie charts, radar charts, polar bar charts
- **Spherical Coordinates**
  - 3D-like representations on spherical surfaces
- **Cylindrical Coordinates**
  - Charts combining radial positioning with height
- **Geographic Coordinates (Latitude, Longitude)**
  - Maps, choropleths, geo heatmaps
- **Logarithmic Coordinates**
  - For data spanning multiple magnitudes
- **Parallel Coordinates**
  - High-dimensional data plots
- **Ternary and Hexagonal Coordinates**
  - Specialized composition and density plots

### **How the System Will Work**

The library will not only provide **distinct canvases** for each type of coordinate system but will also include features that support **synchronization across multiple charts and axes**. This means users can link multiple charts, enabling actions like panning, zooming, or filtering to be applied across all related charts simultaneously, providing a unified view of the data.

The library will provide **distinct canvases** for each type of coordinate system, allowing users to focus on the specific type of visualization they need without diving into the complexities of the underlying D3 logic. Each canvas will have tailored **core components** that fit naturally within the coordinate space. For example, a Cartesian canvas will offer bars, lines, and points, while a polar canvas will provide slices, radial bars, and radar lines.

Users will interact with the system through a simple, **configuration-driven API**. By selecting a canvas type and defining components using straightforward options, users can generate complex charts in just a few lines of code. Each canvas will manage its own scales, axes, and transformations, allowing for easy **combination** of multiple coordinate types for hybrid visualizations (e.g., embedding a polar chart in a Cartesian space).

### **Conclusion**

The **Universal Chart Library** aims to reduce the complexity of D3.js while maximizing its power. By offering a simple, modular canvas system for each coordinate type, this library will empower developers and analysts to create meaningful visualizations quickly and effectively—enabling more time for insight and analysis rather than wrestling with configuration. Let’s make visual storytelling easy, engaging, and versatile.


## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

## Building

To build your library:

```bash
npm run package
```

To create a production version of your showcase app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Publishing

Go into the `package.json` and give your package the desired name through the `"name"` option. Also consider adding a `"license"` field and point it to a `LICENSE` file which you can create from a template (one popular option is the [MIT license](https://opensource.org/license/mit/)).

To publish your library to [npm](https://www.npmjs.com):

```bash
npm publish
```
