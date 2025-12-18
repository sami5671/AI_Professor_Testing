Performance Testing Report: Student & Teacher Performance Dashboards

📌 Executive Summary

This repository hosts the comprehensive performance engineering reports for the Student and Teacher Performance Dashboards. Using K6, a modern load testing tool, we executed a rigorous suite of 12 distinct tests (6 per dashboard) to evaluate system behavior under varying traffic conditions.

Overall Verdict: The system is Production Ready for loads up to 1,000 Concurrent Users (VUs). However, critical infrastructure bottlenecks emerge significantly beyond 1,200 VUs, rendering the platform unstable at higher volumes.

🛠️ Test Strategy & Methodology

The performance validation strategy employed a multi-vector approach, targeting different stability characteristics:

Test Scenario

Objective

Configuration

Smoke Test

Verify system health and basic functionality.

3 VUs (Constant)

Load Test

Assess performance at expected usage tiers.

Step load: 1k $\to$ 2k $\to$ 4k VUs

Stress Test

Determine system saturation point.

Ramp to 5,000 VUs

Spike Test

Validate resilience to sudden traffic surges.

0 $\to$ 4,000 VUs (Instant)

Soak Test

Detect memory leaks and degradation over time.

500 VUs (Sustained duration)

Breakpoint Test

Identify the exact point of failure.

Ramp until failure

📊 Detailed Findings

1. Student Dashboard Performance

The Student Dashboard is lighter and more performant but shares the same infrastructure limits as the Teacher Dashboard.

Capacity Limit: 1,000 VUs (Stable).

Breaking Point: ~1,200 VUs.

Peak Throughput: ~520 RPS.

Latency (p95): 2.6s (at 1k VUs) $\to$ 36s (at 4k VUs).

Critical Observation: During the Soak Test, the infrastructure remained stable (0.1% errors), but 33.4% of functional checks failed, indicating data consistency issues ("Soft 200s").

2. Teacher Dashboard Performance

The Teacher Dashboard exhibits higher resource consumption per request, likely due to complex aggregation queries (class averages, student lists).

Capacity Limit: 1,000 VUs (Stable).

Breaking Point: ~1,200 VUs.

Peak Throughput: ~413 RPS (Lower than Student Dashboard).

Latency (p95): 2.0s (at 1k VUs) $\to$ 27s+ (at 4k VUs).

Critical Observation: Even at the "Safe Zone" of 1,000 VUs, the error rate was 5.2%, significantly higher than the Student Dashboard, confirming database contention.

🔍 Root Cause Analysis (RCA)

Our analysis identified three primary bottlenecks compromising scalability:

🔴 1. Connection Starvation (Infrastructure)

Symptom: http_req_connecting and http_req_blocked times spiked to >15 seconds during Stress and Spike tests.

Cause: The Load Balancer or Web Server (Nginx/Apache) has a worker_connections limit that is too low. The server physically could not accept new TCP handshakes once the queue filled up at ~1,200 VUs.

🔴 2. Database Contention (Application)

Symptom: Throughput flatlined at ~520 RPS (Student) and ~413 RPS (Teacher) regardless of increased user load.

Cause: The application is CPU-bound or I/O-bound at the database layer. The lower throughput on the Teacher Dashboard suggests that aggregation queries are locking tables or consuming excessive CPU cycles.

⚠️ 3. Data Integrity ("Soft Failures")

Symptom: High functional check failure rates (~33%) despite HTTP 200 OK statuses during Soak tests.

Cause: API endpoints are likely returning empty JSON arrays or partial data when read-replicas lag or when test data is missing for specific user IDs.

🚀 Strategic Recommendations & Roadmap

To bridge the gap between the current 1,000 User Capacity and the 4,000 User Target, we recommend the following phased roadmap:

Phase 1: Optimization (Immediate)

Infrastructure: Increase file descriptor limits (ulimit -n) and worker_connections on the web server to resolve connection starvation.

Database: Audit "Teacher" queries. Add indexes to class_id and student_id columns to reduce scan times.

Test Data: Verify database seeding to ensure all 500+ test users have valid records, resolving the "Soft Failure" false positives.

Phase 2: Scalability (Short Term)

Horizontal Scaling: Deploy 2 additional application nodes behind the load balancer to distribute the request processing load.

Caching: Implement Redis for "Class Average" and "Dashboard" endpoints to reduce database hits by 80%.

Phase 3: Resilience (Long Term)

Rate Limiting: Implement aggressive rate limiting / queueing at the Load Balancer level. It is better to serve a "System Busy" page to users >1,200 than to crash the system for everyone.

Async Processing: Move heavy report generation to background jobs (workers) rather than processing them synchronously in the HTTP request.

Report Prepared By: MD SAMI ALAM
Date: November 30, 2025
