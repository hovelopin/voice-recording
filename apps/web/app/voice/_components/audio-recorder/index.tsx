import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Play, Download } from 'lucide-react';
import styles from './AudioRecorder.module.css';

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

// 커스텀 훅: 음성 녹음 로직 (이전과 동일)
const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  const getBlob = useCallback(() => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: 'audio/webm' });
  }, []);

  return {
    isRecording,
    audioUrl,
    startRecording,
    stopRecording,
    getBlob
  };
};

const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const { isRecording, audioUrl, startRecording, stopRecording, getBlob } = useAudioRecorder();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    const blob = getBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.webm';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            className={styles.recordButton}
            aria-label="Start Recording"
          >
            <Mic className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className={styles.stopButton}
            aria-label="Stop Recording"
          >
            <Square className="w-6 h-6" />
          </button>
        )}
        
        {audioUrl && (
          <>
            <button
              onClick={handlePlayPause}
              className={styles.playButton}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <Play className="w-6 h-6" />
            </button>
            <button
              onClick={handleDownload}
              className={styles.downloadButton}
              aria-label="Download Recording"
            >
              <Download className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className={styles.audioPlayer}
          controls
        />
      )}

      <p className={styles.statusText}>
        {isRecording ? 'Recording...' : 'Click the microphone to start recording'}
      </p>
    </div>
  );
};

export default AudioRecorder;