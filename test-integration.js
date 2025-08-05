// 🧪 Frontend Integration Test untuk Airsoft AR Battle
// Testing koneksi frontend dengan backend API dan WebSocket

const BACKEND_URL = 'https://shaky-meeting-production.up.railway.app';
const FRONTEND_URL = 'https://airsoftar.vercel.app';

console.log('🧪 Testing Frontend Integration dengan Backend...\n');

// Test 1: API Connection Test
async function testAPIConnection() {
  console.log('1️⃣ Testing API Connection...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/players`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Connection SUCCESS');
      console.log('   Players count:', data.length || 0);
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

// Test 2: WebSocket Connection Test
function testWebSocketConnection() {
  console.log('\n2️⃣ Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    // Simulate browser WebSocket
    const WebSocket = require('ws');
    const ws = new WebSocket(`wss://shaky-meeting-production.up.railway.app`);
    
    ws.on('open', () => {
      console.log('✅ WebSocket Connection SUCCESS');
      
      // Test game events
      const testEvents = [
        {
          type: 'joinGame',
          data: { name: 'TestPlayer', team: 'red', hp: 100 }
        },
        {
          type: 'gpsUpdate',
          data: { lat: -6.2088, lng: 106.8456, accuracy: 10 }
        }
      ];
      
      testEvents.forEach((event, index) => {
        setTimeout(() => {
          ws.send(JSON.stringify(event));
          console.log(`📤 Sent ${event.type} event`);
        }, index * 1000);
      });
      
      setTimeout(() => {
        ws.close();
        resolve(true);
      }, 3000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('📨 Received:', message.type || 'Unknown message');
      } catch (error) {
        console.log('📨 Received raw message');
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket Connection FAILED');
      console.log('   Error:', error.message);
      resolve(false);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket Connection Closed');
    });
    
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('❌ WebSocket Connection FAILED - Timeout');
        ws.terminate();
        resolve(false);
      }
    }, 10000);
  });
}

// Test 3: Frontend Configuration Test
function testFrontendConfig() {
  console.log('\n3️⃣ Testing Frontend Configuration...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Check API configuration
    const apiFile = path.join(__dirname, 'src/lib/api.ts');
    const apiContent = fs.readFileSync(apiFile, 'utf8');
    
    if (apiContent.includes('shaky-meeting-production.up.railway.app')) {
      console.log('✅ API Base URL configured correctly');
    } else {
      console.log('❌ API Base URL not configured correctly');
      return false;
    }
    
    // Check package.json
    const packageFile = path.join(__dirname, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    
    if (packageContent.dependencies && packageContent.dependencies.next) {
      console.log('✅ Next.js dependencies configured');
    } else {
      console.log('❌ Next.js dependencies missing');
      return false;
    }
    
    console.log('✅ Frontend Configuration OK');
    return true;
  } catch (error) {
    console.log('❌ Frontend Configuration FAILED');
    console.log('   Error:', error.message);
    return false;
  }
}

// Test 4: Build Test
async function testBuild() {
  console.log('\n4️⃣ Testing Frontend Build...');
  
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    console.log('🔨 Building frontend...');
    
    exec('npm run build', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Build FAILED');
        console.log('   Error:', error.message);
        resolve(false);
      } else {
        console.log('✅ Build SUCCESS');
        console.log('   Output:', stdout.trim());
        resolve(true);
      }
    });
  });
}

// Test 5: Performance Test
async function testPerformance() {
  console.log('\n5️⃣ Testing Performance...');
  
  const startTime = Date.now();
  
  try {
    // Test multiple API calls
    const promises = [
      fetch(`${BACKEND_URL}/api/players`),
      fetch(`${BACKEND_URL}/api/shooting/weapons`),
      fetch(`${BACKEND_URL}/api/anti-cheat/status`)
    ];
    
    await Promise.all(promises);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Average Response Time: ${responseTime / 3}ms`);
    
    if (responseTime < 3000) {
      console.log('✅ Performance GOOD (< 3 seconds total)');
      return true;
    } else if (responseTime < 5000) {
      console.log('⚠️ Performance ACCEPTABLE (< 5 seconds total)');
      return true;
    } else {
      console.log('❌ Performance POOR (> 5 seconds total)');
      return false;
    }
  } catch (error) {
    console.log('❌ Performance Test FAILED');
    console.log('   Error:', error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Frontend Integration Tests...\n');
  
  const results = {
    apiConnection: false,
    webSocket: false,
    frontendConfig: false,
    build: false,
    performance: false
  };
  
  // Run all tests
  results.apiConnection = await testAPIConnection();
  results.webSocket = await testWebSocketConnection();
  results.frontendConfig = testFrontendConfig();
  results.build = await testBuild();
  results.performance = await testPerformance();
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`API Connection:   ${results.apiConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket:        ${results.webSocket ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Config:  ${results.frontendConfig ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Build:            ${results.build ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Performance:      ${results.performance ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Frontend integration is perfect!');
    console.log('💕 Your Airsoft AR Battle frontend is ready for production!');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests }; 