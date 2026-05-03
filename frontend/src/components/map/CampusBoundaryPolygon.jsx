import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusBoundary        from "../../data/rit_campus_boundary.json";
import { useTheme }          from "../../context/ThemeContext";

export default function CampusBoundaryPolygon({ isHighlighted = false }) {
  const map        = useMap();
  const layerRef   = useRef(null);
  const { theme }  = useTheme();

  const STYLES = {
    normal: {
      color:       "#E6A817",     // campus boundary gold
      weight:      3,
      opacity:     0.85,
      fillColor:   theme === "dark" ? "#1B263B" : "#F4F6FA",
      fillOpacity: 0.08,
      dashArray:   null,
    },
    highlighted: {
      color:       "#E63946",     // red glow
      weight:      4,
      opacity:     1.0,
      fillColor:   "#E63946",
      fillOpacity: 0.06,
      dashArray:   null,
    },
  };

  useEffect(() => {
    const style = isHighlighted ? STYLES.highlighted : STYLES.normal;

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const coords = campusBoundary.features[0].geometry.coordinates[0]
      .map(([lng, lat]) => [lat, lng]);

    if (layerRef.current) {
      layerRef.current.setStyle(style);
      return;
    }

    layerRef.current = L.polygon(coords, style)
      .bindTooltip("RIT Campus", {
        permanent:  false,
        direction:  "center",
        className:  "campus-boundary-tooltip",
      })
      .addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, isHighlighted, theme]);

  return null;
}
