# **Standard Lifecycle Methodology for Multi-Coordinate Chart Creation**

This document describes the lifecycle methodology for creating charts across different coordinate systems, such as Cartesian, Polar, Geographic, etc. The methodology ensures that charts are developed in a standardized and modular way, allowing for scalability and consistency across multiple chart types.

## **Project File Structure Overview**
The project has been organized to follow the standard lifecycle methodology for multi-coordinate chart creation. Each phase in the lifecycle is encapsulated in modular files, grouped by their purpose within the chart creation process. The primary structure is housed within the `chart` directory, with subfolders for each distinct phase.

### **Folder Structure**
```
chart
├── lifecycle
│   ├── preparation.js            // Preparation Phase
│   ├── domain.js                 // Domain Calculation Phase
│   ├── initialization.js         // Initialization Phase
│   ├── dataBinding.js            // Data Binding & Chart Rendering Phase
│   ├── features.js               // Feature Enrichment Phase
│   ├── interactivity.js          // Interactivity Phase
│   ├── unifiedChart.js           // Unified Chart Creation Phase
│   ├── multiSeries.js            // Multi-Series Chart Creation Phase
│
└── draw
    ├── bars.js                   // Functions for rendering bars (grouped, stacked, etc.)
    ├── linesAndAreas.js          // Functions for rendering lines and areas
    ├── points.js                 // Functions for rendering scatter points
    ├── bubbles.js                // Functions for rendering bubbles
    ├── axesAndGrid.js            // Functions for creating axes and grid lines
    ├── tooltips.js               // Functions for tooltip creation and management
    └── utils.js                  // Helper functions used across different draw
    index                         // Main entry point for chart creation       
```

### **Lifecycle Phases Explained with File Structure**
Each of the 8 phases of the chart lifecycle has a dedicated file or set of files to maintain separation of concerns and to allow for reusability and easy maintenance. Below, we describe how the project folder structure supports each lifecycle phase.

## **1. Preparation Phase** (`lifecycle/preparation.js`)
- **Purpose**: The Preparation Phase ensures that all input data is accurate, well-formatted, and ready to be used in the subsequent steps of the chart lifecycle. This involves validating data structures, ensuring that the data series meet requirements, and converting input values to appropriate formats.
- **Outcome**: Validated and formatted data is ready for use, with errors identified and logged if present.

## **2. Domain Calculation Phase** (`lifecycle/domain.js`)
- **Purpose**: The Domain Calculation Phase is focused on defining the range of data that the chart needs to represent. It includes calculating merged domains for multiple series (x-axis and y-axis) and extracting unique values for proper scaling across various datasets.
- **Outcome**: Consistent data domains for accurate chart scaling, with merged domains calculated for multiple data series when necessary.

## **3. Initialization Phase** (`lifecycle/initialization.js`)
- **Purpose**: The Initialization Phase sets up the chart environment, which involves creating an initial SVG container within the specified container, appending the necessary `<g>` groups, and initializing the scales (x and y). This sets up the foundation for drawing the chart elements.
- **Outcome**: Ready-to-use SVG container, chart group, and initialized scales based on the computed domains.

## **4. Data Binding & Chart Rendering Phase** (`lifecycle/dataBinding.js`)
- **Purpose**: The Data Binding & Chart Rendering Phase handles binding the prepared data to the chart elements and rendering them. It creates SVG elements such as bars, points, and lines, and applies the necessary scales to ensure proper positioning and scaling.
- **Outcome**: The main data visuals are rendered within the chart, such as bars, lines, and scatter points.

## **5. Feature Enrichment Phase** (`lifecycle/features.js`)
- **Purpose**: The Feature Enrichment Phase adds supplementary chart features, such as grids, axes, labels, areas, and bubbles. It uses a registry of rendering functions to enrich the chart, enhancing the user's understanding and adding context to the visual representation.
- **Outcome**: Additional chart features, including grids, labels, axes, and other data representations, are rendered, making the chart more informative and complete.

## **6. Interactivity Phase** (`lifecycle/interactivity.js`)
- **Purpose**: The Interactivity Phase adds interactive features to the chart, such as tooltips, and manages the event handlers for tooltips and other responses to user interactions. This includes mouseover events that reveal detailed data and enable user exploration.
- **Outcome**: The chart becomes interactive, allowing users to engage with and explore the data more deeply.

