import React, { useState, useRef, useEffect } from 'react';
import { postService } from '../services/api';

const CreatePostModal = ({ onPostCreated }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Get available cameras on mount
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setCameraList(cameras);
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    };
    getCameras();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async (cameraIndex = 0) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: cameraList.length > 0 ? {
          deviceId: { exact: cameraList[cameraIndex].deviceId }
        } : { facingMode: 'environment' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraActive(true);
      setCurrentCameraIndex(cameraIndex);
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Error accessing camera:', err);
    }
  };

  const switchCamera = () => {
    if (cameraList.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameraList.length;
    startCamera(nextIndex);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvasRef.current.toDataURL('image/jpeg');
      processImage(base64);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const processImage = (base64String) => {
    setImageUrl(base64String);
    setImagePreview(base64String);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!imageUrl) {
      setError('Please select or capture an image');
      return;
    }

    try {
      setLoading(true);
      const response = await postService.createPost(imageUrl, caption);
      onPostCreated(response.data.post);

      // Reset form
      setImageUrl('');
      setCaption('');
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Close modal
      const modal = document.getElementById('createPostModal');
      const bsModal = new (window.bootstrap).Modal(modal);
      bsModal.hide();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="createPostModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header border-bottom">
            <h5 className="modal-title">Share Your Shit</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={() => stopCamera()}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger mb-3">{error}</div>
              )}

              {cameraActive && (
                <div style={{ marginBottom: '1rem' }}>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#0095f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-camera-fill"></i> Capture
                    </button>
                    {cameraList.length > 1 && (
                      <button
                        type="button"
                        onClick={switchCamera}
                        style={{
                          padding: '0.75rem 1rem',
                          background: '#f0f0f0',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                        title="Switch camera"
                      >
                        <i className="bi bi-arrow-repeat"></i>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={stopCamera}
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              )}

              {!imagePreview && !cameraActive && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: '2px solid #0095f6',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderRadius: '4px',
                      color: '#0095f6',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-cloud-upload" style={{ fontSize: '1.5rem' }}></i>
                    Upload File
                  </button>
                </div>
              )}

              {imagePreview && !cameraActive && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageUrl('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    marginBottom: '1rem',
                    background: '#f0f0f0',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    borderRadius: '4px'
                  }}
                >
                  Change Photo
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxHeight: '300px',
                    width: '100%',
                    objectFit: 'cover',
                    marginBottom: '1rem',
                    borderRadius: '4px'
                  }}
                />
              )}

              <div style={{ marginTop: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer border-top">
              <button
                type="button"
                style={{
                  padding: '0.6rem 1.5rem',
                  border: '1px solid #ccc',
                  background: 'white',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
                data-bs-dismiss="modal"
                onClick={() => stopCamera()}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1.5rem',
                  border: 'none',
                  background: imageUrl && !loading ? '#0095f6' : '#ccc',
                  color: 'white',
                  cursor: imageUrl && !loading ? 'pointer' : 'not-allowed',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}
                disabled={loading || !imageUrl}
              >
                {loading ? 'Posting...' : 'Share'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
