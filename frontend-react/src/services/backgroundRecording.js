/**
 * Background Recording Service
 * Automatically starts recording when user logs in
 * Runs independently in the background
 */

class BackgroundRecordingService {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.recordingTime = 0;
    this.recordingInterval = null;
    this.isRecording = false;
    this.isInitialized = false;
    this.cameraId = null; // Store camera ID for uploads
  }

  /**
   * Initialize and start background recording
   */
  async start(specificCameraId = null) {
    console.log('📍 BackgroundRecordingService.start() called', specificCameraId ? `with camera ID: ${specificCameraId}` : '');
    console.log('📍 Current state - isInitialized:', this.isInitialized);
    
    if (this.isInitialized) {
      console.log('⚠️ Background recording already running');
      return;
    }

    try {
      console.log('🎬 Starting background recording service...');
      
      // Check if user has any webcam cameras in database
      const username = localStorage.getItem('username');
      if (!username) {
        console.log('⚠️ No username found, skipping background recording');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cameras?username=${username}`);
      if (response.ok) {
        const cameras = await response.json();
        const webcamCameras = cameras.filter(cam => 
          cam.camera_type === 'USB' || 
          cam.camera_type === 'Webcam' || 
          cam.name.toLowerCase().includes('laptop')
        );
        
        if (webcamCameras.length === 0) {
          console.log('⚠️ No webcam cameras found in database, skipping background recording');
          console.log('ℹ️ Add a laptop camera from Camera Management to enable recording');
          return;
        }
        
        // Use specific camera ID if provided, otherwise use first webcam
        if (specificCameraId) {
          const camera = webcamCameras.find(c => c.id === specificCameraId);
          this.cameraId = camera ? camera.id : webcamCameras[0].id;
        } else {
          this.cameraId = webcamCameras[0].id;
        }
        console.log(`✅ Found ${webcamCameras.length} webcam camera(s), using camera ID: ${this.cameraId}`);
      }
      
      console.log('📍 Requesting camera access...');
      
      // Get camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('✅ Camera access granted for background recording');
      console.log('📍 Camera stream:', this.stream);
      
      // Update camera status to online
      await this.updateCameraStatus('online');
      
      // Start recording after short delay
      console.log('📍 Starting recording in 1 second...');
      setTimeout(() => {
        this.startRecording();
      }, 1000);

      this.isInitialized = true;
      console.log('✅ Background recording service initialized');

      // Handle page visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange);

      // Handle page unload
      window.addEventListener('beforeunload', this.stop.bind(this));

    } catch (error) {
      console.error('❌ Failed to start background recording:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      throw error;
    }
  }



  /**
   * Start recording
   */
  startRecording() {
    if (!this.stream || this.isRecording) {
      return;
    }

    try {
      // Try VP9 codec first, fallback to VP8
      let options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 2500000 };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2500000 };
        
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm', videoBitsPerSecond: 2500000 };
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('📹 Recording segment complete, uploading...');
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        await this.uploadVideo(blob);
        
        // Clear chunks
        this.chunks = [];
        
        // Auto-restart recording ONLY if still recording (not manually stopped)
        if (this.stream && this.isInitialized && this.isRecording) {
          console.log('🔄 Restarting recording for next segment...');
          setTimeout(() => {
            this.startRecording();
          }, 500);
        }
      };

      // Start recording with timeslice to prevent data loss
      this.mediaRecorder.start(1000);
      this.isRecording = true;

      console.log('🔴 Background recording started - continuous recording (2-minute segments)');

      // Update recording time counter
      this.recordingInterval = setInterval(() => {
        this.recordingTime++;
      }, 1000);

      // Auto-stop and restart every 2 minutes to create manageable segments
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          console.log('⏱️ 2 minutes reached, creating new segment...');
          this.mediaRecorder.stop(); // This will trigger onstop which restarts recording
        }
      }, 2 * 60 * 1000); // 2 minutes

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
    }
  }

  /**
   * Stop current recording segment (user clicked stop)
   */
  stopRecordingSegment() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
    }
  }

  /**
   * Upload video to backend
   */
  async uploadVideo(blob) {
    try {
      // Get username from localStorage
      const username = localStorage.getItem('username');
      
      if (!username) {
        console.error('❌ Username not found in localStorage');
        return;
      }
      
      const formData = new FormData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      formData.append('video', blob, `background_recording_${timestamp}.webm`);
      formData.append('username', username);  // Add username to form data
      
      // Add camera_id if available
      if (this.cameraId) {
        formData.append('camera_id', this.cameraId);
        console.log(`📤 Uploading recording for camera ID: ${this.cameraId}`);
      }

      const response = await fetch('http://localhost:5000/api/recordings/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Background recording uploaded for user ${username}:`, result.filename);
      } else {
        console.error('❌ Failed to upload recording');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
    }
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('📱 Tab hidden - background recording continues');
    } else {
      console.log('📱 Tab visible - background recording still active');
    }
  }

  /**
   * Pause recording (stop current segment and save)
   */
  async pauseRecording() {
    console.log('⏸️ Pausing background recording...');

    if (!this.isRecording) {
      console.log('⚠️ Recording is not active');
      return;
    }

    // Stop recording and save current segment
    this.stopRecordingSegment();

    // Clear recording timer
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    this.isRecording = false;

    // Update camera status to offline
    await this.updateCameraStatus('offline');

    console.log('✅ Recording paused');
  }

  /**
   * Resume recording
   */
  async resumeRecording() {
    console.log('▶️ Resuming background recording...');

    if (!this.isInitialized) {
      console.log('⚠️ Service not initialized');
      return;
    }

    if (this.isRecording) {
      console.log('⚠️ Recording already active');
      return;
    }

    // Update camera status to online
    await this.updateCameraStatus('online');

    // Start new recording
    this.startRecording();

    console.log('✅ Recording resumed');
  }

  /**
   * Update camera status in backend
   */
  async updateCameraStatus(status) {
    try {
      const username = localStorage.getItem('username') || 'admin';
      
      const response = await fetch('http://localhost:5000/api/cameras/laptop/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          username 
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Camera status updated to ${status}:`, data.cameraName);
      } else {
        console.error('⚠️ Failed to update camera status:', await response.text());
      }
    } catch (error) {
      console.error('⚠️ Error updating camera status:', error);
    }
  }

  /**
   * Stop background recording service
   */
  stop() {
    console.log('⏹️ Stopping background recording service...');

    // Stop recording and save
    if (this.isRecording) {
      this.stopRecordingSegment();
    }

    // Clear interval
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.isInitialized = false;
    this.isRecording = false;
    
    console.log('✅ Background recording service stopped');
  }

  /**
   * Get current recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      recordingTime: this.recordingTime,
      isInitialized: this.isInitialized
    };
  }
}

// Create singleton instance
const backgroundRecordingService = new BackgroundRecordingService();

export default backgroundRecordingService;
