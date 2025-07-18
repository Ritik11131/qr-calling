const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImlhdCI6MTc1Mjc1MzIzMCwiZXhwIjoxNzUzMzU4MDMwfQ.oOlEOYkPXCL8yKXG4UX2iul8Nkvky23GQcfgoGRxXH0';

async function testCallType(callType) {
    console.log(`\n=== Testing ${callType.toUpperCase()} Call ===`);
    
    try {
        const response = await fetch(`${BASE_URL}/api/calls/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                qrId: 'qr_001',
                callType: callType
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ ${callType} call initiated successfully!`);
            console.log('Call details:', {
                callId: data.callId,
                channelName: data.channelName,
                appId: data.appId,
                tokenValid: data.token && data.token.length > 100,
                receiverName: data.receiver?.name
            });
            
            // Check if call was saved with correct type
            await checkCallInDatabase(data.callId, callType);
            
        } else {
            console.error(`❌ ${callType} call initiation failed:`, data);
        }
        
    } catch (error) {
        console.error(`❌ ${callType} call error:`, error.message);
    }
}

async function checkCallInDatabase(callId, expectedType) {
    try {
        const response = await fetch(`${BASE_URL}/api/calls/${callId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.call) {
            const actualType = data.call.callType;
            if (actualType === expectedType) {
                console.log(`✅ Call type correctly saved as '${actualType}'`);
            } else {
                console.log(`⚠️  Call type mismatch: expected '${expectedType}', got '${actualType}'`);
            }
        } else {
            console.log(`❌ Could not verify call in database`);
        }
        
    } catch (error) {
        console.log(`❌ Error checking call in database:`, error.message);
    }
}

async function testBothCallTypes() {
    console.log('=== Testing Both Audio and Video Call Types ===');
    
    await testCallType('video');
    await testCallType('audio');
    
    console.log('\n=== Testing Invalid Call Type ===');
    await testCallType('invalid');
}

// Run the tests
testBothCallTypes();
