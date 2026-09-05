# Parallel Algorithm

1. Read the log file size.
2. Divide the file into chunks based on worker count.
3. Adjust each chunk boundary until a newline is found so log lines are not broken.
4. Send each chunk to a worker thread.
5. Each worker parses only its chunk and returns a compact summary.
6. Merge summaries using hierarchical merge:

```text
R1 + R2 = M1
R3 + R4 = M2
M1 + M2 = Final
```

Raw log lines are not merged. Only summary objects are merged.
