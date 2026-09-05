# Project Demo Guide

Project name:

```text
Parallel Server Log Analyzer
```

Course:

```text
CSE706 Advanced Parallel Algorithm
```

## 1. One-Line Project Introduction

Sir-ke first-e bolben:

```text
Sir, my project is Parallel Server Log Analyzer. It compares sequential log analysis with parallel log analysis using Node.js Worker Threads. The main goal is to show how a large log file can be divided into chunks, processed by multiple workers, merged, and compared using speedup, efficiency, and merge overhead.
```

## 2. Why This Project Matches Parallel Algorithm

Bolben:

```text
Sir, server log analysis is a data-parallel problem. A large log file has many independent lines. Each line can be parsed and counted independently. So the file can be divided into multiple chunks and each chunk can be processed by a different worker thread.
```

Easy explanation:

```text
One big task = analyze full log file
Divide task = split file into chunks
Parallel work = workers analyze chunks at same time
Combine result = merge local summaries
Final result = one complete log summary
```

## 3. What The Log File Contains

Example log line:

```text
2026-08-24 10:15:20 192.168.1.5 POST /api/login 401 FAILED_LOGIN
```

Explain each part:

```text
2026-08-24 10:15:20 -> timestamp
192.168.1.5 -> IP address
POST -> HTTP method
/api/login -> endpoint
401 -> status code
FAILED_LOGIN -> message
```

## 4. What The Analyzer Calculates

Bolben:

```text
The analyzer calculates total requests, status code count, IP count, endpoint count, failed login count, server error count, 404 count, and suspicious IPs.
```

Suspicious IP rule:

```text
An IP is suspicious if failed login count > 10 or request count > 1000.
```

## 5. Sequential Algorithm Explanation

Sequential means one process does all work.

Bolben:

```text
Sir, in sequential analysis, one process reads the whole log file line by line. For each line, it parses the values and updates one summary object.
```

Sequential flow:

```text
Start
Read line 1
Parse line
Update summary
Read line 2
Parse line
Update summary
...
Read last line
Return final summary
Stop timer
```

Pseudo-code:

```text
summary = empty summary
start timer

for each line in log file:
    parsed = parse line
    summary.totalRequests++
    summary.statusCount[status]++
    summary.ipCount[ip]++
    summary.endpointCount[endpoint]++
    count failed login / 500 / 404

stop timer
return summary and sequential time
```

Important line:

```text
This sequential time is my baseline. I compare parallel time against this baseline.
```

## 6. Parallel Algorithm Explanation

Parallel means multiple worker threads share the work.

Bolben:

```text
Sir, in parallel analysis, the backend first checks the log file size and divides the file into chunks based on selected worker count.
```

Example:

```text
If I select 4 worker threads:

Worker 1 -> chunk 1
Worker 2 -> chunk 2
Worker 3 -> chunk 3
Worker 4 -> chunk 4
```

Important:

```text
The backend adjusts chunk boundaries using newline. So one log line is not broken between two workers.
```

Parallel flow:

```text
Start timer
Divide file into chunks
Send chunks to worker threads
Each worker parses its own chunk
Each worker returns local summary
Merge local summaries
Return final summary
Stop timer
```

## 7. What Each Worker Does

Bolben:

```text
Each worker receives only one chunk. It reads that chunk, parses log lines, and creates a local summary.
```

Each worker returns:

```text
total requests in chunk
status code count
IP count
endpoint count
failed login count
server error count
404 count
worker processing time
chunk size
processed line count
```

Very important:

```text
Workers do not return raw log lines. They return only compact summaries.
```

## 8. Why Raw Logs Are Not Merged

Sir may ask why not merge raw data.

Answer:

```text
Sir, if each worker returns raw processed log lines, the merge step becomes heavy and memory-consuming. To reduce merge overhead, each worker returns only a compact summary. The final result merges summary objects only.
```

## 9. Merge Logic

Bolben:

```text
After workers finish, local summaries are merged hierarchically.
```

Example:

```text
R1 + R2 = M1
R3 + R4 = M2
M1 + M2 = Final Result
```

Explain:

```text
R1, R2, R3, R4 are worker summaries.
M1 and M2 are intermediate merged summaries.
Final Result is the complete log summary.
```

## 10. Time Measurements Shown In UI

In Parallel Report, UI shows:

```text
Divide logs time
Worker processing time
Each worker thread time
Merge time
Final output time
```

Explain:

