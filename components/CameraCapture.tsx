'use client';

import { useEffect, useRef, useState } from 'react';

type CameraCaptureProps = {
  onCapture: (file: File) => void;
  label?: string;
};

export default function CameraCapture({ onCapture, label = 'Open Camera' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play();
    }
  }, [isOpen]);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported by this browser.');
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setIsOpen(true);
    } catch {
      setError('Camera permission was denied or the camera is unavailable.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      closeCamera();
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="space-y-2">
      {!isOpen ? (
        <button type="button" onClick={openCamera} className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
          {label}
        </button>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-900 p-2">
          <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-md object-cover" />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={capturePhoto} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Capture Photo
            </button>
            <button type="button" onClick={closeCamera} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
