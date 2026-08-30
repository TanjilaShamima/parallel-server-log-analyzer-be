import random
from datetime import datetime, timedelta
from pathlib import Path

METHODS = ["GET", "POST", "PUT", "DELETE"]
ENDPOINTS = [
    "/api/login",
    "/api/products",
    "/api/orders",
    "/api/payment",
    "/api/profile",
    "/api/logout",
    "/api/dashboard"
]
STATUS_CODES = [200, 200, 200, 201, 400, 401, 403, 404, 500]
IPS = [f"192.168.1.{i}" for i in range(1, 80)]

def generate_log_line(base_time):
    ip = random.choice(IPS)
    method = random.choice(METHODS)
    endpoint = random.choice(ENDPOINTS)
    status = random.choice(STATUS_CODES)

    if status == 401 and endpoint == "/api/login":
        message = "FAILED_LOGIN"
    elif status == 500:
        message = "SERVER_ERROR"
    elif status == 404:
        message = "NOT_FOUND"
    else:
        message = "OK"

    return f"{base_time} {ip} {method} {endpoint} {status} {message}\n"

def generate_logs(total_lines=100000, output_path=None):
    if output_path is None:
        project_root = Path(__file__).resolve().parent.parent
        output_path = project_root / "data" / "server.log"
    else:
        output_path = Path(output_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    start_time = datetime(2026, 8, 24, 10, 0, 0)

    with open(output_path, "w", encoding="utf-8") as file:
        for i in range(total_lines):
            current_time = start_time + timedelta(seconds=i)
            file.write(generate_log_line(current_time))

    print(f"Generated {total_lines} log lines at {output_path}")

if __name__ == "__main__":
    generate_logs(total_lines=100000)
