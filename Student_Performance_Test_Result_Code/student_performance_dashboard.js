import http from "k6/http";
import { check, sleep } from "k6";

const TEST_TYPE = __ENV.TEST_TYPE || "smoke";

export const options =
  TEST_TYPE === "smoke"
    ? {
        vus: 3,
        duration: "1m",
        thresholds: {
          http_req_failed: ["rate<0.01"],
          http_req_duration: ["p(95)<200", "p(99)<400"],
        },
      }
    : TEST_TYPE === "load"
    ? {
        stages: [
          { duration: "1m", target: 1000 },
          { duration: "2m", target: 2000 },
          { duration: "2m", target: 4000 },
          { duration: "1m", target: 0 },
        ],
        thresholds: {
          http_req_failed: ["rate<0.01"],
          http_req_duration: ["p(95)<200", "p(99)<400"],
        },
      }
    : TEST_TYPE === "stress"
    ? {
        stages: [
          { duration: "1m", target: 1000 },
          { duration: "1m", target: 2000 },
          { duration: "1m", target: 4000 },
          { duration: "1m", target: 5000 },
          { duration: "1m", target: 0 },
        ],
        thresholds: {
          http_req_failed: ["rate<0.01"],
          http_req_duration: ["p(95)<200", "p(99)<400"],
        },
      }
    : TEST_TYPE === "spike"
    ? {
        stages: [
          { duration: "10s", target: 10 },
          { duration: "5s", target: 4000 },
          { duration: "20s", target: 4000 },
          { duration: "20s", target: 0 },
        ],
        thresholds: {
          http_req_failed: ["rate<0.01"],
          http_req_duration: ["p(95)<200", "p(99)<400"],
        },
      }
    : // -----------------------------------------
    // 🛑 NEW — SOAK TEST (Long Duration Steady Load)
    // -----------------------------------------
    TEST_TYPE === "soak"
    ? {
        stages: [
          { duration: "2m", target: 500 }, // Ramp up
          { duration: "2h", target: 500 }, // Soak for hours
          { duration: "2m", target: 0 }, // Ramp down
        ],
        thresholds: {
          http_req_failed: ["rate<0.01"], // System must stay stable
          http_req_duration: ["p(95)<300"], // Allow slightly higher latency
        },
      }
    : // -----------------------------------------
    // 🧨 NEW — BREAKPOINT TEST (Find Breaking Point)
    // -----------------------------------------
    TEST_TYPE === "breakpoint"
    ? {
        stages: [
          { duration: "30s", target: 200 },
          { duration: "30s", target: 400 },
          { duration: "30s", target: 600 },
          { duration: "30s", target: 800 },
          { duration: "30s", target: 1000 },
          { duration: "30s", target: 1500 },
          { duration: "30s", target: 2000 },
          { duration: "30s", target: 0 },
        ],
        thresholds: {
          http_req_failed: ["rate<0.05"], // failure acceptable until break
        },
      }
    : {};

// ------------------------
// 🔐 USER CREDENTIALS
// ------------------------
const email = "cisintern2024@gmail.com";
const password = "Cis1100#@!";

const loginUrl = "https://diu.aiteacher.daffodilglobal.ai/api/login";
const dashboardUrl = "https://diu.aiteacher.daffodilglobal.ai/myhome/student";

// ------------------------
// 🚀 USER FLOW (Login → Dashboard)
// ------------------------
export default function () {
  // LOGIN
  const loginPayload = JSON.stringify({
    email: email,
    password: password,
  });

  const loginParams = {
    headers: { "Content-Type": "application/json" },
  };

  const loginRes = http.post(loginUrl, loginPayload, loginParams);

  check(loginRes, {
    "Login status is 200": (r) => r.status === 200,
    "Access Token received": (r) => r.json("data.access_token") !== undefined,
  });

  const token = loginRes.json("data.access_token");

  // DASHBOARD
  const dashboardRes = http.get(dashboardUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  check(dashboardRes, {
    "Dashboard loaded successfully": (r) => r.status === 200,
  });

  sleep(1);
}
