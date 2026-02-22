#!/usr/bin/env tsx
/**
 * Rate Limiting Test Script
 *
 * Tests rate limiting on various endpoints to ensure they're properly configured.
 * Run with: pnpm tsx scripts/test-rate-limiting.ts
 */
// Copilot generated script

const BASE_URL = "https://staging.hackfest.dev";

interface TestResult {
  endpoint: string;
  method: string;
  statusCodes: number[];
  rateLimitHit: boolean;
  requestsBeforeLimit: number;
  retryAfter?: string;
}

async function testEndpoint(
  endpoint: string,
  method: string = "GET",
  headers: Record<string, string> = {},
  body?: Record<string, unknown>,
  maxRequests: number = 70,
): Promise<TestResult> {
  const statusCodes: number[] = [];
  let rateLimitHit = false;
  let retryAfter: string | undefined;

  console.log(`\n🧪 Testing ${method} ${endpoint}...`);

  for (let i = 0; i < maxRequests; i++) {
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (body && (method === "POST" || method === "PATCH")) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      statusCodes.push(response.status);

      if (response.status === 429) {
        rateLimitHit = true;
        retryAfter = response.headers.get("Retry-After") || undefined;
        console.log(`   ⛔ Rate limit hit after ${i + 1} requests`);
        console.log(`   ⏱️  Retry-After: ${retryAfter}s`);
        break;
      }

      // Show progress every 10 requests
      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ ${i + 1} requests completed`);
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`   ❌ Error on request ${i + 1}:`, error);
      break;
    }
  }

  const requestsBeforeLimit = rateLimitHit
    ? statusCodes.filter((code) => code !== 429).length
    : statusCodes.length;

  return {
    endpoint,
    method,
    statusCodes,
    rateLimitHit,
    requestsBeforeLimit,
    retryAfter,
  };
}

async function testPublicRoutes() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("📋 TESTING PUBLIC ROUTES (IP-based rate limiting)");
  console.log("=".repeat(60));

  const results: TestResult[] = [];

  // Test public endpoint - should be 60 req/min for API limiter
  results.push(await testEndpoint("/api/events/getAll", "GET"));

  // Test tracks endpoint - should be 60 req/min for API limiter
  results.push(await testEndpoint("/api/tracks", "GET"));

  return results;
}

async function testAuthRoutes() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("🔐 TESTING AUTH ROUTES (20 req/min)");
  console.log("=".repeat(60));

  const results: TestResult[] = [];

  // Test registration endpoint - should have auth limiter (20 req/min)
  results.push(
    await testEndpoint(
      "/api/users/register",
      "POST",
      {},
      {
        email: "test@example.com",
        password: "password123",
      },
      25,
    ),
  );

  return results;
}

async function testPaymentRoutes() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("💳 TESTING PAYMENT ROUTES (5 req/min)");
  console.log("=".repeat(60));

  const results: TestResult[] = [];

  // Test payment creation - should have payment limiter (5 req/min)
  results.push(
    await testEndpoint(
      "/api/razorpay/create-order",
      "POST",
      {},
      {
        amount: 100,
        currency: "INR",
      },
      10,
    ),
  );

  return results;
}

async function testEmailRoutes() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("📧 TESTING EMAIL ROUTES (10 req/min)");
  console.log("=".repeat(60));

  const results: TestResult[] = [];

  // Test college creation - should have email limiter (10 req/min)
  results.push(
    await testEndpoint(
      "/api/colleges/other",
      "POST",
      {},
      {
        collegeName: "Test College",
      },
      15,
    ),
  );

  return results;
}

function printSummary(allResults: TestResult[]) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 RATE LIMITING TEST SUMMARY");
  console.log("=".repeat(60));

  console.log("\n┌─────────────────────────────────────────────────────────┐");
  console.log("│ Endpoint                    │ Limit Hit │ Requests      │");
  console.log("├─────────────────────────────────────────────────────────┤");

  allResults.forEach((result) => {
    const endpoint = `${result.method} ${result.endpoint}`.padEnd(27);
    const limitHit = result.rateLimitHit ? "✅ YES" : "❌ NO ";
    const requests = `${result.requestsBeforeLimit}`.padStart(4);
    console.log(`│ ${endpoint} │ ${limitHit}     │ ${requests}          │`);
  });

  console.log("└─────────────────────────────────────────────────────────┘");

  const allPassed = allResults.every((r) => r.rateLimitHit);

  console.log(`\n${"=".repeat(60)}`);
  if (allPassed) {
    console.log("✅ ALL TESTS PASSED - Rate limiting is working!");
  } else {
    console.log("⚠️  SOME TESTS FAILED - Check rate limiting configuration");
    console.log("\nFailed endpoints:");
    allResults
      .filter((r) => !r.rateLimitHit)
      .forEach((r) => {
        console.log(`   - ${r.method} ${r.endpoint}`);
      });
  }
  console.log(`${"=".repeat(60)}\n`);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🔒  RATE LIMITING TEST SUITE  🔒                   ║
║                                                           ║
║  Testing rate limits on localhost:3000                   ║
║  Make sure your dev server and Redis are running!        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const allResults: TestResult[] = [];

  try {
    // Check if server is running
    const healthCheck = await fetch(BASE_URL).catch(() => null);
    if (!healthCheck) {
      console.error("❌ Server is not running on localhost:3000");
      console.error("   Please start your dev server first: pnpm dev");
      process.exit(1);
    }

    console.log("✅ Server is running");

    // Run all tests
    allResults.push(...(await testPublicRoutes()));
    allResults.push(...(await testAuthRoutes()));
    allResults.push(...(await testPaymentRoutes()));
    allResults.push(...(await testEmailRoutes()));

    // Print summary
    printSummary(allResults);
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run the tests
main();
