import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusBlocks         from "../../data/campus_blocks_schematic.json";
import { useTheme }          from "../../context/ThemeContext";

export default function CampusSchematicLayer() {
  const map       = useMap();
  const layersRef = useRef([]);
  const { theme } = useTheme();

  useEffect(() => {
    // Clear old layers
    layersRef.current.forEach(layer => map.removeLayer(layer));
    layersRef.current = [];

    const STYLES = {
      building: {
        color:       "#2B3D51",
        weight:      2,
        opacity:     0.8,
        fillColor:   theme === "dark" ? "#1B263B" : "#FFFFFF",
        fillOpacity: 0.9,
      },
      hover: {
        fillColor:   "#E63946",
        fillOpacity: 0.1,
      }
    };

    campusBlocks.features.forEach(feature => {
      // GeoJSON [lng, lat] to Leaflet [lat, lng]
      const coords = feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      
      const polygon = L.polygon(coords, STYLES.building)
        .addTo(map)
        .on('mouseover', (e) => {
          e.target.setStyle({ fillColor: '#E63946', fillOpacity: 0.2 });
        })
        .on('mouseout', (e) => {
          e.target.setStyle(STYLES.building);
        });

      layersRef.current.push(polygon);
    });

    return () => {
      layersRef.current.forEach(layer => map.removeLayer(layer));
      layersRef.current = [];
    };
  }, [map, theme]);

  return null;
}
