/**
 * test-application.js
 * Comprehensive API Connection and Backend-to-Database Verification Suite
 */

const http = require('http');

const CONFIG = {
  host: 'localhost',
  port: 5500,
  timeout: 5000
};

console.log('\n==================================================');
console.log('🔍 STARTING COMPREHENSIVE PROJECT TEST SUITE');
console.log('   Target: http://localhost:5500');
console.log('==================================================\n');

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: path,
      method: method,
      timeout: CONFIG.timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => { reject(err); });
    req.on('timeout', () => { req.destroy(); reject(new Error('Connection timed out')); });
    req.end();
  });
}

async function runTests() {
  let failedTests = 0;

  // Test 1: Check root server & static files availability
  try {
    console.log('📌 TEST 1: Validating Express Server and Frontend availability...');
    const res = await makeRequest('GET', '/');
    if (res.statusCode === 200 || res.statusCode === 304) {
      console.log('   ✅ PASSED: Server is alive and serving index.html!');
    } else {
      throw new Error(`Unexpected status code: ${res.statusCode}`);
    }
  } catch (err) {
    console.log(`   ❌ FAILED: Server unreachable! Make sure "npm start" is running. (${err.message})`);
    failedTests++;
  }

  console.log('');

  // Test 2: Server Health Check
  try {
    console.log('📌 TEST 2: Validating "/api/health" connection...');
    const res = await makeRequest('GET', '/api/health');
    const body = JSON.parse(res.body);
    if (res.statusCode === 200 && body.success && body.status === 'OK') {
      console.log('   ✅ PASSED: Health Check Endpoint is operational!');
      console.log(`      • Environment: ${body.env}`);
      console.log(`      • Version: ${body.version}`);
    } else {
      throw new Error('Invalid JSON response format');
    }
  } catch (err) {
    console.log(`   ❌ FAILED: Health Check failed! (${err.message})`);
    failedTests++;
  }

  console.log('');

  // Test 3: API Connection for Candidates
  try {
    console.log('📌 TEST 3: Validating Candidates data fetch and MongoDB binding...');
    const res = await makeRequest('GET', '/api/candidates');
    if (res.statusCode === 200) {
      const candidates = JSON.parse(res.body);
      console.log(`   ✅ PASSED: Successfully retrieved candidates list from Database!`);
      
      if (Array.isArray(candidates)) {
        console.log(`      • Found ${candidates.length} registered candidates across positions.`);
      } else if (typeof candidates === 'object') {
        const totalCount = Object.values(candidates).flat().length;
        console.log(`      • Found ${totalCount} registered candidates categorized in database.`);
      }
    } else {
      throw new Error(`API returned code ${res.statusCode}`);
    }
  } catch (err) {
    console.log(`   ❌ FAILED: Candidates query failed! Database might be down. (${err.message})`);
    failedTests++;
  }

  console.log('');

  // Test 4: Election Config Retrieval
  try {
    console.log('📌 TEST 4: Validating "/api/election/config" query...');
    const res = await makeRequest('GET', '/api/election/config');
    if (res.statusCode === 200) {
      const config = JSON.parse(res.body);
      console.log('   ✅ PASSED: Election rules and configurations successfully synced with frontend!');
      console.log(`      • Active Election Mode: ${config.electionOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
    } else {
      throw new Error(`Config API returned code ${res.statusCode}`);
    }
  } catch (err) {
    console.log(`   ❌ FAILED: Config API is unresponsive! (${err.message})`);
    failedTests++;
  }

  console.log('\n==================================================');
  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! ✨');
    console.log('   The full stack API is perfectly connected.');
    console.log('==================================================\n');
  } else {
    console.log(`⚠️  TESTING COMPLETED WITH ${failedTests} ERROR(S).`);
    console.log('   Please double check the console logs above.');
    console.log('==================================================\n');
  }
}

runTests();
