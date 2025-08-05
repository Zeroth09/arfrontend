// 🧪 Simple Frontend Integration Test
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BACKEND_URL = 'http://localhost:3001';

console.log('🧪 Testing Frontend Integration...\n');

async function testAPIConnection() {
  console.log('1️⃣ Testing API Connection...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/players`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Connection SUCCESS');
      console.log('   Players count:', data.total || 0);
      return true;
    } else {
      console.log(`❌ API Connection FAILED - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ API Connection FAILED - Network error');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testWeaponsAPI() {
  console.log('\n2️⃣ Testing Weapons API...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/shooting/weapons`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Weapons API SUCCESS');
      console.log('   Weapons available:', Object.keys(data.weapons || {}).length);
      return true;
    } else {
      console.log(`❌ Weapons API FAILED - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Weapons API FAILED - Network error');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n3️⃣ Testing Health Check...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health Check SUCCESS');
      console.log('   Status:', data.status);
      console.log('   Version:', data.version);
      console.log('   Mode:', data.mode);
      return true;
    } else {
      console.log(`❌ Health Check FAILED - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check FAILED - Network error');
    console.log('   Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Simple Integration Tests...\n');
  
  const results = {
    apiConnection: false,
    weaponsAPI: false,
    healthCheck: false
  };
  
  // Run all tests
  results.apiConnection = await testAPIConnection();
  results.weaponsAPI = await testWeaponsAPI();
  results.healthCheck = await testHealthCheck();
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`API Connection:   ${results.apiConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Weapons API:      ${results.weaponsAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Health Check:     ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Frontend integration is working!');
    console.log('💕 Your Airsoft AR Battle system is ready!');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Run tests
runAllTests().catch(console.error); 