import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusStops           from "../../data/rit_campus_stops.json";
import { useTheme }          from "../../context/ThemeContext";

function createCampusStopIcon(stop, theme) {
  const bg = theme === "dark" ? "#243347" : "#FFFFFF";

  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${bg};
        border: 2px solid ${stop.color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.20);
      ">
        ${stop.icon}
      </div>
    `,
  });
}

export default function CampusStopMarkers({ visible, onStopClick }) {
  const map       = useMap();
  const markersRef = useRef([]);
  const { theme } = useTheme();

  useEffect(() => {
    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (!visible) return;

    campusStops.forEach(stop => {
      const icon   = createCampusStopIcon(stop, theme);
      const marker = L.marker([stop.lat, stop.lng], { icon })
        .bindTooltip(stop.name, {
          permanent:  false,
          direction:  "top",
          offset:     [0, -18],
          className:  "campus-stop-tooltip",
        })
        .on("click", () => onStopClick?.(stop))
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [map, visible, theme]);

  return null;
}
