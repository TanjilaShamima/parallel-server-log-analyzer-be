# Easy Live Demo Script

Use this file when you show the project to your teacher.

## 1. Start The Backend

Open terminal:

```bash
cd /Users/isl/Desktop/Practice/Growth/parallel-server-analyzer/server-analyzer-be
npm run dev
```

Say:

```text
Sir, this is my backend. It is running with Node.js, Express.js, and Worker Threads.
```

Backend URL:

```text
http://localhost:4000
```

## 2. Start The Frontend

Open another terminal:

```bash
cd /Users/isl/Desktop/Practice/Growth/parallel-server-analyzer/server-analyzer-fe
npm run dev
```

Open the frontend URL shown in terminal.

Usually:

```text
http://localhost:3000
```

If port 3000 is busy, Next.js may show:

```text
http://localhost:3001
```

Say:

```text
Sir, this is my Next.js frontend. The UI is connected with the backend APIs.
```

## 3. Login

Go to:

```text
/login
```

Use:

```text
Email: admin@example.com
Password: admin123
```

Say:

```text
Sir, this is a simple mock login. No JWT or database is used because the project focus is the parallel algorithm.
```

## 4. Open Logs Page

Click:

```text
Logs
```

Say:

```text
Sir, this is the main live demo page. I will first generate a log file, then run sequential analysis, then run parallel analysis.
```

## 5. Generate Logs

Select log size:

```text
100,000 lines
```

Click:

```text
Generate
```

Say:

```text
Sir, now the backend is generating fake server logs. Each line contains timestamp, IP, HTTP method, endpoint, status code, and message.
```

Example log line:

```text
2026-08-24 10:15:20 192.168.1.5 POST /api/login 401 FAILED_LOGIN
```

Important:

```text
The animation is for visual explanation, but the file generation happens in the backend.
```

## 6. Run Sequential Analysis

Click:

```text
Sequential
```

Say:

```text
Sir, now the backend reads the log file line by line using one process. This is the baseline sequential approach.
```

Show these results:

```text
Total requests
Failed login count
Server error count
404 count
Sequential time
Top IPs
Top endpoints
Suspicious IPs
```

Say:

```text
This time is important because speedup is calculated by comparing parallel time with this sequential time.
```

## 7. Run Parallel Analysis

Select worker count:

```text
4 workers
```

Click:

```text
Parallel
```

Say:

```text
Sir, now the same log file is split into chunks. Each chunk is processed by a separate Node.js worker thread.
```

Then say:

```text
The chunk boundary is adjusted by newline, so one log line is not broken between two workers.
```

Show:

```text
Parallel Time
Merge Time
Worker count
Final Report
```

## 8. Explain Merge Time

Say:

```text
Sir, worker threads finishing their chunks does not mean the full task is finished. Their local summaries still need to be merged.
```

Then say:

```text
To reduce merge overhead, I do not merge raw log lines. Each worker returns only a small summary: status count, IP count, endpoint count, failed login count, server error count, and 404 count.
```

Then say:

```text
The final result merges only these summaries. That is why merge time is measured separately in the UI.
```

## 9. Explain Hierarchical Merge

Say:

```text
Sir, I use hierarchical merge.
```

Example:

```text
R1 + R2 = M1
R3 + R4 = M2
M1 + M2 = Final Result
```

Say:

```text
This is better than merging everything randomly because it clearly shows how local worker results become one final summary.
```

## 10. Explain Final Report

After parallel analysis completes, show the Final Report section.

Say:

```text
Sir, this final report is generated from real backend timing results.
```

Explain:

```text
Sequential Time = time taken by one process
Parallel Time = total time taken by worker threads
Processing Time = time workers spent analyzing chunks
Merge Time = time spent combining local summaries
Speedup = Sequential Time / Parallel Time
Efficiency = Speedup / Number of Workers
Merge Overhead % = Merge Time / Total Parallel Time x 100
```

## 11. Open Benchmark Page

Click:

```text
Benchmark
```

Click:

```text
Run Benchmark
```

Say:

```text
Sir, benchmark runs sequential once and then runs parallel analysis using 1, 2, 4, and 8 workers.
```

Show charts:

```text
Sequential vs Parallel Time
Speedup vs Workers
Processing Time vs Merge Time
```

Say:

```text
This helps compare how worker count affects speedup and merge overhead.
```

## 12. Explain Disk I/O Bottleneck

Say:

```text
Sir, if all workers read or write from the same drive at the same time, disk I/O can become a bottleneck.
```

Then say:

```text
In this prototype, I avoid large intermediate file writes. Workers read chunks and return compact summaries only.
```

Then say:

```text
Future versions can use separate SSDs, distributed storage, or streaming pipelines.
```

## 13. Final Short Explanation

Use this as your final summary:

```text
Sir, my project demonstrates the difference between sequential and parallel log analysis. Sequential analysis reads the full file using one process. Parallel analysis splits the file into newline-safe chunks and uses worker threads. Each worker returns only a compact summary, not raw logs. Then hierarchical merge combines the summaries. The UI shows processing time, merge time, total parallel time, speedup, efficiency, and merge overhead. So this is not static; the numbers come from real backend API execution.
```

## 14. If Sir Says It Looks Static

Say:

```text
Sir, I can regenerate the log file with a different size and run the analysis again. The time values will change because the backend executes the algorithm again.
```

Then do:

```text
1. Change log size
2. Click Generate
3. Click Sequential
4. Click Parallel
5. Show changed timing report
```

## 15. Best Demo Order

Use this order:

```text
1. Backend terminal
2. Frontend terminal
3. Login
4. Logs page
5. Generate 100,000 logs
6. Run Sequential
7. Run Parallel with 4 workers
8. Explain Final Report
9. Benchmark page
10. Docs page
```
