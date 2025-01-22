import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Play, Download, FastForward, Pause } from "lucide-react";
import styles from "./AudioRecorder.module.css";

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

const useAudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  // 타이머 시작 함수
  const startTimer = useCallback(() => {
    if (intervalRef.current) return;

    // 0.1초마다 recordingTime을 0.1초씩 증가
    intervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 0.1);
    }, 100);
  }, []);

  // 타이머 정지 함수
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Blob 파일의 재생 시간을 체크하는 함수
  const checkAudioDuration = (blob: Blob) => {
    return new Promise((resolve, reject) => {
      // Blob을 ArrayBuffer로 변환
      const reader = new FileReader();
      reader.onload = function () {
        const arrayBuffer = reader.result as ArrayBuffer;
        const audioContext = new AudioContext();

        // ArrayBuffer를 오디오 데이터로 디코딩
        audioContext.decodeAudioData(
          arrayBuffer,
          function (buffer) {
            // 오디오의 길이(초 단위) 반환
            console.log("buffer.duration", buffer.duration);
            setAudioDuration(buffer.duration);
            resolve(buffer.duration);
          },
          function (error) {
            reject("Audio decoding failed: " + error);
          }
        );
      };

      reader.onerror = function (error) {
        reject("File reading failed: " + error);
      };

      reader.readAsArrayBuffer(blob); // Blob을 ArrayBuffer로 읽기
    });
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/mp4" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // 녹음이 완료되면 Blob 파일의 길이 체크
        checkAudioDuration(blob);
        onRecordingComplete?.(blob);

        // 스트림 정리
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setAudioDuration(null);
      setRecordingTime(0); // 타이머 초기화
      startTimer(); // 타이머 시작
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [onRecordingComplete]);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer(); // 타이머 재시작
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      setIsPaused(false);
      stopTimer(); // 타이머 정지
      setRecordingTime(0); // 타이머 초기화
    }
  }, [isRecording]);

  // 페이지 가시성 변화 감지
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.hidden && isRecording && !isPaused) {
  //       // 페이지가 숨겨질 때 (전화가 왔을 때 등) 녹음 일시정지
  //       pauseRecording();
  //     } else if (!document.hidden && isRecording && isPaused) {
  //       // 페이지가 다시 보일 때 (전화가 끊겼을 때 등) 녹음 재개
  //       resumeRecording();
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);

  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   };
  // }, [isRecording, isPaused, pauseRecording, resumeRecording]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getBlob = useCallback(() => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: "audio/mp4" });
  }, []);

  return {
    isRecording,
    isPaused,
    audioUrl,
    audioDuration,
    recordingTime, // 녹음 중 시간 추가
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getBlob,
  };
};

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
}) => {
  const {
    isRecording,
    isPaused,
    audioUrl,
    audioDuration,
    recordingTime, // 추가
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getBlob,
  } = useAudioRecorder({
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
      a.download = "recording.mp4";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = ms / 1000;
    return seconds.toFixed(3) + "초";
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1); // 소수점 한자리까지 표시
    return `${mins}:${secs.padStart(4, "0")}`; // 4는 '0.0'의 길이
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
          <>
            <button
              onClick={stopRecording}
              className={styles.stopButton}
              aria-label="Stop Recording"
            >
              <Square />
            </button>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className={isPaused ? styles.resumeButton : styles.pauseButton}
              aria-label={isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {isPaused ? <Play /> : <Pause />}
            </button>
          </>
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
          {audioDuration !== null && (
            <p className={styles.durationText}>
              업로드 된 녹음 길이: {formatDuration(audioDuration)}
            </p>
          )}
          <TimeJumpButtons />
        </>
      )}

      <p className={styles.statusText}>
        {isRecording ? (
          <>녹음중입니다. ({formatDuration(recordingTime)})</>
        ) : (
          "마이크를 눌러서 시작해주세요."
        )}
      </p>
    </div>
  );
};

export default AudioRecorder;
