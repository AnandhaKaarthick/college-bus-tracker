import { useState, useEffect, useRef } from "react";
import { useMapEvents, useMap } from "react-leaflet";
import CampusBoundaryPolygon from "./CampusBoundaryPolygon";
import CampusRoutePolyline   from "./CampusRoutePolyline";
import CampusStopMarkers     from "./CampusStopMarkers";
import CampusSchematicLayer  from "./CampusSchematicLayer";
import CampusLabelLayer      from "./CampusLabelLayer";
import { useCampusMode }     from "../../hooks/useCampusMode";

const CAMPUS_DETAIL_ZOOM = 14;

export default function CampusOverlayLayer({ busLat, busLng, onCampusStopClick }) {
  const map = useMap();
  const [currentZoom,  setCurrentZoom]  = useState(map.getZoom());
  const { isOnCampus }                  = useCampusMode(busLat, busLng);
  const prevOnCampusRef                 = useRef(false);

  useEffect(() => {
    const prevOnCampus = prevOnCampusRef.current;
    if (isOnCampus && !prevOnCampus) {
      // Entered campus
      map.flyTo([13.0130, 80.0038], 17, { duration: 1.8 });
    } else if (!isOnCampus && prevOnCampus) {
      // Exited campus
      map.flyTo([13.0500, 80.1200], 13, { duration: 1.5 });
    }
    prevOnCampusRef.current = isOnCampus;
  }, [isOnCampus, map]);

  // Track zoom level
  useMapEvents({
    zoomend: (e) => setCurrentZoom(e.target.getZoom()),
  });

  const showDetail   = currentZoom >= CAMPUS_DETAIL_ZOOM;
  const showBoundary = currentZoom >= 14;

  return (
    <>
      {/* Campus boundary — visible at zoom 14+ */}
      {showBoundary && (
        <CampusBoundaryPolygon isHighlighted={isOnCampus} />
      )}

      {/* Schematic Buildings and Labels — Zoom 16+ */}
      {showDetail && (
        <>
          <CampusSchematicLayer />
          <CampusLabelLayer />
        </>
      )}

      {/* Internal route dashed line — only when bus is on campus */}
      {isOnCampus && showDetail && (
        <CampusRoutePolyline visible />
      )}

      {/* Stop markers — zoom 16+ */}
      {showDetail && (
        <CampusStopMarkers
          visible
          onStopClick={onCampusStopClick}
        />
      )}
    </>
  );
}
