import httpx
try:
    d = httpx.get('http://localhost:8000/api/routes').json()
    print(f'Routes count: {len(d["routes"])}')
    for r in d["routes"]:
        print(f'- {r["id"]}: {r["name"]}')
except Exception as e:
    print(f"Error: {e}")
