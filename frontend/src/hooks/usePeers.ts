// frontend/src/hooks/usePeers.ts

import { useState } from 'react';

interface PeerConnection {
  peer: RTCPeerConnection;
  username: string;
  isAudioOnly: boolean;
  stream: MediaStream;
}

const usePeers = () => {
  const [peers, setPeers] = useState<{ [socketId: string]: PeerConnection }>({});

  const addPeer = (socketId: string, peerConnection: PeerConnection) => {
    setPeers((prevPeers) => ({
      ...prevPeers,
      [socketId]: peerConnection,
    }));
  };

  const removePeer = (socketId: string) => {
    setPeers((prevPeers) => {
      const updatedPeers = { ...prevPeers };
      delete updatedPeers[socketId];
      return updatedPeers;
    });
  };

  return { peers, addPeer, removePeer };
};

export default usePeers;