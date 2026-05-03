import { useState, useEffect } from "react";
import campusBoundary from "../data/rit_campus_boundary.json";

/**
 * Determines if a given lat/lng is inside the RIT campus polygon.
 * Uses ray-casting algorithm — O(n) per check, fine for <30 polygon points.
 */
function pointInPolygon(lat, lng, polygon) {
  if (!polygon || !polygon.features || !polygon.features[0]) return false;
  const coords = polygon.features[0].geometry.coordinates[0];
  let inside = false;
  let j = coords.length - 1;

  for (let i = 0; i < coords.length; i++) {
    const [xi, yi] = coords[i]; // [lng, lat]
    const [xj, yj] = coords[j];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
}

export function useCampusMode(busLat, busLng) {
  const [isOnCampus,  setIsOnCampus]  = useState(false);
  const [campusZone,  setCampusZone]  = useState(null);

  useEffect(() => {
    if (busLat == null || busLng == null) return;

    const onCampus = pointInPolygon(busLat, busLng, campusBoundary);
    setIsOnCampus(onCampus);
    setCampusZone(onCampus ? "RIT" : null);
  }, [busLat, busLng]);

  return { isOnCampus, campusZone };
}
