import time
import json
import os
from collections import Counter, defaultdict
from multiprocessing import Pool, cpu_count


def empty_summary():
    return {
        "total_requests": 0,
        "status_count": Counter(),
        "ip_count": Counter(),
        "endpoint_count": Counter(),
        "failed_login_count": 0,
        "server_error_count": 0,
        "not_found_count": 0,
    }


def parse_line(line):
    parts = line.strip().split()

    if len(parts) < 7:
        return None

    # parts:
    # 0=date, 1=time, 2=ip, 3=method, 4=endpoint, 5=status, 6=message
    return {
        "ip": parts[2],
        "method": parts[3],
        "endpoint": parts[4],
        "status": parts[5],
        "message": parts[6],
    }


def update_summary(summary, parsed):
    if parsed is None:
        return

    summary["total_requests"] += 1
    summary["status_count"][parsed["status"]] += 1
    summary["ip_count"][parsed["ip"]] += 1
    summary["endpoint_count"][parsed["endpoint"]] += 1

    if parsed["message"] == "FAILED_LOGIN":
        summary["failed_login_count"] += 1

    if parsed["status"] == "500":
        summary["server_error_count"] += 1

    if parsed["status"] == "404":
        summary["not_found_count"] += 1


def sequential_analyze(file_path):
    summary = empty_summary()

    start_time = time.perf_counter()

    with open(file_path, "r", encoding="utf-8") as file:
        for line in file:
            parsed = parse_line(line)
            update_summary(summary, parsed)

    end_time = time.perf_counter()

    return summary, end_time - start_time


def make_json_serializable(summary):
    return {
        "total_requests": summary["total_requests"],
        "status_count": dict(summary["status_count"]),
        "ip_count": dict(summary["ip_count"]),
        "endpoint_count": dict(summary["endpoint_count"]),
        "failed_login_count": summary["failed_login_count"],
        "server_error_count": summary["server_error_count"],
        "not_found_count": summary["not_found_count"],
    }


def print_summary(title, summary, execution_time):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)
    print(f"Total Requests      : {summary['total_requests']}")
    print(f"Failed Login Count  : {summary['failed_login_count']}")
    print(f"Server Error Count  : {summary['server_error_count']}")
    print(f"404 Not Found Count : {summary['not_found_count']}")
    print(f"Execution Time      : {execution_time:.4f} seconds")

    print("\nTop 5 IPs:")
    for ip, count in summary["ip_count"].most_common(5):
        print(f"{ip} -> {count}")

    print("\nTop 5 Endpoints:")
    for endpoint, count in summary["endpoint_count"].most_common(5):
        print(f"{endpoint} -> {count}")


if __name__ == "__main__":
    file_path = "data/server.log"
    summary, sequential_time = sequential_analyze(file_path)
    print_summary("Sequential Log Analysis Result", summary, sequential_time)

    os.makedirs("results", exist_ok=True)
    with open("results/sequential_summary.json", "w", encoding="utf-8") as file:
        json.dump(make_json_serializable(summary), file, indent=4)