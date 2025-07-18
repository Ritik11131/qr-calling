const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

// Mock JWT token (replace with actual token)
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImlhdCI6MTc1Mjc1MzIzMCwiZXhwIjoxNzUzMzU4MDMwfQ.oOlEOYkPXCL8yKXG4UX2iul8Nkvky23GQcfgoGRxXH0';

async function testCallInitiation() {
    console.log('=== Testing Call Initiation ===');
    
    try {
        const response = await fetch(`${BASE_URL}/api/calls/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                qrId: 'qr_001',
                callType: 'video'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Call initiation successful!');
            console.log('Response data:', {
                success: data.success,
                callId: data.callId,
                channelName: data.channelName,
                appId: data.appId,
                tokenLength: data.token ? data.token.length : 0,
                receiverName: data.receiver?.name
            });
            
            // Verify token structure
            if (data.token) {
                console.log('Token preview:', data.token.substring(0, 50) + '...');
                console.log('Token starts with 006:', data.token.startsWith('006'));
            }
            
            // Test token generation endpoint
            await testTokenGeneration();
            
        } else {
            console.error('❌ Call initiation failed:', data);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

async function testTokenGeneration() {
    console.log('\n=== Testing Token Generation Endpoint ===');
    
    try {
        const response = await fetch(`${BASE_URL}/api/agora/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                channelName: 'test_channel',
                uid: 'test_user',
                role: 1
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Token generation successful!');
            console.log('Token data:', {
                success: data.success,
                appId: data.appId,
                tokenLength: data.token ? data.token.length : 0
            });
            
            if (data.token) {
                console.log('Token preview:', data.token.substring(0, 50) + '...');
            }
            
        } else {
            console.error('❌ Token generation failed:', data);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

async function testHealthCheck() {
    console.log('=== Testing Health Check ===');
    
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Server is healthy!');
            console.log('Server status:', data.status);
            console.log('Uptime:', data.uptime, 'seconds');
        } else {
            console.error('❌ Health check failed:', data);
        }
        
    } catch (error) {
        console.error('❌ Server not accessible:', error.message);
    }
}

async function runTests() {
    await testHealthCheck();
    await testCallInitiation();
}

runTests();
