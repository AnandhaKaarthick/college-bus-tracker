import httpx
import json
import os

def get_road_poly(waypoints):
    coords = ";".join([f"{w['lng']},{w['lat']}" for w in waypoints])
    url = f"http://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson"
    r = httpx.get(url, timeout=25)
    if r.status_code == 200:
        data = r.json()
        coords_list = data['routes'][0]['geometry']['coordinates']
        return [[c[1], c[0]] for c in coords_list]
    raise Exception(f"OSRM error: {r.status_code}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sim_dir = os.path.join(base_dir, "..", "simulator", "routes")

    with open(os.path.join(sim_dir, "ayapakkam_rit.json"), "r", encoding="utf-8") as f:
        r1 = json.load(f)
    print("Fetching Route 1 road geometry...")
    p1 = get_road_poly(r1["waypoints"])
    print(f"Route 1: {len(p1)} road points.")

    with open(os.path.join(sim_dir, "jj_nagar_rit.json"), "r", encoding="utf-8") as f:
        r2 = json.load(f)
    print("Fetching Route 2 road geometry...")
    p2 = get_road_poly(r2["waypoints"])
    print(f"Route 2: {len(p2)} road points.")

    out_backend = os.path.join(base_dir, "routes_geometry.json")
    with open(out_backend, "w", encoding="utf-8") as f:
        json.dump({"1": p1, "2": p2}, f)
    print(f"Saved to {out_backend}")

    # Also save directly into frontend/src/data for immediate client-side fallback
    front_dir = os.path.join(base_dir, "..", "frontend", "src", "data")
    os.makedirs(front_dir, exist_ok=True)
    out_front = os.path.join(front_dir, "routesGeometry.json")
    with open(out_front, "w", encoding="utf-8") as f:
        json.dump({"1": p1, "2": p2}, f)
    print(f"Saved to {out_front}")

if __name__ == "__main__":
    main()
