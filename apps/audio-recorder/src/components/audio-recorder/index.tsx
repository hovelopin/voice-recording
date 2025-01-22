import { useState, useRef, useCallback } from "react";
import { Mic, Square, Play, Download, FastForward } from "lucide-react";
import styles from "./AudioRecorder.module.css";

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

const useAudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
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
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  const getBlob = useCallback(() => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: "audio/wav" });
  }, []);

  return {
    isRecording,
    audioUrl,
    startRecording,
    stopRecording,
    getBlob,
  };
};

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
}) => {
  const { isRecording, audioUrl, startRecording, stopRecording, getBlob } =
    useAudioRecorder({
      onRecordingComplete,
    });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // milliseconds를 초 단위로 변환하는 함수
  const msToSeconds = (ms: number) => ms / 1000;

  // 오디오 재생 위치 이동 함수
  const jumpToTime = (milliseconds: number) => {
    console.log("seconds", milliseconds);

    if (audioRef.current) {
      audioRef.current.currentTime = msToSeconds(milliseconds);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

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
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.wav";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = ms / 1000;
    return seconds.toFixed(3) + "초";
  };

  // 특정 시간으로 이동하는 컴포넌트!
  const TimeJumpButtons = () => (
    <div className={styles.timeJumpGroup}>
      {[500, 750, 1000, 4000].map((ms) => (
        <button
          key={ms}
          onClick={() => jumpToTime(ms)}
          className={styles.timeJumpButton}
          aria-label={`Jump to ${formatTime(ms)}`}
        >
          <FastForward />
          {formatTime(ms)}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            className={styles.recordButton}
            aria-label="Start Recording"
          >
            <Mic />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className={styles.stopButton}
            aria-label="Stop Recording"
          >
            <Square />
          </button>
        )}

        {audioUrl && (
          <>
            <button
              onClick={handlePlayPause}
              className={styles.playButton}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <Play />
            </button>
            <button
              onClick={handleDownload}
              className={styles.downloadButton}
              aria-label="Download Recording"
            >
              <Download />
            </button>
          </>
        )}
      </div>

      {audioUrl && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className={styles.audioPlayer}
            controls
          />

          <TimeJumpButtons />
        </>
      )}

      <p className={styles.statusText}>
        {isRecording ? "녹음중입니다." : "마이크를 눌러서 시작해주세요."}
      </p>
    </div>
  );
};

export default AudioRecorder;
