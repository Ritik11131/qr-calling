const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const fetch = require('node-fetch');
require('dotenv').config();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const BASE_URL = 'http://localhost:5000';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImlhdCI6MTc1Mjc1MzIzMCwiZXhwIjoxNzUzMzU4MDMwfQ.oOlEOYkPXCL8yKXG4UX2iul8Nkvky23GQcfgoGRxXH0';

console.log('=== Agora Token Troubleshooting ===\n');

// 1. Test basic token generation with different parameters
async function testTokenGeneration() {
    console.log('1. Testing Token Generation Variations');
    console.log('=====================================');
    
    const testCases = [
        { channelName: 'test_channel', uid: 'test_user_001', role: RtcRole.PUBLISHER },
        { channelName: 'test_channel', uid: 0, role: RtcRole.PUBLISHER },
        { channelName: 'test_channel', uid: 12345, role: RtcRole.PUBLISHER },
        { channelName: 'call_test123', uid: 'user_001', role: RtcRole.PUBLISHER },
        { channelName: 'call_test123', uid: 'user_001', role: RtcRole.SUBSCRIBER },
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const privilegeExpireTime = currentTime + 3600;
            
            const token = RtcTokenBuilder.buildTokenWithUid(
                APP_ID,
                APP_CERTIFICATE,
                testCase.channelName,
                testCase.uid,
                testCase.role,
                privilegeExpireTime
            );
            
            console.log(`✅ Test ${i+1}: Channel="${testCase.channelName}", UID="${testCase.uid}", Role=${testCase.role}`);
            console.log(`   Token: ${token.substring(0, 60)}...`);
            console.log(`   Length: ${token.length}`);
            
        } catch (error) {
            console.log(`❌ Test ${i+1} failed:`, error.message);
        }
    }
}

// 2. Test API endpoint token generation
async function testAPITokenGeneration() {
    console.log('\n2. Testing API Token Generation');
    console.log('===============================');
    
    const testCases = [
        { channelName: 'test_channel', uid: 'test_user_001', role: 1 },
        { channelName: 'test_channel', uid: 0, role: 1 },
        { channelName: 'test_channel', uid: 12345, role: 1 },
        { channelName: 'call_test123', uid: 'user_001', role: 1 },
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        try {
            const response = await fetch(`${BASE_URL}/api/agora/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JWT_TOKEN}`
                },
                body: JSON.stringify(testCase)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ API Test ${i+1}: Channel="${testCase.channelName}", UID="${testCase.uid}"`);
                console.log(`   Token: ${data.token.substring(0, 60)}...`);
                console.log(`   App ID: ${data.appId}`);
            } else {
                console.log(`❌ API Test ${i+1} failed:`, data);
            }
            
        } catch (error) {
            console.log(`❌ API Test ${i+1} error:`, error.message);
        }
    }
}

// 3. Test call initiation with different parameters
async function testCallInitiation() {
    console.log('\n3. Testing Call Initiation');
    console.log('==========================');
    
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
            console.log('✅ Call Initiation Data:');
            console.log(`   Call ID: ${data.callId}`);
            console.log(`   Channel: ${data.channelName}`);
            console.log(`   App ID: ${data.appId}`);
            console.log(`   Token: ${data.token.substring(0, 60)}...`);
            console.log(`   Token Length: ${data.token.length}`);
            
            // Verify the token structure
            console.log('\n   Token Analysis:');
            console.log(`   - Starts with 006: ${data.token.startsWith('006')}`);
            console.log(`   - Contains App ID: ${data.token.includes(data.appId.substring(0, 8))}`);
            console.log(`   - Contains Channel: ${data.token.includes(data.channelName.substring(5, 15))}`);
            
            return {
                callId: data.callId,
                channelName: data.channelName,
                appId: data.appId,
                token: data.token
            };
            
        } else {
            console.log('❌ Call initiation failed:', data);
            return null;
        }
        
    } catch (error) {
        console.log('❌ Call initiation error:', error.message);
        return null;
    }
}

// 4. Test potential frontend simulation
async function simulateFrontendJoin(callData) {
    console.log('\n4. Frontend Join Simulation');
    console.log('============================');
    
    if (!callData) {
        console.log('❌ No call data available for simulation');
        return;
    }
    
    console.log('Frontend would attempt to join with:');
    console.log(`   App ID: ${callData.appId}`);
    console.log(`   Channel: ${callData.channelName}`);
    console.log(`   Token: ${callData.token.substring(0, 60)}...`);
    console.log(`   UID: ${callData.callId}`);
    
    // Check token validity
    const tokenParts = callData.token.split('IAA');
    if (tokenParts.length === 2) {
        console.log('✅ Token structure appears valid');
    } else {
        console.log('❌ Token structure might be invalid');
    }
    
    // Check if token matches app ID
    if (callData.token.includes(callData.appId)) {
        console.log('✅ Token contains correct App ID');
    } else {
        console.log('❌ Token does not contain App ID');
    }
}

// 5. Generate test tokens for specific scenarios
async function generateTestTokens() {
    console.log('\n5. Test Token Generation for Common Scenarios');
    console.log('============================================');
    
    const scenarios = [
        { name: 'String UID', channel: 'test_channel', uid: 'user_001' },
        { name: 'Numeric UID', channel: 'test_channel', uid: 123456 },
        { name: 'Zero UID', channel: 'test_channel', uid: 0 },
        { name: 'UUID Channel', channel: 'call_' + require('crypto').randomUUID(), uid: 'user_001' },
    ];
    
    for (const scenario of scenarios) {
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const privilegeExpireTime = currentTime + 3600;
            
            const token = RtcTokenBuilder.buildTokenWithUid(
                APP_ID,
                APP_CERTIFICATE,
                scenario.channel,
                scenario.uid,
                RtcRole.PUBLISHER,
                privilegeExpireTime
            );
            
            console.log(`✅ ${scenario.name}:`);
            console.log(`   Channel: ${scenario.channel}`);
            console.log(`   UID: ${scenario.uid}`);
            console.log(`   Token: ${token.substring(0, 60)}...`);
            
        } catch (error) {
            console.log(`❌ ${scenario.name} failed:`, error.message);
        }
    }
}

// Main execution
async function runTroubleshooting() {
    await testTokenGeneration();
    await testAPITokenGeneration();
    const callData = await testCallInitiation();
    await simulateFrontendJoin(callData);
    await generateTestTokens();
    
    console.log('\n=== Troubleshooting Complete ===');
    console.log('If tokens are generating correctly but frontend fails,');
    console.log('check the frontend console for more detailed error messages.');
}

runTroubleshooting();
