const fetch = require('node-fetch');
const io = require('socket.io-client');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImlhdCI6MTc1Mjc1MzIzMCwiZXhwIjoxNzUzMzU4MDMwfQ.oOlEOYkPXCL8yKXG4UX2iul8Nkvky23GQcfgoGRxXH0';

class IntegrationTester {
  constructor() {
    this.socket = null;
    this.receivedEvents = [];
  }

  async setupSocket() {
    return new Promise((resolve) => {
      this.socket = io(BASE_URL, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
        this.socket.emit('join-user', 'user_002'); // Join as receiver
        resolve();
      });

      this.socket.on('incoming-call', (data) => {
        console.log('📞 Incoming call received:', data);
        this.receivedEvents.push({ type: 'incoming-call', data });
      });

      this.socket.on('call-accepted', (data) => {
        console.log('✅ Call accepted:', data);
        this.receivedEvents.push({ type: 'call-accepted', data });
      });

      this.socket.on('call-rejected', (data) => {
        console.log('❌ Call rejected:', data);
        this.receivedEvents.push({ type: 'call-rejected', data });
      });

      this.socket.on('call-ended', (data) => {
        console.log('📞 Call ended:', data);
        this.receivedEvents.push({ type: 'call-ended', data });
      });
    });
  }

  async testHealthCheck() {
    console.log('\n=== Testing Health Check ===');
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      console.log('✅ Health check passed:', data.status);
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }

  async testQRCodeGeneration() {
    console.log('\n=== Testing QR Code Generation ===');
    try {
      const response = await fetch(`${BASE_URL}/api/qr/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        },
        body: JSON.stringify({
          userId: 'user_002',
          userName: 'Jane Doe',
          userAvatar: 'https://example.com/avatar2.jpg'
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ QR Code generated successfully');
        console.log('   QR ID:', data.qrId);
        console.log('   QR URL:', data.qrUrl);
        return data.qrId;
      } else {
        console.error('❌ QR Code generation failed:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ QR Code generation error:', error.message);
      return null;
    }
  }

  async testCallInitiation(qrId) {
    console.log('\n=== Testing Call Initiation ===');
    try {
      const response = await fetch(`${BASE_URL}/api/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        },
        body: JSON.stringify({
          qrId: qrId,
          callType: 'video'
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Call initiated successfully');
        console.log('   Call ID:', data.callId);
        console.log('   Channel:', data.channelName);
        console.log('   Notification sent:', data.notification.sent);
        console.log('   Notification count:', data.notification.successCount);
        
        // Wait a bit for socket event
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return data;
      } else {
        console.error('❌ Call initiation failed:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Call initiation error:', error.message);
      return null;
    }
  }

  async testCallAnswer(callId) {
    console.log('\n=== Testing Call Answer ===');
    try {
      const response = await fetch(`${BASE_URL}/api/calls/${callId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Call answered successfully');
        return true;
      } else {
        console.error('❌ Call answer failed:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Call answer error:', error.message);
      return false;
    }
  }

  async testCallEnd(callId) {
    console.log('\n=== Testing Call End ===');
    try {
      const response = await fetch(`${BASE_URL}/api/calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        },
        body: JSON.stringify({ duration: 30 })
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Call ended successfully');
        return true;
      } else {
        console.error('❌ Call end failed:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Call end error:', error.message);
      return false;
    }
  }

  async testCallHistory() {
    console.log('\n=== Testing Call History ===');
    try {
      const response = await fetch(`${BASE_URL}/api/calls/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Call history retrieved successfully');
        console.log('   Total calls:', data.calls.length);
        console.log('   Current page:', data.currentPage);
        return true;
      } else {
        console.error('❌ Call history failed:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Call history error:', error.message);
      return false;
    }
  }

  async testNotificationService() {
    console.log('\n=== Testing Notification Service ===');
    try {
      const response = await fetch(`${BASE_URL}/api/test-notifications/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Notification service status retrieved');
        console.log('   Firebase initialized:', data.firebaseInitialized);
        console.log('   Mode:', data.mode);
        return true;
      } else {
        console.error('❌ Notification service test failed:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Notification service error:', error.message);
      return false;
    }
  }

  async testAgoraToken() {
    console.log('\n=== Testing Agora Token Generation ===');
    try {
      const response = await fetch(`${BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        },
        body: JSON.stringify({
          channelName: 'test_channel',
          uid: 'user_002',
          role: 1
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Agora token generated successfully');
        console.log('   App ID:', data.appId);
        console.log('   Token length:', data.token.length);
        return true;
      } else {
        console.error('❌ Agora token generation failed:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Agora token generation error:', error.message);
      return false;
    }
  }

  async runCompleteTest() {
    console.log('🚀 Starting Complete Integration Test\n');
    
    const results = {
      healthCheck: false,
      socketConnection: false,
      qrGeneration: false,
      callInitiation: false,
      callAnswer: false,
      callEnd: false,
      callHistory: false,
      notificationService: false,
      agoraToken: false,
      socketEvents: false
    };

    // 1. Health check
    results.healthCheck = await this.testHealthCheck();
    if (!results.healthCheck) {
      console.log('❌ Health check failed, stopping tests');
      return results;
    }

    // 2. Socket connection
    try {
      await this.setupSocket();
      results.socketConnection = true;
    } catch (error) {
      console.error('❌ Socket connection failed:', error.message);
      return results;
    }

    // 3. QR code generation
    const qrId = await this.testQRCodeGeneration();
    results.qrGeneration = qrId !== null;
    if (!results.qrGeneration) {
      console.log('❌ QR generation failed, stopping call tests');
      return results;
    }

    // 4. Call initiation
    const callData = await this.testCallInitiation(qrId);
    results.callInitiation = callData !== null;
    if (!results.callInitiation) {
      console.log('❌ Call initiation failed, stopping call tests');
      return results;
    }

    // 5. Call answer
    results.callAnswer = await this.testCallAnswer(callData.callId);

    // 6. Call end
    results.callEnd = await this.testCallEnd(callData.callId);

    // 7. Call history
    results.callHistory = await this.testCallHistory();

    // 8. Notification service
    results.notificationService = await this.testNotificationService();

    // 9. Agora token
    results.agoraToken = await this.testAgoraToken();

    // 10. Socket events
    results.socketEvents = this.receivedEvents.length > 0;

    // Summary
    console.log('\n=== Test Results Summary ===');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    console.log('\n=== Socket Events Received ===');
    this.receivedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.type}:`, event.data);
    });

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    console.log(`\n📊 Overall Score: ${passedTests}/${totalTests} tests passed`);

    // Cleanup
    if (this.socket) {
      this.socket.disconnect();
    }

    return results;
  }
}

// Run the test
const tester = new IntegrationTester();
tester.runCompleteTest().then(results => {
  const allPassed = Object.values(results).every(Boolean);
  process.exit(allPassed ? 0 : 1);
});
