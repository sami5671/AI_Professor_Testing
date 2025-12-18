Performance Testing Report: Student & Teacher Dashboards

📌 Overview

This repository contains comprehensive performance analysis reports for the Student and Teacher Performance Dashboards. Using K6, we executed a full suite of performance tests to validate system stability, scalability, and error resilience under various traffic conditions.

🛠️ Test Suite

The following scenarios were executed for both dashboards:

Smoke Test: Baseline health check (3 VUs).

Load Test: Scalability verification (1k, 2k, 4k VUs).

Stress Test: System saturation point analysis (Peak 5k VUs).

Spike Test: resilience to sudden traffic surges (0 to 4k VUs).

Soak Test: Long-duration endurance testing (500 VUs).

Breakpoint Test: Identification of hard failure limits.

📊 Key Findings

Operational Capacity: The system is stable and production-ready for 1,000 Concurrent Users, maintaining acceptable latency (<3s).

Breaking Point: Infrastructure bottlenecks (connection starvation) emerge at approximately 1,200 VUs.

Critical Failure: Loads exceeding 2,000 VUs result in severe degradation, with response times hitting 60s and high error rates.

Data Validation: A consistent ~33% functional check failure was observed during endurance tests, indicating potential test data gaps or "soft" API failures.

🚀 Recommendations

To support the target of 4,000+ users, the following optimizations are required:

Horizontal Scaling: Increase application nodes to handle connection throughput.

Database Tuning: Implement read-replicas and optimize aggregation queries.

Rate Limiting: Implement strict queuing to prevent cascading failures during spikes.
