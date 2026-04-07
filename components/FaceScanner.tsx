'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  onSuccess: (descriptor: number[]) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export default function FaceScanner({ mode, onSuccess, onCancel, onError }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [statusText, setStatusText] = useState('Loading AI Models...');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
        setStatusText('Starting Camera...');
      } catch (err: any) {
        console.error('Model load error:', err);
        const msg = 'Waa lagu guuldareystay in la soo dejiyo AI models.';
        setErrorMsg(msg);
        if (onError) onError(msg);
      }
    };
    loadModels();
    
    return () => stopCamera();
  }, []);

  // Start Camera after models load
  useEffect(() => {
    if (isModelLoaded) {
      startCamera();
    }
  }, [isModelLoaded]);

  const startCamera = async () => {
    try {
      // Step 1: Check if hardware exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Browser-kaani ma taageerayo Kaamirada ama ma ahan Secure Context.');
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw { name: 'NotFoundError', message: 'Hardware camera not found' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let msg = 'Fadlan oggolow (Allow) in kaamirada la isticmaalo.';
      if (err.name === 'NotFoundError' || err.message.includes('Hardware camera not found') || err.message.includes('Requested device not found')) {
        msg = 'Lama helin wax Kaamiro ah oo Computer-kan ku xiran. Windows-kaaga ama Hardware-kaaga ayaa xiray Camera-da.';
      } else if (err.name === 'NotReadableError' || err.message.includes('Could not start video source')) {
        msg = 'Kaamirada waxaa isticmaalaya barnaamij kale (sida Zoom/Skype) ama way xumaatay.';
      } else if (err.name === 'NotAllowedError') {
        msg = 'Kaamirada waa la xiray (Blocked). Fadlan ka ogolow Browser-ka.';
      } else {
        msg = `Cillad Camera: ${err.message || err.name}`;
      }
      setErrorMsg(msg);
      if (onError) onError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const handleVideoPlay = () => {
    setIsCameraActive(true);
    setStatusText(mode === 'enroll' ? 'Wajiga si toos ah u soo fiiri...' : 'Scanning Face...');
    
    // Start scanning interval
    scanIntervalRef.current = setInterval(scanFace, 500);
  };

  const scanFace = async () => {
    if (!videoRef.current || !canvasRef.current || success) return;

    try {
      const detections = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      if (detections) {
        // Draw box
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        
        // Face found and descriptor extracted
        setStatusText('Wajiga waa la gartay!');
        setSuccess(true);
        stopCamera();
        
        // Convert Float32Array to standard array
        const descriptorArray = Array.from(detections.descriptor);
        onSuccess(descriptorArray);
        
      } else {
        // Clear canvas if no face
        canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setStatusText('No face detected. Fadlan wajiga soo qabo.');
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md mx-auto border border-gray-100 dark:border-gray-700">
      
      <div className="mb-6 text-center">
        <div className="bg-primary/10 text-primary p-4 rounded-full inline-block mb-3">
           <Camera size={32} />
        </div>
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">
          {mode === 'enroll' ? 'Face ID Diiwaangelin' : 'Face ID Verification'}
        </h3>
        <p className="text-mediumGray dark:text-gray-400 mt-1">{statusText}</p>
      </div>

      {!errorMsg ? (
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner mb-6 flex items-center justify-center">
          {!isCameraActive && !success && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white z-10">
                <RefreshCw className="animate-spin mb-2" size={24} />
                <span className="text-sm">Isu diyaarinta Kaamirada...</span>
             </div>
          )}
          
          {success && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600 text-white z-20 animate-fade-in">
                <CheckCircle size={48} className="mb-2" />
                <span className="font-bold text-lg">Guul! Tallaabada Xigta...</span>
             </div>
          )}

          <video 
            ref={videoRef} 
            onPlay={handleVideoPlay}
            autoPlay
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 p-8 rounded-2xl text-center mb-6 border border-red-200 dark:border-red-800">
           <AlertCircle size={48} className="mb-4 text-red-500" />
           <span className="font-black text-xl mb-3">{errorMsg}</span>
           <div className="bg-white/50 dark:bg-black/20 p-5 rounded-xl mb-6 shadow-sm text-left">
             <p className="text-sm font-medium leading-relaxed">
               1. Kaamiradaada waa la xiray (Blocked). <br/><br/>
               2. Fadlan eeg dhanka <strong>Midig ee sare</strong> ee ciwaanka browser-ka (URL bar). <br/><br/>
               3. Guji calaamadda kamarada 📸❌, dooro <strong>"Always allow"</strong> kadibna taabo badhanka hoose.
             </p>
           </div>
           <button 
             onClick={() => { setErrorMsg(''); startCamera(); }} 
             className="bg-red-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2"
           >
             <RefreshCw size={20} />
             Isku Day Markale
           </button>
        </div>
      )}

      {onCancel && !success && (
        <button 
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="w-full py-3 text-mediumGray hover:text-darkGray dark:hover:text-white font-semibold transition-colors"
        >
          Cancel
        </button>
      )}

    </div>
  );
}
