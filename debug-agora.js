const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
require('dotenv').config();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

console.log('=== Agora Configuration Debug ===');
console.log('APP_ID:', APP_ID ? `${APP_ID.substring(0, 8)}...` : 'NOT SET');
console.log('APP_CERTIFICATE:', APP_CERTIFICATE ? `${APP_CERTIFICATE.substring(0, 8)}...` : 'NOT SET');
console.log('APP_ID length:', APP_ID ? APP_ID.length : 0);
console.log('APP_CERTIFICATE length:', APP_CERTIFICATE ? APP_CERTIFICATE.length : 0);

if (!APP_ID || !APP_CERTIFICATE) {
    console.error('❌ Missing Agora credentials in environment variables');
    process.exit(1);
}

// Test token generation
const testChannelName = 'test_channel';
const testUid = 'test_user_001';
const testRole = RtcRole.PUBLISHER;
const expireTime = 3600;

try {
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    
    console.log('\n=== Token Generation Test ===');
    console.log('Channel Name:', testChannelName);
    console.log('UID:', testUid);
    console.log('Role:', testRole);
    console.log('Current Time:', currentTime);
    console.log('Expire Time:', privilegeExpireTime);
    
    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        testChannelName,
        testUid,
        testRole,
        privilegeExpireTime
    );
    
    console.log('✅ Token generated successfully!');
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('Token length:', token.length);
    
} catch (error) {
    console.error('❌ Token generation failed:', error.message);
    console.error('Error details:', error);
}