## **7. Unified Chart Creation Phase** (`lifecycle/unifiedChart.js`)
- **Purpose**: The Unified Chart Creation Phase coordinates all the previous phases to generate a complete chart. It manages domain calculations, rendering, and interactivity, ensuring a cohesive end-to-end process that results in a fully functional, user-friendly chart.
- **Outcome**: A fully validated, rendered, and interactive chart based on the input data, configuration, and features.

## **8. Multi-Series Chart Creation Phase** (`lifecycle/multiSeries.js`)
- **Purpose**: The Multi-Series Chart Creation Phase handles rendering multiple datasets within a single chart, either merged into one visualization or separated based on user preferences. It provides comparative analysis capabilities by handling synchronization across multiple data series.
- **Outcome**: A multi-series chart allowing for easy comparison of different datasets, supporting both merged and separate visualizations.

### **Drawing Functions in `/chart/draw`**
The `draw` folder contains functions specifically responsible for rendering different visual components of the chart, further breaking down the rendering logic into modular pieces.

- **`bars.js`**: Contains functions for rendering different types of bars, such as grouped, stacked, and error bars.
- **`linesAndAreas.js`**: Contains functions for rendering line and area charts.
- **`points.js`**: Handles rendering individual points in scatter plots or similar charts.
- **`bubbles.js`**: Handles rendering bubble charts, which involve variable radii.
- **`axesAndGrid.js`**: Contains functions to create chart axes, grid lines, and labels for the chart.
- **`tooltips.js`**: Manages the creation and interaction of tooltips, ensuring they appear at the correct position and display relevant information.
- **`utils.js`**: Holds reusable helper functions that are needed across different draw components, such as data preparation and helper calculations.

### **Coordinate Systems Supported**
The following coordinate systems are supported by this methodology, allowing flexibility in the type of visualizations that can be created:

1. **Cartesian Coordinates (x, y)**: Used for line charts, bar charts, scatter plots, and area charts.
2. **Polar Coordinates (Radius, Angle)**: Suitable for pie charts, radar charts, and polar bar charts.
3. **Spherical Coordinates**: 3D-like representations, useful for data that maps naturally onto a sphere.
4. **Cylindrical Coordinates**: Charts that require radial positioning combined with height, for cylindrical projections.
5. **Geographic Coordinates (Latitude, Longitude)**: Ideal for visualizing geographic data using maps, choropleths, or geo heatmaps.
6. **Logarithmic Coordinates**: Useful for data that spans multiple magnitudes, especially for financial or scientific data.
7. **Parallel Coordinates**: Enables visualization of high-dimensional data, where multiple attributes can be plotted together.
8. **Ternary and Hexagonal Coordinates**: Specialized for compositional data (ternary plots) and density plots (hexagonal binning).

