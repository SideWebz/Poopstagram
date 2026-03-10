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
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.warn('Camera API not supported');
          return;
        }
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
    <div className="modal fade" id="createPostModal" tabIndex="-1" style={{ backdropFilter: 'blur(10px)' }}>
      <div className="modal-dialog" style={{ maxWidth: '600px' }}>
        <div className="modal-content" style={{ borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
          <div className="modal-header" style={{ 
            borderBottom: '1px solid var(--border)',
            padding: '1.25rem',
            background: 'white'
          }}>
            <h5 className="modal-title" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
              <i className="bi bi-plus-circle-fill" style={{ marginRight: '0.75rem', color: 'var(--accent)' }}></i>
              Share Your Shit
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={() => stopCamera()}
              style={{ fontSize: '1.2rem' }}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {error && (
                <div className="alert alert-danger mb-3" style={{ 
                  borderRadius: '6px',
                  border: '1px solid #ff6b6b'
                }}>
                  <i className="bi bi-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
                  {error}
                </div>
              )}

              {cameraActive && (
                <div style={{ marginBottom: '1rem' }}>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      maxHeight: '400px',
                      backgroundColor: '#000',
                      display: 'block'
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <i className="bi bi-camera-fill" style={{ marginRight: '0.5rem' }}></i>
                      Capture
                    </button>
                    {cameraList.length > 1 && (
                      <button
                        type="button"
                        onClick={switchCamera}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.3s'
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
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s'
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
                  flexDirection: 'column',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '2rem',
                      border: '2px dashed var(--accent)',
                      background: 'linear-gradient(135deg, rgba(10, 124, 255, 0.05) 0%, rgba(9, 101, 210, 0.05) 100%)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderRadius: '8px',
                      color: 'var(--accent)',
                      fontWeight: '600',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(10, 124, 255, 0.10)'}
                    onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, rgba(10, 124, 255, 0.05) 0%, rgba(9, 101, 210, 0.05) 100%)'}
                  >
                    <i className="bi bi-cloud-upload" style={{ fontSize: '2rem' }}></i>
                    <span>Upload Photo</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>or drag and drop</span>
                  </button>
                </div>
              )}

              {!imagePreview && !cameraActive && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    style={{
                      flex: 1,
                      padding: '0.85rem 1rem',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <i className="bi bi-camera" style={{ marginRight: '0.5rem' }}></i>
                    Take Photo
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
                    padding: '0.65rem',
                    marginBottom: '1rem',
                    background: '#f5f5f5',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    transition: 'all 0.3s'
                  }}
                >
                  <i className="bi bi-arrow-clockwise" style={{ marginRight: '0.5rem' }}></i>
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
                    maxHeight: '350px',
                    width: '100%',
                    objectFit: 'cover',
                    marginBottom: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
              )}

              {imagePreview && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    fontSize: '0.95rem',
                    color: 'var(--text)'
                  }}>
                    Write a caption... <span style={{ color: 'var(--text-light)', fontWeight: '400' }}>(optional)</span>
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Tell us about your shit..."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      minHeight: '100px',
                      resize: 'vertical',
                      color: 'var(--text)',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                    {caption.length} / 500 characters
                  </div>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="modal-footer" style={{
                borderTop: '1px solid var(--border)',
                padding: '1rem',
                background: '#f5f5f5',
                borderRadius: '0 0 12px 12px'
              }}>
                <button
                  type="button"
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--border)',
                    background: 'white',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}
                  data-bs-dismiss="modal"
                  onClick={() => stopCamera()}
                >
                  <i className="bi bi-x-lg" style={{ marginRight: '0.5rem' }}></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 2rem',
                    border: 'none',
                    background: imageUrl && !loading ? 'linear-gradient(135deg, var(--accent) 0%, #0965d2 100%)' : 'var(--text-light)',
                    color: 'white',
                    cursor: imageUrl && !loading ? 'pointer' : 'not-allowed',
                    borderRadius: '6px',
                    fontWeight: '600',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  disabled={loading || !imageUrl}
                >
                  {loading ? (
                    <>
                      <i className="bi bi-hourglass-split" style={{ marginRight: '0.5rem' }}></i>
                      Posting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill" style={{ marginRight: '0.5rem' }}></i>
                      Share
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
