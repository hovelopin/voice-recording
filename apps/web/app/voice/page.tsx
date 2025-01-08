'use client';

import AudioRecorder from "./_components/audio-recorder";

export default function Voice(){
  const handleRecordingComplete = (blob: Blob) => {
    console.log('Recording completed:', blob);
  };

  return (
    <div>
      <h1>Voice Recorder</h1>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}