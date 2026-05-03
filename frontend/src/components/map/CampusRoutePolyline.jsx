import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusRoute           from "../../data/rit_campus_route.json";
import { useTheme }          from "../../context/ThemeContext";

export default function CampusRoutePolyline({ visible }) {
  const map      = useMap();
  const ref      = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!visible) {
      if (ref.current) { map.removeLayer(ref.current); ref.current = null; }
      return;
    }

    const coords = campusRoute.coordinates.map(([lng, lat]) => [lat, lng]);

    ref.current = L.polyline(coords, {
      color:     theme === "dark" ? "#FF6B74" : "#E63946",
      weight:    3,
      opacity:   0.80,
      dashArray: "8, 6",
      lineCap:   "round",
    }).addTo(map);

    return () => {
      if (ref.current) { map.removeLayer(ref.current); ref.current = null; }
    };
  }, [map, visible, theme]);

  return null;
}
