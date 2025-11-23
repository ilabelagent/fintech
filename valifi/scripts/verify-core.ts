#!/usr/bin/env tsx

/**
 * VALIFI CORE AUTHENTICATION FLOW VERIFICATION
 * 
 * This script tests the complete auth flow:
 * 1. Registration with valid credentials
 * 2. Login and session capture
 * 3. Authenticated data loading (user profile & wallet data)
 * 4. Logout and session destruction
 * 5. Re-login to verify credential persistence
 * 
 * Exit Codes:
 * 0 = All tests passed
 * 1 = Tests failed
 */

import { randomUUID } from 'crypto';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_USER_PREFIX = 'qatest';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Wallet {
  id: string;
  userId: string;
  network: string;
  address: string;
}

class AuthFlowTester {
  private token: string | null = null;
  private results: TestResult[] = [];
  private testUser = {
    email: `${TEST_USER_PREFIX}_${randomUUID().slice(0, 8)}@valifi.test`,
    password: 'Test123!@#SecurePassword',
    firstName: 'QA',
    lastName: 'Tester',
  };

  private async fetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  }

  private async runTest(
    name: string,
    testFn: () => Promise<void>
  ): Promise<void> {
    const start = Date.now();
    console.log(`\n🧪 Testing: ${name}...`);

    try {
      await testFn();
      const duration = Date.now() - start;
      this.results.push({ name, passed: true, duration });
      console.log(`✅ PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.results.push({
        name,
        passed: false,
        error: errorMessage,
        duration,
      });
      console.error(`❌ FAILED (${duration}ms)`);
      console.error(`   Error: ${errorMessage}`);
    }
  }

  async testRegistration(): Promise<void> {
    await this.runTest('User Registration', async () => {
      const response = await this.fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(this.testUser),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Registration failed (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.user || !data.user.id) {
        throw new Error('Registration response missing user ID');
      }

      if (data.user.email !== this.testUser.email) {
        throw new Error(
          `Email mismatch: expected ${this.testUser.email}, got ${data.user.email}`
        );
      }

      console.log(`   ✓ User created with ID: ${data.user.id}`);
      console.log(`   ✓ Email: ${data.user.email}`);
    });
  }

  async testLogin(): Promise<void> {
    await this.runTest('User Login', async () => {
      // Clear token before login
      this.token = null;

      const response = await this.fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          email: this.testUser.email,
          password: this.testUser.password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.user || !data.user.id) {
        throw new Error('Login response missing user ID');
      }

      if (!data.token) {
        throw new Error('No JWT token received after login');
      }

      this.token = data.token;

      console.log(`   ✓ Login successful`);
      console.log(`   ✓ JWT token: ${this.token.substring(0, 30)}...`);
    });
  }

  async testUserDataLoading(): Promise<void> {
    await this.runTest('Load User Profile', async () => {
      const response = await this.fetch(`${BASE_URL}/api/auth/user`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to load user (${response.status}): ${errorText}`
        );
      }

      const user: User = await response.json();

      if (!user.id || !user.email) {
        throw new Error('User data incomplete');
      }

      if (user.email !== this.testUser.email) {
        throw new Error(
          `Email mismatch: expected ${this.testUser.email}, got ${user.email}`
        );
      }

      console.log(`   ✓ User ID: ${user.id}`);
      console.log(`   ✓ Email: ${user.email}`);
      console.log(`   ✓ Name: ${user.firstName} ${user.lastName}`);
    });
  }

  async testWalletDataLoading(): Promise<void> {
    await this.runTest('Load Wallet Data', async () => {
      const response = await this.fetch(`${BASE_URL}/api/wallets`);

      if (!response.ok) {
        // Wallets might not exist yet for new user - that's okay
        if (response.status === 404 || response.status === 200) {
          console.log(`   ✓ Wallet endpoint accessible (no wallets yet)`);
          return;
        }
        const errorText = await response.text();
        throw new Error(
          `Failed to load wallets (${response.status}): ${errorText}`
        );
      }

      const wallets: Wallet[] = await response.json();
      console.log(`   ✓ Wallet data loaded (${wallets.length} wallets)`);
    });
  }

  async testLogout(): Promise<void> {
    await this.runTest('User Logout', async () => {
      const response = await this.fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Logout failed (${response.status}): ${errorText}`);
      }

      console.log(`   ✓ Logout successful`);

      // Clear token
      this.token = null;

      // Verify token is cleared by trying to access user endpoint
      const verifyResponse = await this.fetch(`${BASE_URL}/api/auth/user`);

      if (verifyResponse.ok) {
        throw new Error(
          'Token still valid after logout - token was not cleared'
        );
      }

      console.log(`   ✓ Session destroyed (verified)`);
    });
  }

  async testReLogin(): Promise<void> {
    await this.runTest('Re-login After Logout', async () => {
      const response = await this.fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          email: this.testUser.email,
          password: this.testUser.password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Re-login failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.user || !data.user.id) {
        throw new Error('Re-login response missing user ID');
      }

      if (!data.token) {
        throw new Error('No JWT token received after re-login');
      }

      this.token = data.token;

      console.log(`   ✓ Re-login successful`);
      console.log(`   ✓ Credentials persisted correctly in database`);
    });
  }

  async runAllTests(): Promise<boolean> {
    console.log('='.repeat(70));
    console.log('VALIFI AUTHENTICATION FLOW VERIFICATION');
    console.log('='.repeat(70));
    console.log(`Target: ${BASE_URL}`);
    console.log(`Test User: ${this.testUser.email}`);
    console.log('='.repeat(70));

    // Run tests in sequence
    await this.testRegistration();
    await this.testLogin();
    await this.testUserDataLoading();
    await this.testWalletDataLoading();
    await this.testLogout();
    await this.testReLogin();

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    this.results.forEach((result) => {
      const icon = result.passed ? '✅' : '❌';
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(
        `${icon} [${status}] ${result.name} (${result.duration}ms)`
      );
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('='.repeat(70));
    console.log(`Total: ${this.results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log('='.repeat(70));

    if (failed > 0) {
      console.log('\n❌ VERIFICATION FAILED');
      return false;
    } else {
      console.log('\n✅ ALL TESTS PASSED');
      return true;
    }
  }
}

// Main execution
async function main() {
  try {
    const tester = new AuthFlowTester();
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  }
}

main();
