import httpx
import sys

def check_services():
    services = [
        ("Express Core API", "http://localhost:4000/health", 200),
        ("FastAPI Analytics", "http://localhost:8000/health", 200),
        ("Next.js Frontend", "http://localhost:3001", 200),
    ]
    
    all_ok = True
    print("\n--- Verifying Active EduSphere Localhost Services ---")
    for name, url, expected_status in services:
        try:
            r = httpx.get(url, timeout=5.0)
            status_symbol = "✅" if r.status_code == expected_status else "⚠️"
            print(f"{status_symbol} {name:<20}: {url} -> HTTP {r.status_code}")
            if r.status_code != expected_status:
                all_ok = False
        except Exception as e:
            print(f"❌ {name:<20}: {url} -> Connection failed ({e})")
            all_ok = False
            
    print("----------------------------------------------------\n")
    if not all_ok:
        sys.exit(1)
    print("All services are healthy and responsive!")

if __name__ == "__main__":
    check_services()
