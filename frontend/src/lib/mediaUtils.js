/**
 * Media permission utility functions
 */

/**
 * Check if the user has granted media permissions
 * @param {object} options - Options for the media devices
 * @param {boolean} options.video - Whether to check for video permissions
 * @param {boolean} options.audio - Whether to check for audio permissions
 * @returns {Promise<object>} - Returns a promise that resolves with the stream if successful
 */
export const checkMediaPermissions = async ({ video = true, audio = true }) => {
  try {
    // Request permissions
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video, 
      audio 
    });
    
    return {
      success: true,
      stream,
      hasAudio: audio,
      hasVideo: video
    };
  } catch (error) {
    console.error('Media permissions error:', error);
    
    // Handle different error types
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Permission denied',
        message: 'Camera/microphone access was denied. Please allow access and try again.',
        type: 'permission'
      };
    } else if (error.name === 'NotFoundError') {
      return {
        success: false,
        error: 'Device not found',
        message: 'Camera or microphone not found. Please check your devices and try again.',
        type: 'hardware'
      };
    } else if (error.name === 'NotReadableError') {
      return {
        success: false,
        error: 'Hardware error',
        message: 'Could not access your camera/microphone due to a hardware error.',
        type: 'hardware'
      };
    } else if (error.name === 'OverconstrainedError') {
      return {
        success: false,
        error: 'Constraints error',
        message: 'The requested media settings are not available on your device.',
        type: 'constraints'
      };
    } else {
      return {
        success: false,
        error: 'Unknown error',
        message: `An unexpected error occurred: ${error.message}`,
        type: 'unknown'
      };
    }
  }
};

/**
 * Helper function to safely stop all tracks in a stream
 * @param {MediaStream} stream - The media stream to stop
 */
export const stopMediaTracks = (stream) => {
  if (!stream) return;
  
  try {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  } catch (error) {
    console.error('Error stopping media tracks:', error);
  }
};

/**
 * Check if a device has specific media capabilities
 * @returns {Promise<object>} - Device capabilities information
 */
export const checkDeviceCapabilities = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return {
        hasCamera: false,
        hasMicrophone: false,
        supported: false
      };
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    const hasMicrophone = devices.some(device => device.kind === 'audioinput');
    
    return {
      hasCamera,
      hasMicrophone,
      supported: true
    };
  } catch (error) {
    console.error('Error checking device capabilities:', error);
    return {
      hasCamera: false,
      hasMicrophone: false,
      supported: false,
      error: error.message
    };
  }
};
