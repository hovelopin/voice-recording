'use client';

import { type FC } from 'react';
import AudioRecorder from './_components/audio-recorder';

const Voice: FC = () => {
  const handleRecordingComplete = (blob: Blob) => {
    console.log('Recording completed:', blob);
  };

  return (
    <div>
      <h1>Voice Recorder</h1>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
};

export default Voice;
