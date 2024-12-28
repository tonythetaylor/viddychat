// frontend/src/components/VideoChat.tsx

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Rnd } from 'react-rnd';

const apiUri = process.env.REACT_APP_API_URI;

const SOCKET_SERVER_URL = 'https://localhost:5005'; // Ensure this is correct and accessible
// const SOCKET_SERVER_URL = apiUri;

interface User {
  socketId: string;
  username: string;
  isAudioOnly: boolean;
  isAudioMuted?: boolean; // Optional Property
}

const VideoChat: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentCall, setCurrentCall] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false); // Audio Only Mode
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(!isAudioOnly); // Video Enabled State
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false); // Audio Mute State

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  // State to determine screen size
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 640);

  useEffect(() => {
    // Function to handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);

    // Initialize Socket.IO connection with secure protocol
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'], // Force WebSocket to prevent polling issues
      secure: true, // Ensure secure connection
    });

    // Log the SOCKET_SERVER_URL for verification
    console.log('Connecting to Socket.IO server at:', SOCKET_SERVER_URL);

    // Handle connection success
    socketRef.current.on('connect', () => {
      console.log('Successfully connected to Socket.IO server');
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to the server.');
    });

    // Handle 'all-users' event
    socketRef.current.on('all-users', (existingUsers: User[]) => {
      console.log('Received existing users:', existingUsers);
      setUsers(existingUsers);
    });

    // Handle 'user-connected' event
    socketRef.current.on('user-connected', (user: User) => {
      console.log(`Received 'user-connected' for ${user.username} (${user.socketId})`);
      setUsers((prevUsers) => {
        const exists = prevUsers.some((u) => u.socketId === user.socketId);
        if (!exists) {
          console.log(`Adding new user: ${user.username} (${user.socketId})`);
          return [...prevUsers, user];
        }
        console.log(`User already exists: ${user.username} (${user.socketId})`);
        return prevUsers;
      });
    });

    // Handle 'user-disconnected' event
    socketRef.current.on('user-disconnected', (socketId: string) => {
      console.log(`Received 'user-disconnected' for ${socketId}`);
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.filter((user) => user.socketId !== socketId);
        console.log(`Updated users list after disconnection:`, updatedUsers);
        return updatedUsers;
      });
    });

    // Handle signaling events
    socketRef.current.on('offer', handleReceiveOffer);
    socketRef.current.on('answer', handleReceiveAnswer);
    socketRef.current.on('ice-candidate', handleNewICECandidateMsg);

    // Handle renegotiation events
    socketRef.current.on('renegotiate', handleRenegotiate);
    socketRef.current.on('renegotiate-answer', handleRenegotiateAnswer);

    // Handle video toggle events
    socketRef.current.on('video-toggle', handleVideoToggle);

    // Handle audio toggle events
    socketRef.current.on('audio-toggle', handleAudioToggle);

    // Enumerate media devices on mount
    async function fetchDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('Available Media Devices:', devices);
        const videoInput = devices.filter((device) => device.kind === 'videoinput');
        const audioInput = devices.filter((device) => device.kind === 'audioinput');
        setVideoDevices(videoInput);
        setAudioDevices(audioInput);
        if (videoInput.length > 0) setSelectedVideoDevice(videoInput[0].deviceId);
        if (audioInput.length > 0) setSelectedAudioDevice(audioInput[0].deviceId);
      } catch (err) {
        console.error('Error enumerating devices:', err);
        setError('Could not access media devices.');
      }
    }
    fetchDevices();

    // Clean up on unmount
    return () => {
      socketRef.current?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to attach local stream once joined
  useEffect(() => {
    if (isJoined && localStream.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream.current;
      console.log('Local stream attached to video element.');

      // Explicitly play the video
      localVideoRef.current
        .play()
        .then(() => {
          console.log('Local video playback started.');
        })
        .catch((playErr) => {
          console.error('Error playing local video:', playErr);
          setError('Error playing local video.');
        });

      // Log active tracks
      console.log('Local stream has active tracks:', localStream.current.getTracks());
    }
  }, [isJoined]);

  const joinRoom = async () => {
    console.log('joinRoom function called');
    setError(null); // Reset any existing errors

    if (username.trim() === '') {
      console.log('Username is empty');
      setError('Username cannot be empty.');
      return;
    }

    // Determine media constraints based on user selection
    let constraints: MediaStreamConstraints = {
      audio: {
        deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    if (!isAudioOnly) {
      constraints.video = {
        deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
        width: { ideal: isMobile ? 640 : 1280 }, // Adjust width based on device
        height: { ideal: isMobile ? 480 : 720 }, // Adjust height based on device
        frameRate: { ideal: isMobile ? 24 : 30 }, // Adjust frame rate based on device
      };
    }

    console.log('Requesting media with constraints:', constraints);

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Local stream obtained:', localStream.current);

      // If user selected Video + Audio but video is not present, switch to Audio-Only
      if (!isAudioOnly && !localStream.current.getVideoTracks().length) {
        console.warn('No video tracks available. Switching to Audio-Only mode.');
        setIsAudioOnly(true);
        setIsVideoEnabled(false);
      } else {
        setIsVideoEnabled(!isAudioOnly);
      }

      // Set isJoined to true to render video/audio elements
      setIsJoined(true);
      console.log('Set isJoined to true');
    } catch (err: any) {
      console.error('Error accessing media devices.', err);
      if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect the necessary devices.');
      } else if (err.name === 'NotAllowedError') {
        setError('Permission denied. Please allow access to camera and microphone.');
      } else if (err.name === 'OverconstrainedError') {
        setError('The selected camera or microphone is not available.');
      } else {
        setError('Error accessing media devices. Please try again.');
      }
      return;
    }

    // Emit 'join-room' event to backend with audioOnly flag
    socketRef.current?.emit('join-room', username, isAudioOnly);
    console.log(`User joined the room: ${username} | Audio Only: ${isAudioOnly}`);
  };

  const createPeerConnection = (targetSocketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers here if needed
      ],
    });

    console.log('PeerConnection created:', pc);

    // Add local tracks to peer connection
    localStream.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream.current!);
      console.log('Added local track:', track.kind);
    });

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('Remote stream attached to video element.');

        // Check if remote stream has video tracks
        const hasVideo = event.streams[0].getVideoTracks().length > 0;
        if (!hasVideo) {
          remoteVideoRef.current.style.display = 'none'; // Hide video element
          // Optionally, display a placeholder or avatar
          // You can also set a state variable to indicate audio-only
        } else {
          remoteVideoRef.current.style.display = 'block'; // Show video element
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        socketRef.current?.emit('ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate,
          from: socketRef.current?.id,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log('Peer connection disconnected or failed');
        leaveCall();
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log('Signaling state:', pc.signalingState);
    };

    return pc;
  };

  const handleCall = async (user: User) => {
    peerConnection.current = createPeerConnection(user.socketId);
    setCurrentCall(user.socketId);
    console.log(`Initiating call to ${user.username} (${user.socketId})`);

    try {
      // Create offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('Offer created and set as local description:', offer);

      // Send offer to the target user
      socketRef.current?.emit('offer', {
        sdp: offer,
        caller: socketRef.current?.id,
        target: user.socketId,
      });
      console.log('Offer sent to backend:', { sdp: offer, target: user.socketId });
    } catch (err) {
      console.error('Error during call setup:', err);
      setError('Failed to initiate call.');
    }
  };

  const handleReceiveOffer = async (data: any) => {
    const { sdp, caller } = data;
    console.log(`Received offer from ${caller}:`, sdp);

    peerConnection.current = createPeerConnection(caller);
    setCurrentCall(caller);

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log('Remote description set:', sdp);

      // Create answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('Answer created and set as local description:', answer);

      // Send answer back to caller
      socketRef.current?.emit('answer', {
        sdp: answer,
        responder: socketRef.current?.id,
        target: caller,
      });
      console.log('Answer sent to backend:', { sdp: answer, target: caller });
    } catch (err) {
      console.error('Error handling received offer:', err);
      setError('Failed to handle incoming call.');
    }
  };

  const handleReceiveAnswer = async (data: any) => {
    const { sdp } = data;
    console.log('Received answer:', sdp);

    if (peerConnection.current) {
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log('Remote description set from answer:', sdp);
      } catch (err) {
        console.error('Error setting remote description:', err);
        setError('Failed to establish connection with caller.');
      }
    }
  };

  const handleNewICECandidateMsg = async (data: any) => {
    const { candidate } = data;
    console.log('Received ICE candidate:', candidate);

    if (peerConnection.current) {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('ICE candidate added to peer connection');
      } catch (err) {
        console.error('Error adding received ICE candidate', err);
        setError('Failed to add ICE candidate.');
      }
    }
  };

  const handleVideoToggle = (data: { from: string; isVideoEnabled: boolean }) => {
    console.log(`Received video toggle from ${data.from}. Video Enabled: ${data.isVideoEnabled}`);

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.socketId === data.from ? { ...user, isAudioOnly: !data.isVideoEnabled } : user
      )
    );
  };

  const handleAudioToggle = (data: { from: string; isAudioMuted: boolean }) => {
    console.log(`Received audio toggle from ${data.from}. Audio Muted: ${data.isAudioMuted}`);

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.socketId === data.from ? { ...user, isAudioMuted: data.isAudioMuted } : user
      )
    );
  };

  const handleRenegotiate = async (data: { from: string; sdp: RTCSessionDescriptionInit }) => {
    console.log(`Received renegotiation offer from ${data.from}`);

    if (!peerConnection.current) {
      // If no peer connection exists, create one
      peerConnection.current = createPeerConnection(data.from);
      setCurrentCall(data.from);
    }

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      console.log('Remote description set for renegotiation.');

      // Create and send answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('Renegotiation answer created and set.');

      socketRef.current?.emit('renegotiate-answer', {
        target: data.from,
        sdp: answer,
      });
      console.log('Renegotiation answer sent.');
    } catch (err) {
      console.error('Error handling renegotiation offer:', err);
      setError('Failed to handle renegotiation offer.');
    }
  };

  const handleRenegotiateAnswer = async (data: { from: string; sdp: RTCSessionDescriptionInit }) => {
    console.log(`Received renegotiation answer from ${data.from}`);

    if (peerConnection.current) {
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log('Remote description set for renegotiation answer.');
      } catch (err) {
        console.error('Error setting renegotiation answer:', err);
        setError('Failed to set renegotiation answer.');
      }
    }
  };

  const getVideoSender = (pc: RTCPeerConnection): RTCRtpSender | undefined => {
    const senders = pc.getSenders();
    return senders.find((sender) => sender.track?.kind === 'video');
  };

  const renegotiateConnection = async () => {
    if (!peerConnection.current) return;

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('Renegotiation offer created.');

      // Send the renegotiation offer to the peer
      socketRef.current?.emit('renegotiate', {
        target: currentCall,
        sdp: offer,
      });
      console.log('Renegotiation offer sent to peer.');
    } catch (err) {
      console.error('Error during renegotiation:', err);
      setError('Failed to renegotiate the connection.');
    }
  };

  const toggleVideo = async () => {
    if (!peerConnection.current) {
      setError('No active call to toggle video.');
      return;
    }

    if (isVideoEnabled) {
      // **Disable Video**
      const videoSender = getVideoSender(peerConnection.current);
      if (videoSender && videoSender.track) {
        videoSender.track.enabled = false; // Disable the video track
        console.log('Video track disabled.');
        setIsVideoEnabled(false);

        // Emit video toggle event to inform the peer
        socketRef.current?.emit('video-toggle', { target: currentCall, isVideoEnabled: false });
        console.log('Emitted video toggle off event.');

        // Renegotiate the connection to update the peer
        await renegotiateConnection();
      } else {
        console.warn('No video sender found or track is null.');
      }
    } else {
      // **Enable Video**
      try {
        // **1. Obtain the New Video Track**
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        });

        const videoTrack = videoStream.getVideoTracks()[0];

        // **2. Replace or Add the Video Track in Peer Connection**
        const videoSender = getVideoSender(peerConnection.current);
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack); // Replace existing track
          console.log('Video track enabled and replaced.');
        } else {
          // If no video sender exists, add the track
          peerConnection.current.addTrack(videoTrack, videoStream);
          console.log('Video track added.');
        }

        // **3. Add the New Video Track to the Local Stream**
        if (localStream.current) {
          localStream.current.addTrack(videoTrack);
          console.log('New video track added to local stream.');
        } else {
          console.error('Local stream is null.');
          setError('Local media stream is unavailable.');
          return;
        }

        // **4. Update the Local Video Element to Recognize the New Track**
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null; // Reset srcObject
          localVideoRef.current.srcObject = localStream.current; // Reassign the updated stream
          await localVideoRef.current.play(); // Ensure the video plays
          console.log('Local video element updated with new video track.');
        } else {
          console.error('Local video reference is null.');
        }

        // **5. Update State and Emit Event**
        setIsVideoEnabled(true);
        socketRef.current?.emit('video-toggle', { target: currentCall, isVideoEnabled: true });
        console.log('Emitted video toggle on event.');

        // **6. Renegotiate the Connection to Update the Peer**
        await renegotiateConnection();
      } catch (err: any) {
        console.error('Error enabling video:', err);
        setError('Failed to enable video.');
      }
    }
  };

  const toggleAudio = () => {
    if (!localStream.current) {
      setError('Local media stream is unavailable.');
      return;
    }

    // Get all audio tracks
    const audioTracks = localStream.current.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found.');
      setError('No audio tracks available.');
      return;
    }

    // Toggle the enabled property of each audio track
    audioTracks.forEach((track) => {
      track.enabled = isAudioMuted;
    });

    // Update the state
    setIsAudioMuted(!isAudioMuted);

    // Optionally, emit an event to inform peers about the mute status
    socketRef.current?.emit('audio-toggle', { target: currentCall, isAudioMuted: !isAudioMuted });
    console.log(`Emitted audio toggle event. Audio Muted: ${!isAudioMuted}`);
  };

  const leaveCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
      console.log('Peer connection closed');
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
      console.log('Local media stream stopped');
    }
    setCurrentCall(null);
    setIsJoined(false);
    setIsVideoEnabled(!isAudioOnly); // Reset video state based on audio-only mode
    setIsAudioMuted(false); // Reset audio mute state
    setUsers([]); // Clear users list if necessary
    // Optionally notify the server or other users
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {!isJoined ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">Join Video Chat</h2>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div className="mb-4 flex items-center">
              <input
                id="audioOnly"
                type="checkbox"
                checked={isAudioOnly}
                onChange={(e) => setIsAudioOnly(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="audioOnly" className="text-gray-700">
                Audio Only
              </label>
            </div>

            {!isAudioOnly && (
              <div className="mb-4">
                <label htmlFor="camera" className="block text-gray-700 mb-2">
                  Camera
                </label>
                <select
                  id="camera"
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                >
                  {videoDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="microphone" className="block text-gray-700 mb-2">
                Microphone
              </label>
              <select
                id="microphone"
                value={selectedAudioDevice}
                onChange={(e) => setSelectedAudioDevice(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              >
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={joinRoom}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
            >
              Join
            </button>

            {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="w-screen h-screen bg-black relative">
          {/* **Remote Video as Full-Screen Background** */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false} // Ensure remote video is not muted
            className="w-full h-full object-cover"
          />

          {/* **Local Video as Draggable and Resizable Box** */}
          {/* On mobile, make it fixed and non-resizable/draggable */}
          {!isMobile || isMobile ? (
            <Rnd
              default={{
                x: 20,
                y: 20,
                width: 200,
                height: 150,
              }}
              minWidth={150}
              minHeight={100}
              bounds="parent"
              className="z-50"
              style={{
                border: '2px solid #4A90E2',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#000',
              }}
            >
              {!isAudioOnly && isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-800">
                  <p className="text-white">Audio Only</p>
                </div>
              )}
            </Rnd>
          ) : (
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-black bg-opacity-70 rounded-lg overflow-hidden">
              {!isAudioOnly && isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <p className="text-white text-sm">Audio Only</p>
                </div>
              )}
            </div>
          )}

          {/* **Controls Overlay** */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
            {/* Video Toggle Button */}
            <button
              onClick={toggleVideo}
              aria-label={isVideoEnabled ? 'Turn Video Off' : 'Turn Video On'}
              className={`flex items-center px-4 py-2 rounded-md focus:outline-none transition duration-200 ${
                isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } text-white text-sm md:text-base`}
            >
              {isVideoEnabled ? (
                <>
                  {/* **Turn Video Off Icon** */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L15.657 12l1.171 1.172a4 4 0 01-5.656 5.656L10 17.657l-1.172 1.171a4 4 0 01-5.656-5.656L4.343 12l-1.171-1.172a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Turn Video Off</span>
                </>
              ) : (
                <>
                  {/* **Turn Video On Icon** */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4 5a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                    <path
                      fillRule="evenodd"
                      d="M10 13a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Turn Video On</span>
                </>
              )}
            </button>

            {/* Audio Toggle Button */}
            <button
              onClick={toggleAudio}
              aria-label={isAudioMuted ? 'Unmute' : 'Mute'}
              className={`flex items-center px-4 py-2 rounded-md focus:outline-none transition duration-200 ${
                isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } text-white text-sm md:text-base`}
            >
              {isAudioMuted ? (
                <>
                  {/* **Unmute Icon** */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3a1 1 0 011 1v4a1 1 0 11-2 0V4a1 1 0 011-1z" />
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Unmute</span>
                </>
              ) : (
                <>
                  {/* **Mute Icon** */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 4a1 1 0 00-1 1v10a1 1 0 002 0V5a1 1 0 00-1-1z" />
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Mute</span>
                </>
              )}
            </button>
          </div>

          {/* **Online Users List** */}
          {!isMobile && (
            <div className="absolute top-4 left-4 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              <h3 className="text-lg font-medium mb-2">Online Users</h3>
              {users.length === 0 ? (
                <p className="text-gray-600">No other users online.</p>
              ) : (
                <ul className="space-y-3">
                  {users.map((user) => (
                    <li
                      key={user.socketId}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-gray-800">{user.username}</span>
                          {user.isAudioOnly ? (
                            <span className="ml-2 text-sm text-red-500">(Audio Only)</span>
                          ) : (
                            <span className="ml-2 text-sm text-green-500">(Video)</span>
                          )}
                          {user.isAudioMuted && (
                            <span className="ml-2 text-sm text-yellow-500">(Muted)</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCall(user)}
                        className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 transition duration-200 text-xs md:text-sm"
                      >
                        Call
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* **Mobile Users List Toggle** */}
          {isMobile && (
            <div className="absolute top-4 right-4">
              <details className="group">
                <summary className="cursor-pointer bg-white bg-opacity-80 p-2 rounded-full shadow-md">
                  {/* **Users Icon** */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a10 10 0 00-22 0v2h5m14-4a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </summary>
                <div className="mt-2 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <h3 className="text-lg font-medium mb-2">Online Users</h3>
                  {users.length === 0 ? (
                    <p className="text-gray-600">No other users online.</p>
                  ) : (
                    <ul className="space-y-3">
                      {users.map((user) => (
                        <li
                          key={user.socketId}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-gray-800 text-sm">{user.username}</span>
                              {user.isAudioOnly ? (
                                <span className="ml-1 text-xs text-red-500">(Audio Only)</span>
                              ) : (
                                <span className="ml-1 text-xs text-green-500">(Video)</span>
                              )}
                              {user.isAudioMuted && (
                                <span className="ml-1 text-xs text-yellow-500">(Muted)</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCall(user)}
                            className="bg-green-500 text-white py-0.5 px-2 rounded-md hover:bg-green-600 transition duration-200 text-xs"
                          >
                            Call
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* **Error Message** */}
          {error && (
            <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-red-500 text-center">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoChat;