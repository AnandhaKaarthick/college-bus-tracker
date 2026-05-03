import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusBlocks         from "../../data/campus_blocks_schematic.json";

function getCentroid(coords) {
  let lat = 0, lng = 0;
  coords.forEach(c => { lat += c[1]; lng += c[0]; });
  return [lat / coords.length, lng / coords.length];
}

export default function CampusLabelLayer() {
  const map       = useMap();
  const markersRef = useRef([]);

  useEffect(() => {
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    campusBlocks.features.forEach(feature => {
      const centroid = getCentroid(feature.geometry.coordinates[0]);
      
      const icon = L.divIcon({
        className: 'schematic-label',
        html: `
          <div style="
            text-align: center;
            font-weight: 900;
            font-size: 11px;
            text-transform: uppercase;
            color: #1B263B;
            background: rgba(255,255,255,0.8);
            padding: 2px 6px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            pointer-events: none;
            white-space: nowrap;
          ">
            ${feature.properties.name}
          </div>
        `,
        iconSize: [60, 20],
        iconAnchor: [30, 10]
      });

      const marker = L.marker(centroid, { icon, interactive: false }).addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [map]);

  return null;
}
