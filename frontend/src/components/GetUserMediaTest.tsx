import React, { useEffect, useRef, useState } from 'react';

const GetUserMediaTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Local stream attached to video element');
        }
      } catch (err: any) {
        console.error('Error accessing media devices.', err);
        if (err.name === 'NotFoundError') {
          setError('No camera or microphone found. Please connect the necessary devices.');
        } else if (err.name === 'NotAllowedError') {
          setError('Permission denied. Please allow access to camera and microphone.');
        } else {
          setError('Error accessing media devices. Please try again.');
        }
      }
    };

    getMedia();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl mb-4">getUserMedia Test</h1>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <video ref={videoRef} autoPlay playsInline className="w-1/2 h-auto bg-black" />
      )}
    </div>
  );
};

export default GetUserMediaTest;