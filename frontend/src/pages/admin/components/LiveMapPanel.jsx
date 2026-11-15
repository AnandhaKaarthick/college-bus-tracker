import { useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../../../context/ThemeContext';
import routesGeometry from '../../../data/routesGeometry.json';

// --- LEAFLET ASSET FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ selectedRouteId, routes }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedRouteId) {
      const route = routes.find(r => String(r.id) === String(selectedRouteId));
      if (route) {
        const poly = (route.polyline && route.polyline.length > 0)
          ? route.polyline
          : (routesGeometry[String(route.id)] || (route.stops && route.stops.map(s => [s.lat, s.lng])));
        if (poly && poly.length > 0) {
          const bounds = L.latLngBounds(poly);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
    } else if (routes && routes.length > 0) {
      const allPoints = [];
      routes.forEach(r => {
        if (r.stops) r.stops.forEach(s => allPoints.push([s.lat, s.lng]));
        if (r.polyline) r.polyline.forEach(p => allPoints.push(p));
      });
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50], maxZoom: 14 });
      } else {
        map.flyTo([13.0494, 80.0249], 13);
      }
    }
  }, [selectedRouteId, routes, map]);

  return null;
}

const busIcon = (color = "#3B82F6") => new L.DivIcon({
  className: 'admin-bus-icon',
  html: `
    <div class="relative flex items-center justify-center w-10 h-10">
      <div class="relative bg-white p-1.5 rounded-full shadow-xl border-2" style="border-color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.8 2 11 2 11.2V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function LiveMapPanel({ buses = [], selectedRouteId = null, onBusClick, onBusSelect, routes = [] }) {
  const { theme } = useTheme();

  const handleBusClick = (busId) => {
    if (onBusClick) onBusClick(busId);
    if (onBusSelect) onBusSelect(busId);
  };

  const filteredBuses = selectedRouteId
    ? buses.filter(b => String(b.route_id) === String(selectedRouteId))
    : buses;

  const filteredRoutes = selectedRouteId
    ? routes.filter(r => String(r.id) === String(selectedRouteId))
    : routes;

  const occupancyColor = (lvl) => {
    if (lvl === 'full') return '#EF4444';
    if (lvl === 'medium') return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="h-full w-full">
      <MapContainer center={[13.0494, 80.0249]} zoom={13} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredRoutes.map(route => {
          // Robust polyline resolver: road-snapped polyline > routesGeometry cache > straight line between stops
          let polyline = (route.polyline && route.polyline.length >= 2) ? route.polyline : null;
          if (!polyline && routesGeometry[String(route.id)]) {
            polyline = routesGeometry[String(route.id)];
          }
          if (!polyline && route.stops && route.stops.length >= 2) {
            polyline = route.stops.map(s => [s.lat, s.lng]);
          }

          const isSelected = selectedRouteId && String(route.id) === String(selectedRouteId);
          const isOverview = !selectedRouteId;
          const routeColor = route.color || '#3B82F6';

          return (
            <Fragment key={route.id}>
              {polyline && polyline.length >= 2 && (
                <>
                  <Polyline 
                    positions={polyline} 
                    color="#0F172A" 
                    weight={isSelected ? 8 : 6}
                    opacity={isSelected ? 0.35 : isOverview ? 0.25 : 0.1}
                  />
                  <Polyline 
                    positions={polyline} 
                    color={isSelected ? routeColor : isOverview ? routeColor : '#94A3B8'} 
                    weight={isSelected ? 6 : isOverview ? 5 : 2}
                    opacity={isSelected ? 1.0 : isOverview ? 0.85 : 0.35}
                  />
                </>
              )}
            {(route.stops || []).map((stop, idx) => (
              <Marker 
                key={stop.id || idx} 
                position={[stop.lat, stop.lng]}
                icon={new L.DivIcon({
                  className: 'stop-marker',
                  html: `
                    <div class="flex items-center justify-center">
                      <div class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md flex items-center justify-center" style="background: ${routeColor}">
                        <div class="w-1 h-1 rounded-full bg-white"></div>
                      </div>
                    </div>
                  `,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7]
                })}
              >
                <Popup>
                  <div className="p-1 min-w-[120px]">
                    <div className="font-bold text-xs text-slate-900">{stop.name}</div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{route.name}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
            </Fragment>
          );
        })}

        {filteredBuses.filter(b => b.lat && b.lng).map(bus => (
          <Marker 
            key={bus.bus_id} 
            position={[bus.lat, bus.lng]} 
            icon={busIcon(occupancyColor(bus.occupancy))}
            eventHandlers={{
              click: () => handleBusClick(bus.bus_id)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[130px]">
                <div className="font-black text-sm uppercase tracking-tight text-slate-900">{bus.name}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">{bus.vehicle_number}</div>
                <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Status:</span>
                  <span className="text-green-600 font-bold uppercase text-[10px]">{bus.status || 'Active'}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController selectedRouteId={selectedRouteId} routes={routes} />
      </MapContainer>
    </div>
  );
}
