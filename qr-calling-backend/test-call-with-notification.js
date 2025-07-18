const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImlhdCI6MTc1Mjc1MzIzMCwiZXhwIjoxNzUzMzU4MDMwfQ.oOlEOYkPXCL8yKXG4UX2iul8Nkvky23GQcfgoGRxXH0';

async function testCallInitiationWithNotification() {
    console.log('=== Testing Call Initiation with Push Notification ===');
    
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
            console.log('📋 Complete Response:');
            console.log(JSON.stringify(data, null, 2));
            
            // Check notification status
            if (data.notification) {
                console.log('\n📱 Notification Status:');
                console.log('   Sent:', data.notification.sent ? '✅' : '❌');
                console.log('   Success Count:', data.notification.successCount);
                console.log('   Failure Count:', data.notification.failureCount);
                if (data.notification.error) {
                    console.log('   Error:', data.notification.error);
                }
            } else {
                console.log('\n⚠️  No notification status in response');
            }
            
        } else {
            console.error('❌ Call initiation failed:', data);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testCallInitiationWithNotification();
