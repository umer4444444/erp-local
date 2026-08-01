import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { motion } from 'framer-motion';
import { Camera, X, Check, Loader } from 'lucide-react';

const FaceScanner = ({ onCapture, onClose, mode = 'register', referenceDescriptor = null }) => {
  const videoRef = useRef(null);
  const [loadingMsg, setLoadingMsg] = useState('Loading Models...');
  const [error, setError] = useState('');
  const [matchStatus, setMatchStatus] = useState(null); // 'match', 'no_match'
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        setLoadingMsg('Loading AI Models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

        if (!mounted) return;
        setLoadingMsg('Starting Camera...');
        startCamera();
      } catch (err) {
        console.error('Model load error:', err);
        if (mounted) setError('Failed to load face-api models. Please ensure they are in public/models.');
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (mounted) setLoadingMsg('');
      } catch (err) {
        console.error('Camera error:', err);
        if (mounted) setError('Could not access webcam.');
      }
    };

    loadModels();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    if (!videoRef.current) return;
    setLoadingMsg('Scanning...');
    setError('');

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setLoadingMsg('');
        setError('No face detected. Please look clearly at the camera.');
        return;
      }

      // Generate a tiny data url for the photoUrl just for auditing
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const photoUrl = canvas.toDataURL('image/jpeg', 0.5);

      if (mode === 'register') {
        // Return descriptor as array
        onCapture(Array.from(detection.descriptor));
        return;
      }

      if (mode === 'verify') {
        if (!referenceDescriptor) {
          setError('No reference descriptor provided for verification.');
          setLoadingMsg('');
          return;
        }

        const refArr = new Float32Array(JSON.parse(referenceDescriptor));
        const distance = faceapi.euclideanDistance(detection.descriptor, refArr);

        if (distance < 0.55) {
          setMatchStatus('match');
          setTimeout(() => {
            onCapture(true, photoUrl);
          }, 1500);
        } else {
          setMatchStatus('no_match');
          setError(`Face does not match records. (Dist: ${distance.toFixed(2)})`);
          setLoadingMsg('');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error during scan.');
      setLoadingMsg('');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.9)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'white', padding: 24, borderRadius: 24, width: '100%', maxWidth: 400,
          display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={24} color="#64748b" />
        </button>

        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 800 }}>
          {mode === 'register' ? 'Register Face' : 'Verify Face'}
        </h3>

        <div style={{ 
          width: 300, height: 300, background: '#0f172a', borderRadius: 150, 
          overflow: 'hidden', position: 'relative', marginBottom: 20,
          border: matchStatus === 'match' ? '6px solid #10b981' : matchStatus === 'no_match' ? '6px solid #ef4444' : '6px solid #e2e8f0'
        }}>
          {loadingMsg && !matchStatus && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.5)', zIndex: 10, flexDirection: 'column', gap: 10 }}>
              <Loader size={24} className="animate-spin" />
              <div style={{ fontSize: 14, fontWeight: 600 }}>{loadingMsg}</div>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
          />

          {matchStatus === 'match' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.8)', color: 'white' }}>
              <Check size={64} />
            </div>
          )}
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

        <button 
          onClick={handleScan}
          disabled={!!loadingMsg && loadingMsg !== 'Scanning...'}
          style={{ 
            width: '100%', padding: 16, borderRadius: 16, border: 'none',
            background: '#0a84ff', color: 'white', fontWeight: 800, fontSize: 16,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <Camera size={20} />
          {mode === 'register' ? 'Capture Face' : 'Verify & Clock In'}
        </button>

      </motion.div>
    </div>
  );
};

export default FaceScanner;
