class QRCallingApp {
    constructor() {
        this.socket = null;
        this.agoraClient = null;
        this.localTracks = {};
        this.remoteUsers = {};
        this.currentCall = null;
        this.codeReader = null;
        this.scannerControls = null;
        this.selectedDeviceId = null;
        this.isCallActive = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Socket.IO
            this.socket = io('http://localhost:5000');
            this.setupSocketListeners();
            
            // Initialize Agora
            this.agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            this.setupAgoraListeners();
            
            // Initialize QR Scanner
            await this.initQRScanner();
            
            // Setup UI event listeners
            this.setupUIListeners();
            
            console.log('QR Calling App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    async initQRScanner() {
        try {
            console.log('Initializing QR Scanner...');
            const video = document.getElementById('qr-scanner');
            
            if (!video) {
                console.error('Video element not found');
                return;
            }
            
            // Check if ZXing is available
            if (typeof ZXing === 'undefined') {
                console.error('ZXing library not loaded');
                return;
            }
            
            this.codeReader = new ZXing.BrowserQRCodeReader();
            
            // Get video devices with timeout
            const videoInputDevices = await Promise.race([
                this.codeReader.listVideoInputDevices(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Device enumeration timeout')), 5000))
            ]);
            
            console.log('Available video devices:', videoInputDevices);
            
            if (videoInputDevices.length === 0) {
                console.error('No video input devices found');
                return;
            }
            
            this.selectedDeviceId = videoInputDevices[0].deviceId;
            
            // Start scanning with timeout
            await this.startScanning();
            
            console.log('QR Scanner initialized successfully');
        } catch (error) {
            console.error('Failed to start QR scanner:', error);
            // Don't let scanner failure stop the rest of the app
        }
    }
    
    async startScanning() {
        try {
            const video = document.getElementById('qr-scanner');
            
            // Use decodeFromVideoDevice for continuous scanning
            this.scannerControls = await this.codeReader.decodeFromVideoDevice(
                this.selectedDeviceId, 
                video, 
                (result, error) => {
                    if (result) {
                        console.log('QR Code detected:', result.getText());
                        this.handleQRScan(result.getText());
                    }
                    if (error && !(error instanceof ZXing.NotFoundException)) {
                        console.error('QR Scanner error:', error);
                    }
                }
            );
            
            console.log('Scanner started successfully');
        } catch (error) {
            console.error('Error starting scanner:', error);
            throw error;
        }
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('incoming-call', (data) => {
            this.handleIncomingCall(data);
        });

        this.socket.on('call-accepted', (data) => {
            this.handleCallAccepted(data);
        });

        this.socket.on('call-rejected', (data) => {
            this.handleCallRejected(data);
        });

        this.socket.on('call-ended', (data) => {
            this.handleCallEnded(data);
        });
    }

    setupAgoraListeners() {
        this.agoraClient.on('user-published', async (user, mediaType) => {
            await this.agoraClient.subscribe(user, mediaType);
            
            if (mediaType === 'video') {
                const remoteVideoTrack = user.videoTrack;
                const remoteVideo = document.getElementById('remote-video');
                remoteVideoTrack.play(remoteVideo);
            }
            
            if (mediaType === 'audio') {
                const remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
            }
        });

        this.agoraClient.on('user-unpublished', (user) => {
            const remoteVideo = document.getElementById('remote-video');
            remoteVideo.innerHTML = '';
        });
    }

    setupUIListeners() {
        // End call button
        document.getElementById('end-call-btn').addEventListener('click', () => {
            this.endCall();
        });

        // Mute button
        document.getElementById('mute-btn').addEventListener('click', () => {
            this.toggleMute();
        });

        // Video button
        document.getElementById('video-btn').addEventListener('click', () => {
            this.toggleVideo();
        });

        // Switch camera button
        document.getElementById('switch-camera').addEventListener('click', () => {
            this.switchCamera();
        });

        // Manual input button
        document.getElementById('manual-input').addEventListener('click', () => {
            this.showManualInput();
        });
    }

    async handleQRScan(result) {
        try {
            console.log('QR Code scanned:', result);
            
            // Stop scanner
            if (this.scannerControls) {
                this.scannerControls.stop();
            }
            
            // Extract QR ID from result
            const qrId = this.extractQRId(result);
            
            // Initiate call
            await this.initiateCall(qrId);
            
        } catch (error) {
            console.error('Error handling QR scan:', error);
            this.showError('Failed to process QR code');
        }
    }

    extractQRId(qrResult) {
        // Assuming QR contains URL like: https://yourapp.com/call?qr=QR_ID
        const url = new URL(qrResult);
        return url.searchParams.get('qr');
    }

    async initiateCall(qrId) {
        try {
            const response = await fetch('http://localhost:5000/api/calls/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImlhdCI6MTc1Mjc1MzIzMCwiZXhwIjoxNzUzMzU4MDMwfQ.oOlEOYkPXCL8yKXG4UX2iul8Nkvky23GQcfgoGRxXH0`
                },
                body: JSON.stringify({ qrId, callType: 'video' })
            });

            if (!response.ok) {
                throw new Error('Failed to initiate call');
            }

            
            
            const callData = await response.json();
            console.log(callData);
            this.currentCall = callData;
            
            // Update UI
            this.showCallView();
            this.updateCallInfo(callData.receiver);
            
            // Join Agora channel (use a simpler UID format)
            const uid = 'user_001'; // Use a simpler UID instead of callId
            await this.joinAgoraChannel(callData.channelName, callData.token, uid, callData.appId);
            
        } catch (error) {
            console.error('Error initiating call:', error);
            this.showError('Failed to initiate call');
        }
    }

