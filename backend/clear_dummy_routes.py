import sqlite3
import json
import os

def clear_dummy_routes():
    db_path = os.path.join(os.path.dirname(__file__), 'college_bus_tracker.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    print("--- Cleaning dummy seeded routes ---")
    
    # 1. Clear stops
    c.execute('DELETE FROM stops')
    print(f"Deleted stops: {c.rowcount}")

    # 2. Clear stop arrivals & schedules
    try:
        c.execute('DELETE FROM stop_arrivals')
    except Exception:
        pass
    try:
        c.execute('DELETE FROM route_schedules')
    except Exception:
        pass

    # 3. Clear routes
    c.execute('DELETE FROM routes')
    print(f"Deleted routes: {c.rowcount}")

    # 4. Reset route assignment on buses & reset position
    c.execute('UPDATE buses SET route_id = NULL, status = "offline"')
    c.execute('DELETE FROM bus_live_positions')
    print(f"Reset fleet buses and live positions.")

    # 5. Reset route assignment on users
    c.execute('UPDATE users SET assigned_route_id = NULL, assigned_stop_id = NULL WHERE role != "admin"')
    print(f"Reset user route assignments.")

    conn.commit()
    conn.close()

    # 6. Clear routes_geometry.json
    geom_path = os.path.join(os.path.dirname(__file__), 'routes_geometry.json')
    try:
        with open(geom_path, 'w', encoding='utf-8') as f:
            json.dump({}, f)
        print("Reset routes_geometry.json to empty.")
    except Exception as e:
        print("Note on routes_geometry.json:", e)

    print("\nDatabase is now completely clean and ready for real-time testing with real routes!")

if __name__ == '__main__':
    clear_dummy_routes()
