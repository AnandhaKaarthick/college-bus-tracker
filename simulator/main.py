import asyncio
import json
import os
import sys
from agents.bus_agent import BusAgent

# Add parent dir to path to find utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import argparse

async def main():
    parser = argparse.ArgumentParser(description="Bus Simulator")
    parser.add_argument("--route", default="ayapakkam_rit.json", help="Route JSON filename")
    parser.add_argument("--bus", default="1", help="Bus ID in database")
    args = parser.parse_args()

    # Configuration
    current_dir = os.path.dirname(os.path.abspath(__file__))
    ws_url = f"ws://localhost:8000/ws/driver/{args.bus}" 
    route_file = os.path.join(current_dir, "routes", args.route)
    
    if not os.path.exists(route_file):
        print(f"Error: {route_file} not found.")
        return

    with open(route_file, 'r') as f:
        route_data = json.load(f)
    
    print("===============================================", flush=True)
    print("  BUS SIMULATOR: REAL-WORLD ROUTE", flush=True)
    print(f"  Route: {route_data['route_name']}", flush=True)
    print(f"  Bus ID: {args.bus}", flush=True)
    print("===============================================", flush=True)
    
    agent = BusAgent(bus_id=args.bus, route_data=route_data, ws_url=ws_url)
    
    try:
        await agent.run()
    except KeyboardInterrupt:
        print("\nSimulation stopped by user.", flush=True)
    except Exception as e:
        print(f"Simulation error: {e}", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