    async joinAgoraChannel(channelName, token, uid, appId) {
        try {
            // Join channel
            await this.agoraClient.join(appId, channelName, token, uid);
            
            // Create and publish local tracks
            this.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            this.localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
            
            // Play local video
            const localVideo = document.getElementById('local-video');
            this.localTracks.videoTrack.play(localVideo);
            
            // Publish tracks
            await this.agoraClient.publish([this.localTracks.audioTrack, this.localTracks.videoTrack]);
            
            this.isCallActive = true;
            this.updateCallStatus('Connected');
            
        } catch (error) {
            console.error('Error joining Agora channel:', error);
            this.showError('Failed to connect to call');
        }
    }

    async endCall() {
        try {
            if (this.currentCall) {
                // End call on server
                await fetch(`http://localhost:5000/api/calls/${this.currentCall.callId}/end`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImlhdCI6MTc1Mjc1MzIzMCwiZXhwIjoxNzUzMzU4MDMwfQ.oOlEOYkPXCL8yKXG4UX2iul8Nkvky23GQcfgoGRxXH0`
                    },
                    body: JSON.stringify({ duration: this.getCallDuration() })
                });
            }
            
            // Leave Agora channel
            if (this.agoraClient) {
                await this.agoraClient.leave();
            }
            
            // Close local tracks
            if (this.localTracks.audioTrack) {
                this.localTracks.audioTrack.close();
            }
            if (this.localTracks.videoTrack) {
                this.localTracks.videoTrack.close();
            }
            
            // Reset state
            this.currentCall = null;
            this.isCallActive = false;
            this.localTracks = {};
            this.remoteUsers = {};
            
            // Return to scanner view
            this.showScannerView();
            
            // Restart scanner
            await this.startScanning();
            
        } catch (error) {
            console.error('Error ending call:', error);
        }
    }

    toggleMute() {
        if (this.localTracks.audioTrack) {
            const isMuted = this.localTracks.audioTrack.muted;
            this.localTracks.audioTrack.setMuted(!isMuted);
            
            const muteBtn = document.getElementById('mute-btn');
            muteBtn.classList.toggle('muted', !isMuted);
            muteBtn.querySelector('.icon').textContent = !isMuted ? '🔇' : '🎤';
        }
    }

    toggleVideo() {
        if (this.localTracks.videoTrack) {
            const isEnabled = this.localTracks.videoTrack.enabled;
            this.localTracks.videoTrack.setEnabled(!isEnabled);
            
            const videoBtn = document.getElementById('video-btn');
            videoBtn.classList.toggle('disabled', isEnabled);
            videoBtn.querySelector('.icon').textContent = isEnabled ? '📹' : '🚫';
        }
    }

    async switchCamera() {
        try {
            // Stop current scanner
            if (this.scannerControls) {
                this.scannerControls.stop();
            }
            
            // Get video devices
            const videoInputDevices = await this.codeReader.listVideoInputDevices();
            
            // Find current device index
            const currentIndex = videoInputDevices.findIndex(device => device.deviceId === this.selectedDeviceId);
            
            // Switch to next device (or first if at end)
            const nextIndex = (currentIndex + 1) % videoInputDevices.length;
            this.selectedDeviceId = videoInputDevices[nextIndex]?.deviceId;
            
            // Restart scanner with new device
            await this.startScanning();
        } catch (error) {
            console.error('Error switching camera:', error);
        }
    }

    showManualInput() {
        console.log('ok');
        this.initiateCall('qr_001');
    }

    showScannerView() {
        document.getElementById('scanner-view').classList.add('active');
        document.getElementById('call-view').classList.remove('active');
    }

    showCallView() {
        document.getElementById('scanner-view').classList.remove('active');
        document.getElementById('call-view').classList.add('active');
    }

    updateCallInfo(receiver) {
        document.getElementById('receiver-name').textContent = receiver.name;
        document.getElementById('receiver-avatar').src = receiver.avatar || '/default-avatar.png';
    }

    updateCallStatus(status) {
        document.getElementById('call-status').textContent = status;
    }

    getCallDuration() {
        if (this.currentCall && this.currentCall.startTime) {
            return Math.floor((Date.now() - new Date(this.currentCall.startTime)) / 1000);
        }
        return 0;
    }

    showError(message) {
        alert(message); // Replace with better error handling
    }

    handleIncomingCall(data) {
        // This would be handled by the mobile app
        console.log('Incoming call:', data);
    }

    handleCallAccepted(data) {
        this.updateCallStatus('Call accepted');
    }

    handleCallRejected(data) {
        this.updateCallStatus('Call rejected');
        setTimeout(() => {
            this.endCall();
        }, 2000);
    }

    handleCallEnded(data) {
        this.endCall();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRCallingApp();
});