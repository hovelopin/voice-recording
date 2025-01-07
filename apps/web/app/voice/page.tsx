'use client';

import AudioRecorder from "./_components/audio-recorder";

export default function Voice(){
  const handleRecordingComplete = (blob: Blob) => {
    // 여기서 녹음된 파일을 처리할 수 있습니다
    // 예: API로 전송, 저장 등
    console.log('Recording completed:', blob);
  };

  return (
    <div>
      <h1>Voice Recorder</h1>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}