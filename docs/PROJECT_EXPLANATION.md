# Project Explanation

This project analyzes a large server log file using sequential processing and parallel processing with Node.js worker threads.

Server log analysis is useful because logs show request volume, errors, failed login attempts, popular endpoints, and suspicious IP behavior.

The frontend provides a clean academic dashboard. The backend keeps the implementation simple and focuses on the algorithm demonstration.

Parallel workers finishing their chunks does not mean the whole task is finished. Their local results still need to be merged. To reduce merge overhead, this project does not merge raw processed log lines. Each worker returns only a compact local summary such as status count, IP count, endpoint count, failed login count, and error count. The final result merges only these summaries. Merge time is measured separately and shown in the UI.

If all workers read/write from the same drive at the same time, disk I/O can become a bottleneck. In this prototype, we avoid large intermediate file writes. Future versions can use separate SSDs, distributed storage, or streaming pipelines.
