'use client';

import { useEffect } from 'react';
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer';

export default function ReactVoiceVisualizer() {
  const recorderControls = useVoiceVisualizer();

  const { recordedBlob, error } = recorderControls;

  // Get the recorded audio blob
  useEffect(() => {
    if (!recordedBlob) return;

    console.log(recordedBlob);
  }, [recordedBlob, error]);

  // Get the error when it occurs
  useEffect(() => {
    if (!error) return;

    console.error(error);
  }, [error]);

  return <VoiceVisualizer controls={recorderControls} fullscreen speed={1} gap={1} barWidth={6} />;
}
