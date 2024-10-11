### **Coordinate System Configuration Mappings**

This section provides an overview of how to map configuration options for each supported coordinate system. The configuration system is designed to be intuitive, allowing developers to quickly specify the data attributes and generate a visual representation without the hassle of manual D3.js complexities. Below, we outline the mapping configurations for each of the coordinate systems supported by the Universal Chart Library.

#### **1. Cartesian Coordinates**
Cartesian coordinates are used for traditional x-y plotting like bar charts, line charts, scatter plots, and area charts. The Cartesian configuration specifies data points along an x and y axis, and optionally, a third attribute for magnitude.

**Example Configuration:**
```json
{
  "type": "cartesian",
  "config": {
    "name": "cityTemperature",
    "data": "temperatureData",
    "coordinates": {
      "x": "date",          // Maps to x-axis (e.g., a date or categorical data)
      "y": "averageTemperature" // Maps to y-axis (e.g., numerical value)
    },
    "magnitude": "humidityLevel"  // Optional, used for additional context, like bubble size in scatter plots
  }
}
```

- **`x`**: Specifies the data attribute for the x-axis.
- **`y`**: Specifies the data attribute for the y-axis.
- **`magnitude`**: Optional, can be used for bubble size or another value.

#### **2. Polar Coordinates**
Polar coordinates represent data along radial and angular axes, suitable for pie charts, radar charts, and polar bar charts. The configuration uses `angle` and `radius` to plot the data.

**Example Configuration:**
```json
{
  "type": "polar",
  "config": {
    "name": "monthlyWeather",
    "data": "weatherData",
    "coordinates": {
      "angle": "month",    // Angular mapping (e.g., months of the year)
      "radius": "rainfall"  // Radial mapping (e.g., numeric value like rainfall)
    },
    "magnitude": "windSpeed"  // Optional, used to size elements like bars in polar bar charts
  }
}
```

- **`angle`**: Defines the angular axis, often a categorical value.
- **`radius`**: Defines the radial axis, usually a numeric value.
- **`magnitude`**: Optional, provides additional scaling for visual elements.

#### **3. Spherical Coordinates**
Spherical coordinates are used for 3D-like visualizations involving spherical surfaces, like globe visualizations. This coordinate system defines data by longitude, latitude, and an optional radius.

**Example Configuration:**
```json
{
  "type": "spherical",
  "config": {
    "name": "earthquakeMap",
    "data": "earthquakeData",
    "coordinates": {
      "longitude": "longitude",  // Longitude value (x position on a sphere)
      "latitude": "latitude",    // Latitude value (y position on a sphere)
      "radius": "depth"          // Optional, represents radius or height
    },
    "magnitude": "magnitude"  // Optional, used for earthquake magnitude representation
  }
}
```

- **`longitude`**: Specifies the longitudinal coordinate.
- **`latitude`**: Specifies the latitudinal coordinate.
- **`radius`**: Optional, used to add depth or height.

#### **4. Cylindrical Coordinates**
Cylindrical coordinates combine radial positioning with a height value, useful for radial bar charts and other cylindrical representations.

**Example Configuration:**
```json
{
  "type": "cylindrical",
  "config": {
    "name": "cylindricalChart",
    "data": "cylinderData",
    "coordinates": {
      "radial": "category",   // Radial axis for categorical data
      "height": "value"       // Height of the cylinder/bar
    },
    "magnitude": "intensity"  // Optional, represents intensity or size
  }
}
```

- **`radial`**: Defines the radial positioning.
- **`height`**: Defines the height of the visual elements.

#### **5. Geographic Coordinates**
Geographic coordinates are designed for maps, choropleths, or geo-heatmaps. They require latitude and longitude for spatial mapping.

**Example Configuration:**
```json
{
  "type": "geographic",
  "config": {
    "name": "worldMap",
    "data": "geoData",
    "coordinates": {
      "latitude": "lat",   // Latitude value
      "longitude": "lon"   // Longitude value
    },
    "magnitude": "populationDensity"  // Optional, can represent density or marker size
  }
}
```

- **`latitude`**: Specifies latitude.
- **`longitude`**: Specifies longitude.
- **`magnitude`**: Optional, used for marker size or color intensity.

#### **6. Logarithmic Coordinates**
Logarithmic coordinates are useful for data that spans multiple orders of magnitude. You can apply log scaling to either x or y.

**Example Configuration:**
```json
{
  "type": "logarithmic",
  "config": {
    "name": "logChart",
    "data": "growthData",
    "coordinates": {
      "x": "year",
      "y": "population"
    },
    "scale": {
      "y": "log"   // Apply logarithmic scaling to the y-axis
    }
  }
}
```

- **`scale`**: Allows the user to define logarithmic scaling on x or y.

#### **7. Parallel Coordinates**
Parallel coordinates are great for visualizing multi-dimensional datasets by defining each attribute as a separate axis.

**Example Configuration:**
```json
{
  "type": "parallel",
  "config": {
    "name": "parallelChart",
    "data": "multiAttributeData",
    "coordinates": {
      "dimensions": ["height", "weight", "age"]  // Each attribute represented along a parallel axis
    }
  }
}
```

#### **8. Ternary Coordinates**
Ternary coordinates are used to represent three-component data (e.g., compositions) on a triangular graph.

**Example Configuration:**
```json
{
  "type": "ternary",
  "config": {
    "name": "ternaryComposition",
    "data": "compositionData",
    "coordinates": {
      "a": "componentA",
      "b": "componentB",
      "c": "componentC"
    }
  }
}
```

- **`a, b, c`**: Represents the three axes of a ternary plot.

#### **9. Hexagonal Coordinates**
Hexagonal coordinates are used for density plots or hexbin visualizations. The configuration maps data to x and y axes, with an optional magnitude.

**Example Configuration:**
```json
{
  "type": "hexagonal",
  "config": {
    "name": "hexbinDensity",
    "data": "hexData",
    "coordinates": {
      "x": "longitude",
      "y": "latitude"
    },
    "magnitude": "density"  // Optional, represents density or color intensity
  }
}
```

### **Conclusion**
Each coordinate system has a unique configuration that aligns with the nature of the data you wish to visualize. By using simple mappings for each system, the Universal Chart Library makes complex visualization creation much more accessible and less cumbersome—offering the full power of D3.js without the headache of learning its low-level intricacies.

This configuration-driven approach ensures that creating multi-coordinate visualizations is both **easy** and **intuitive**.

