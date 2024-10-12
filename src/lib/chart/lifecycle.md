# **Standard Lifecycle Methodology for Multi-Coordinate Chart Creation**

This document provides an overview of the lifecycle methodology used for creating charts across different coordinate systems, such as Cartesian, Polar, Geographic, etc. The methodology follows a well-structured lifecycle approach that promotes modularity, reusability, scalability, and consistency across different chart types and use cases.

## **Project File Structure Overview**

The project has been organized to adhere to the lifecycle methodology for creating multi-coordinate charts. Each phase in the lifecycle is represented by a separate module or set of files, ensuring separation of concerns and modularity.

### **Folder Structure**

```
chart
├── lifecycle
│   ├── 1_preparation.js            // Preparation Phase
│   ├── 2_domain.js                 // Domain Calculation Phase
│   ├── 3_initialization.js         // Initialization Phase
│   ├── 4_binding.js                // Data Binding & Chart Rendering Phase
│   ├── 5_features.js               // Feature Enrichment Phase
│   ├── 6_interactions.js           // Interactivity Phase
│   ├── createMultiSeriesChart.js   // Multi-Series Chart Creation Phase
│
└── draw
    ├── bars.js                     // Functions for rendering bars (grouped, stacked, etc.)
    ├── linesAndAreas.js            // Functions for rendering lines and areas
    ├── points.js                   // Functions for rendering scatter points
    ├── bubbles.js                  // Functions for rendering bubbles
    ├── axesAndGrid.js              // Functions for creating axes and grid lines
    ├── tooltips.js                 // Functions for tooltip creation and management
    └── utils.js                    // Helper functions used across different draw
    index                           // Main entry point for chart creation
```

### **Lifecycle Phases Explained**

## **1. Preparation Phase (`lifecycle/1_preparation.js`)**

- **Purpose**: Validates input data to ensure that it is well-structured and ready for the subsequent steps in the chart creation process. Ensures accuracy, correct formats, and catches potential errors.
- **Outcome**: Validated, formatted data ready for use, with clear error identification if needed.

## **2. Domain Calculation Phase (`lifecycle/2_domain.js`)**

- **Purpose**: Defines the range of data that needs representation in the chart by calculating x and y domains. Handles merging domains across multiple data series if needed.
- **Outcome**: Calculated data domains for accurate chart scaling.

## **3. Initialization Phase (`lifecycle/3_initialization.js`)**

- **Purpose**: Sets up the chart environment by creating the SVG container, `<g>` chart groups, and initializing scales based on computed domains. This phase lays the foundation for the chart.
- **Outcome**: Initialized SVG container and chart group, with properly set up scales.

## **4. Data Binding & Chart Rendering Phase (`lifecycle/4_binding.js`)**

- **Purpose**: Binds data to the chart elements and renders them. Creates and positions elements like bars, points, and lines, applying appropriate scaling.
- **Outcome**: Main data visuals are rendered within the chart, such as bars, lines, and scatter points.

## **5. Feature Enrichment Phase (`lifecycle/5_features.js`)**

- **Purpose**: Adds supplementary features, such as grids, axes, labels, and visual enhancements. Uses a feature registry to add context to the data visualization.
- **Outcome**: Additional features make the chart more informative and complete, enhancing the user's understanding.

## **6. Interactivity Phase (`lifecycle/6_interactions.js`)**

- **Purpose**: Adds interactive components to the chart, such as tooltips. Manages event handlers for user interactions like mouseover and click.
- **Outcome**: The chart becomes interactive, allowing for deeper user engagement with the data.

## **7. Unified Chart Creation Phase (`lifecycle/unifiedChart.js`)**

- **Purpose**: Coordinates all previous phases to generate a complete, cohesive chart. Manages rendering, interactivity, and final touches.
- **Outcome**: A fully rendered, validated, and interactive chart ready for the user.

## **8. Multi-Series Chart Creation Phase (`lifecycle/createMultiSeriesChart.js`)**

- **Purpose**: Manages rendering multiple data series within one chart, allowing comparative analysis. Handles synchronization for multiple datasets, either merged or separated.
- **Outcome**: Multi-series chart, supporting merged and separate visualizations, for easy data comparison.

### **Drawing Functions in `/chart/draw`**

The `draw` folder contains functions for rendering different visual components of the chart, breaking down rendering logic into modular pieces:

- **`bars.js`**: Renders grouped, stacked, and other types of bars.
- **`linesAndAreas.js`**: Renders lines and areas in the chart.
- **`points.js`**: Handles scatter plots or individual data points.
- **`bubbles.js`**: Renders bubble charts, with variable radii.
- **`axesAndGrid.js`**: Creates axes, grid lines, and chart labels.
- **`tooltips.js`**: Manages tooltip interaction, positioning, and display.
- **`utils.js`**: Provides reusable helper functions needed across various draw modules.

### **Coordinate Systems Supported**

This lifecycle approach supports various coordinate systems:

1. **Cartesian Coordinates (x, y)**: For standard visualizations like line, bar, and scatter plots.
2. **Polar Coordinates (Radius, Angle)**: For charts like pie, radar, and polar bar charts.
3. **Geographic Coordinates (Latitude, Longitude)**: Ideal for map-based visualizations.
4. **Logarithmic Coordinates**: Handles data spanning multiple magnitudes.
5. **Parallel Coordinates**: Suitable for high-dimensional data visualization.
6. **Ternary and Hexagonal Coordinates**: Specialized for compositional and density visualizations.

### **Proposed Lifecycle Methodology in Action**

```
initializeChart (Unified Entry Point)
├── validateAndPrepareData (Step 1: Preparation Phase)
│    └── Validates input data and ensures all required structure is present.
├── calculateDomains (Step 2: Domain Calculation Phase)
│    ├── computeMergedXDomain (Step 2a: Compute x-domain across all series)
│    └── computeMergedValueDomain (Step 2b: Compute y-domain across all series)
├── createScaledChartGroup (Step 3: Initialization Phase)
│    ├── createInitialSVG (Step 3a: Create the main SVG container)
│    ├── createChartGroup (Step 3b: Create a `<g>` element for chart elements)
│    └── initializeScales (Step 3c: Set up x and y scales based on domains)
├── finalizeChartRendering (Step 4: Data Binding & Chart Rendering Phase)
│    ├── Binds the data to chart elements and creates basic data visuals.
│    ├── Uses preparedData and scales for rendering.
│    └── Prepares `createParams` object for later use.
├── applyChartFeatures (Step 5: Feature Enrichment Phase)
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

The revised folder structure and lifecycle methodology ensure that the chart creation process is organized into clear, manageable phases. This modular approach facilitates the development of feature-rich, reusable, and scalable chart components across multiple chart types and coordinate systems.

