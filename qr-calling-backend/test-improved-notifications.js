const { sendPushNotification, testNotificationService, isFirebaseInitialized } = require('./services/notificationService-improved');

async function runNotificationTests() {
    console.log('=== Push Notification Testing ===');
    console.log('Firebase Initialized:', isFirebaseInitialized());
    
    // Test 1: Basic notification
    console.log('\n1. Testing Basic Notification:');
    const basicResult = await sendPushNotification(['device_token_1'], {
        title: 'Incoming Call',
        body: 'John Doe is calling you',
        data: {
            callId: 'call_123',
            type: 'incoming_call'
        }
    });
    console.log('Basic Test Result:', basicResult);
    
    // Test 2: Multiple devices
    console.log('\n2. Testing Multiple Devices:');
    const multipleResult = await sendPushNotification(['token_1', 'token_2', 'token_3'], {
        title: 'Group Call',
        body: 'You have been invited to a group call',
        data: {
            callId: 'call_456',
            type: 'group_call'
        }
    });
    console.log('Multiple Devices Result:', multipleResult);
    
    // Test 3: Empty tokens
    console.log('\n3. Testing Empty Tokens:');
    const emptyResult = await sendPushNotification([], {
        title: 'Test',
        body: 'This should not send'
    });
    console.log('Empty Tokens Result:', emptyResult);
    
    // Test 4: Invalid tokens
    console.log('\n4. Testing Invalid Tokens:');
    const invalidResult = await sendPushNotification(['', null, 'valid_token'], {
        title: 'Mixed Tokens',
        body: 'Testing mixed valid/invalid tokens'
    });
    console.log('Invalid Tokens Result:', invalidResult);
    
    // Test 5: Using test function
    console.log('\n5. Using Built-in Test Function:');
    const testResult = await testNotificationService();
    
    console.log('\n=== All Tests Complete ===');
}

runNotificationTests();
