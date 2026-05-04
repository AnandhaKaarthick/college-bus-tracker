import sqlite3
conn = sqlite3.connect('backend/college_bus_tracker.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(buses)")
cols = cursor.fetchall()
for col in cols:
    print(col)
conn.close()