### **Current WIP Lifecycle Methodology in Action**
```
initializeChart (Step 7: Unified Chart Creation Phase)
├── computeDomains (Step 2: Domain Calculation Phase)
│   ├── computeMergedXDomain (Step 2: Domain Calculation Phase)
│   └── computeMergedValueDomain (Step 2: Domain Calculation Phase)
├── createMultiSeriesChart (Step 8: Multi-Series Chart Creation Phase)
│   ├── createDataSeriesChart (Step 8: Multi-Series Chart Creation Phase)
│   │   ├── setupAndRenderChart (Step 4: Data Binding & Chart Rendering Phase)
│   │   │   ├── prepareAndValidateData (Step 1: Preparation Phase)
│   │   │   │   ├── validateSeriesData (Step 1: Preparation Phase)
│   │   │   │   ├── validateMargin (Step 1: Preparation Phase)
│   │   │   ├── createInitialSVG (Step 3: Initialization Phase)
│   │   │   ├── createChartGroup (Step 3: Initialization Phase)
│   │   │   ├── extractXDomain (Step 2: Domain Calculation Phase)
│   │   │   ├── computeMergedValueDomain (Step 2: Domain Calculation Phase)
│   │   │   ├── initializeScales (Step 3: Initialization Phase)
│   │   │   └── createTooltip (Step 3: Initialization Phase)
│   │   └── renderFeatures (Step 5: Feature Enrichment Phase)
│   │       ├── createGrid (Step 5: Feature Enrichment Phase)
│   │       ├── createAxis (Step 5: Feature Enrichment Phase)
│   │       ├── createLabel (Step 5: Feature Enrichment Phase)
│   │       ├── createArea (Step 5: Feature Enrichment Phase)
│   │       ├── createLine (Step 5: Feature Enrichment Phase)
│   │       ├── createBubbles (Step 5: Feature Enrichment Phase)
│   │       ├── createPoints (Step 5: Feature Enrichment Phase)
│   │       └── createBars (Step 5: Feature Enrichment Phase)
├── renderFeatures (Step 5: Feature Enrichment Phase)
│   ├── createGrid (Step 5: Feature Enrichment Phase)
│   ├── createAxis (Step 5: Feature Enrichment Phase)
│   ├── createLabel (Step 5: Feature Enrichment Phase)
│   ├── createArea (Step 5: Feature Enrichment Phase)
│   ├── createLine (Step 5: Feature Enrichment Phase)
│   ├── createBubbles (Step 5: Feature Enrichment Phase)
│   ├── createPoints (Step 5: Feature Enrichment Phase)
│   └── createBars (Step 5: Feature Enrichment Phase)
└── initializeEventHandlers (Step 6: Interactivity Phase)
    ├── eventSystem.on('tooltip') (Step 6: Interactivity Phase - Show tooltips)
    ├── eventSystem.on('tooltipMove') (Step 6: Interactivity Phase - Move tooltips)
    └── eventSystem.on('tooltipHide') (Step 6: Interactivity Phase - Hide tooltips)
```


### **Proposed  Lifecycle Methodology in Action**
```
initializeChart (Unified Entry Point)
├── prepareAndValidateData (Step 1: Preparation Phase)
│    └── Validates input data and ensures all required structure is present.
├── computeDomains (Step 2: Domain Calculation Phase)
│    ├── computeMergedXDomain (Step 2a: Compute x-domain across all series)
│    └── computeMergedValueDomain (Step 2b: Compute y-domain across all series)
├── initializeChartElements (Step 3: Initialization Phase)
│    ├── createInitialSVG (Step 3a: Create the main SVG container)
│    ├── createChartGroup (Step 3b: Create a `<g>` element for chart elements)
│    └── initializeScales (Step 3c: Set up x and y scales based on domains)
├── setupAndRenderChart (Step 4: Data Binding & Chart Rendering Phase)
│    ├── Binds the data to chart elements and creates basic data visuals.
│    ├── Uses preparedData and scales for rendering.
│    └── Prepares `createParams` object for later use.
├── renderFeatures (Step 5: Feature Enrichment Phase)
│    ├── createGrid (Render chart gridlines)
│    ├── createAxis (Render axes)
│    ├── createLabel (Add labels to chart)
│    ├── createArea (Render area visualizations)
│    ├── createLine (Render line chart features)
│    ├── createBubbles (Render bubbles)
│    ├── createPoints (Render points for scatter)
│    └── createBars (Render bar chart features)
├── initializeEventHandlers (Step 6: Interactivity Phase)
│    ├── eventSystem.on('tooltip') (Step 6a: Handle tooltip visibility)
│    ├── eventSystem.on('tooltipMove') (Step 6b: Handle tooltip movement)
│    └── eventSystem.on('tooltipHide') (Step 6c: Handle hiding tooltips)
└── createMultiSeriesChart (Step 8: Multi-Series Chart Creation Phase)
     ├── createDataSeriesChart (Step 8a: Setup and render each data series)
     └── setup individual charts for multi-series data visualization.

```

### **Conclusion**
The `chart` folder is organized in a modular way that reflects the lifecycle methodology for creating multi-coordinate charts. Each lifecycle phase has a dedicated file, and the drawing-related files are further split into distinct types, making the project scalable, maintainable, and easy to understand for developers. This structure facilitates the development of feature-rich, reusable, and customizable chart components across various coordinate systems and chart types.

