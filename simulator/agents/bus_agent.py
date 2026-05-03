import asyncio
import json
import random
import websockets
import httpx
from datetime import datetime
from utils.geo import haversine, calculate_heading, interpolate

class BusAgent:
    def __init__(self, bus_id, route_data, ws_url):
        self.bus_id = bus_id
        self.raw_waypoints = route_data['waypoints']
        self.route_name = route_data['route_name']
        self.ws_url = ws_url
        self.road_points = []
        self.current_pt_idx = 0
        self.lat = self.raw_waypoints[0]['lat']
        self.lng = self.raw_waypoints[0]['lng']
        self.speed = 0.0
        self.heading = 0.0
        self.occupancy = "low"
        self.status = "on_track"
        self.state = "IDLE"
        self.running = True

    async def expand_route(self):
        print(f"[{self.bus_id}] Expanding route with OSRM road points...")
        expanded = []
        async with httpx.AsyncClient() as client:
            for i in range(len(self.raw_waypoints) - 1):
                w1 = self.raw_waypoints[i]
                w2 = self.raw_waypoints[i+1]
                url = f"http://router.project-osrm.org/route/v1/driving/{w1['lng']},{w1['lat']};{w2['lng']},{w2['lat']}?overview=full&geometries=geojson"
                try:
                    resp = await client.get(url, timeout=10.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        coords = data['routes'][0]['geometry']['coordinates']
                        for c in coords:
                            expanded.append({
                                "lat": c[1],
                                "lng": c[0],
                                "is_stop": False,
                                "speed_zone": w2['speed_zone_kmh'],
                                "traffic_mult": w2['traffic_multiplier']
                            })
                        # Mark the actual stop at the end of segment
                        expanded[-1]["is_stop"] = True
                        expanded[-1]["stop_data"] = w2
                except Exception as e:
                    print(f"[{self.bus_id}] OSRM Error for segment {i}: {e}")
                    # Fallback to direct interpolation if OSRM fails
                    expanded.append({"lat": w2['lat'], "lng": w2['lng'], "is_stop": True, "stop_data": w2, "speed_zone": w2['speed_zone_kmh'], "traffic_mult": w2['traffic_multiplier']})
        
        self.road_points = expanded
        print(f"[{self.bus_id}] Route expanded to {len(self.road_points)} road points.")

    async def run(self):
        await self.expand_route()
        
        print(f"[{self.bus_id}] Connecting to {self.ws_url}...", flush=True)
        try:
            async with websockets.connect(self.ws_url) as ws:
                print(f"[{self.bus_id}] Connected!", flush=True)
                
                while self.running and self.current_pt_idx < len(self.road_points):
                    pt = self.road_points[self.current_pt_idx]
                    self.lat = pt['lat']
                    self.lng = pt['lng']
                    
                    # Heading
                    if self.current_pt_idx < len(self.road_points) - 1:
                        next_pt = self.road_points[self.current_pt_idx + 1]
                        self.heading = calculate_heading(self.lat, self.lng, next_pt['lat'], next_pt['lng'])
                    
                    # Speed & State
                    self.state = "MOVING"
                    self.status = "on_track"
                    base_speed = pt.get('speed_zone', 30)
                    mult = pt.get('traffic_mult', 1.0)
                    self.speed = round(base_speed * mult * (1 + random.uniform(-0.1, 0.1)), 1)
                    
                    try:
                        await self.send_update(ws)
                    except Exception as e:
                        print(f"[{self.bus_id}] Send Error: {e}")
                        break
                    
                    if pt['is_stop']:
                        stop = pt['stop_data']
                        self.state = "DWELLING"
                        self.speed = 0.0
                        print(f"[{self.bus_id}] Arrived at {stop['name']}. Dwelling for {stop['stop_dwell_seconds']}s", flush=True)
                        self.update_occupancy()
                        
                        dwell = stop['stop_dwell_seconds']
                        for _ in range(0, dwell, 5):
                            try:
                                await self.send_update(ws)
                            except: break
                            await asyncio.sleep(5)
                        
                        if random.random() < 0.05: # 5% chance of breakdown at stop
                            await self.handle_breakdown(ws)
                    
                    self.current_pt_idx += 1
                    await asyncio.sleep(2)
        except Exception as e:
            print(f"[{self.bus_id}] Connection Error: {e}")
            
            print(f"[{self.bus_id}] Route Complete! Arrived at Destination.", flush=True)

    async def send_update(self, ws):
        packet = {
            "type": "location_update",
            "data": {
                "bus_id": self.bus_id,
                "lat": self.lat,
                "lng": self.lng,
                "speed": self.speed,
                "heading": self.heading,
                "occupancy": self.occupancy,
                "status": self.status,
                "timestamp": datetime.now().isoformat()
            }
        }
        await ws.send(json.dumps(packet))

    def update_occupancy(self):
        levels = ["low", "medium", "full"]
        if self.occupancy == "low": self.occupancy = random.choice(["low", "medium"])
        elif self.occupancy == "medium": self.occupancy = random.choice(["low", "medium", "full"])
        else: self.occupancy = random.choice(["medium", "full"])

    async def handle_breakdown(self, ws):
        self.state = "BREAKDOWN"
        self.status = "breakdown"
        print(f"[{self.bus_id}] !!! BREAKDOWN !!!", flush=True)
        # In a real app we'd send an alert packet here too
        await asyncio.sleep(30)
        self.status = "on_track"
        self.state = "MOVING"
