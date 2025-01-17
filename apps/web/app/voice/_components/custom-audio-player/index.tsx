import React, { useRef } from 'react';
import H5AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import styles from './AudioPlayer.module.css';

// AudioPlayer의 ref 타입 정의
interface AudioPlayerRef {
  audio: {
    current: HTMLAudioElement;
  };
}

// 컴포넌트 props 타입 정의
interface CustomAudioPlayerProps {
  audioUrl: string;
  className?: string;
}

// 시간 이동 버튼 타입 정의
interface TimeButton {
  label: string;
  seconds: number;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ audioUrl, className = '' }) => {
  const playerRef = useRef<AudioPlayerRef | null>(null);

  const seekToTime = (seconds: number): void => {
    if (playerRef.current?.audio?.current) {
      playerRef.current.audio.current.currentTime = seconds;
    }
  };

  const timeButtons: TimeButton[] = [
    { label: '30초', seconds: 30 },
    { label: '1분', seconds: 60 },
    { label: '2분', seconds: 120 },
  ];

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.playerWrapper}>
        <H5AudioPlayer
          ref={playerRef as any}
          src={audioUrl}
          showSkipControls={true}
          showJumpControls={true}
          customProgressBarSection={[RHAP_UI.CURRENT_TIME, RHAP_UI.PROGRESS_BAR, RHAP_UI.DURATION]}
        />
      </div>

      <div className={styles.buttonContainer}>
        {timeButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => seekToTime(button.seconds)}
            className={styles.button}
            type='button'
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomAudioPlayer;
