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
    if (selectedRouteId) {
      const route = routes.find(r => r.id === selectedRouteId);
      if (route && route.polyline && route.polyline.length > 0) {
        const bounds = L.latLngBounds(route.polyline);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }
    } else {
      // Default view
      map.flyTo([13.0494, 80.0249], 13, { duration: 1.5 });
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

export default function LiveMapPanel({ buses, selectedRouteId, onBusClick, routes }) {
  const { theme } = useTheme();

  const filteredBuses = selectedRouteId
    ? buses.filter(b => b.route_id === selectedRouteId)
    : buses;

  const filteredRoutes = selectedRouteId
    ? routes.filter(r => r.id === selectedRouteId)
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
          const polyline = (route.polyline && route.polyline.length > 15)
            ? route.polyline
            : (routesGeometry[String(route.id)] || route.polyline || []);
          return (
            <Fragment key={route.id}>
              {polyline && polyline.length > 0 && (
                <Polyline 
                  positions={polyline} 
                  color={route.id === selectedRouteId ? route.color : '#94A3B8'} 
                  weight={route.id === selectedRouteId ? 6 : 3}
                  opacity={route.id === selectedRouteId ? 0.8 : 0.3}
                />
              )}
            {route.stops.map(stop => (
              <Marker 
                key={stop.id} 
                position={[stop.lat, stop.lng]}
                icon={new L.DivIcon({
                  className: 'stop-marker',
                  html: `<div class="w-3 h-3 rounded-full border-2 border-white shadow-sm" style="background: ${route.color}"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              >
                <Popup><b>{stop.name}</b><br/>{route.name}</Popup>
              </Marker>
            ))}
            </Fragment>
          );
        })}

        {filteredBuses.filter(b => b.lat).map(bus => (
          <Marker 
            key={bus.bus_id} 
            position={[bus.lat, bus.lng]} 
            icon={busIcon(occupancyColor(bus.occupancy))}
            eventHandlers={{
              click: () => onBusClick(bus.bus_id)
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="font-black uppercase tracking-tight">{bus.name}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">{bus.vehicle_number}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController selectedRouteId={selectedRouteId} routes={routes} />
      </MapContainer>
    </div>
  );
}