```text
Divide logs time means how long it took to split the file into chunks.
Worker processing time means how long workers took to process chunks in parallel.
Each worker time shows individual worker performance.
Merge time means how long it took to combine local summaries.
Final output time means total parallel runtime.
```

## 11. Calculation Formulas

Speedup:

```text
Speedup = Sequential Time / Parallel Time
```

Efficiency:

```text
Efficiency = Speedup / Number of Workers
```

Merge overhead:

```text
Merge Overhead % = Merge Time / Total Parallel Time x 100
```

Improvement:

```text
Time Saved = Sequential Time - Parallel Time
Improvement % = Time Saved / Sequential Time x 100
```

## 12. How To Demo Step By Step

### Step 1: Start Backend

Terminal:

```bash
cd /Users/isl/Desktop/Practice/Growth/parallel-server-analyzer/server-analyzer-be
npm run dev
```

Say:

```text
Sir, this is my backend server. It provides APIs for generating logs, sequential analysis, parallel analysis, benchmark, and result fetching.
```

### Step 2: Start Frontend

Terminal:

```bash
cd /Users/isl/Desktop/Practice/Growth/parallel-server-analyzer/server-analyzer-fe
npm run dev
```

Open:

```text
http://localhost:3000
```

Say:

```text
Sir, this is my Next.js frontend dashboard.
```

### Step 3: Login

Use:

```text
Email: admin@example.com
Password: admin123
```

Say:

```text
This is a simple mock login. I did not add complex authentication because the main focus is the parallel algorithm.
```

### Step 4: Go To Logs Page

Click:

```text
Logs
```

Say:

```text
This is the main demo page where I generate logs and run sequential and parallel reports.
```

### Step 5: Generate Logs

Select:

```text
100,000 lines
```

Click:

```text
Generate Logs
```

Say:

```text
Now the backend generates a real server.log file. The generated log list is shown below with pagination.
```

### Step 6: Run Sequential Report

Click:

```text
Run Sequential Report
```

Say:

```text
Now one process reads the whole file line by line. This gives us the baseline sequential time.
```

Show:

```text
Sequential Report
Sequential Time
Total Requests
```

### Step 7: Run Parallel Report

Select:

```text
4 worker threads
```

Click:

```text
Run Parallel Report
```

Say:

```text
Now the same file is divided into 4 chunks. Each chunk is given to one worker thread. The workers process chunks in parallel.
```

Show:

```text
Divide logs time
Worker processing time
Each worker thread time
Merge time
Final output time
```

### Step 8: Explain Worker Table

Say:

```text
This table shows each worker. For every worker, I show chunk size, processed log line count, and worker time. This proves that the workers are processing separate chunks.
```

### Step 9: Explain Final Comparison

Say:

```text
Now I compare the sequential report and parallel report. The UI calculates time saved, speedup, efficiency, and improvement percentage.
```

### Step 10: Compare Multiple Reports

Run parallel again with:

```text
2 workers
8 workers
```

Then use:

```text
Report History And Compare
```

Say:

```text
Every run is saved as a report. I can select any two reports and compare which one is faster.
```

## 13. If Sir Says It Is Static

Say:

```text
Sir, I can change log amount or worker thread count and run the analysis again. The backend will execute again and the timing values will change.
```

Then do:

```text
1. Change log amount
2. Click Generate Logs
3. Click Run Sequential Report
4. Change worker count
5. Click Run Parallel Report
6. Show new saved report
7. Compare with previous report
```

## 14. Very Short Final Summary

Say:

```text
Sir, this project demonstrates a data-parallel algorithm. Sequential analysis processes the full log file with one process. Parallel analysis splits the file into newline-safe chunks and processes them with Node.js worker threads. Each worker returns a compact summary. Then summaries are merged hierarchically. The UI shows divide time, worker time, merge time, final output time, speedup, efficiency, and improvement.
```

## 15. Common Questions And Answers

Question:

```text
Why can this be parallelized?
```

Answer:

```text
Because log lines are independent. Different workers can process different parts of the file at the same time.
```

Question:

```text
Why adjust chunk boundary?
```

Answer:

```text
To make sure a log line is not cut in the middle between two workers.
```

Question:

```text
Why merge summaries only?
```

Answer:

```text
Because merging raw logs would be expensive. Summary merging is faster and uses less memory.
```

Question:

```text
Why parallel may not always be perfectly faster?
```

Answer:

```text
Worker creation, disk I/O, and merge time add overhead. That is why the UI measures these times separately.
```
