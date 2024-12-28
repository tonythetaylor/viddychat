// frontend/src/App.tsx

import React from 'react';
import VideoChat from './components/VideoChat';
import GetUserMediaTest from './components/GetUserMediaTest';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <VideoChat />
      {/* <GetUserMediaTest />; */}
    </div>
  );
};

export default App;