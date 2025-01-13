import React, { useEffect, useRef, useState } from "react";

interface CustomCanvasRenderingContext2D extends CanvasRenderingContext2D {
  roundRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => void;
}

/**
 * 주파수 데이터를 캔버스 너비에 맞게 리샘플링하는 함수
 * @param frequencyData - 오디오 분석기에서 얻은 주파수 데이터
 * @param width - 캔버스의 너비
 * @param barWidth - 각 막대의 너비
 * @param gap - 막대 사이의 간격
 * @returns 캔버스 크기에 맞게 조정된 데이터 배열
 */
const calculateBarData = (
  frequencyData: Uint8Array,
  width: number,
  barWidth: number,
  gap: number
): number[] => {
  // 캔버스 너비에 맞는 막대의 개수 계산
  let units = width / (barWidth + gap);
  // 각 막대가 나타낼 주파수 데이터의 범위 계산
  let step = Math.floor(frequencyData.length / units);

  // 막대 개수가 주파수 데이터보다 많을 경우 조정
  if (units > frequencyData.length) {
    units = frequencyData.length;
    step = 1;
  }

  const data: number[] = [];
  // 각 막대별 데이터 계산
  for (let i = 0; i < units; i++) {
    let sum = 0;
    // step 범위 내의 주파수 데이터 평균 계산
    for (let j = 0; j < step && i * step + j < frequencyData.length; j++) {
      sum += frequencyData[i * step + j];
    }
    // 평균값을 배열에 추가
    data.push(sum / step);
  }
  return data;
};

/**
 * 오디오 시각화를 위한 막대 그래프를 그리는 함수
 * @param data - 주파수 데이터 배열
 * @param canvas - 그림을 그릴 캔버스 요소
 * @param barWidth - 각 막대의 너비
 * @param gap - 막대 사이의 간격
 */
const draw = (
  data: number[],
  canvas: HTMLCanvasElement,
  barWidth: number,
  gap: number
): void => {
  // 캔버스 컨텍스트 가져오기
  const ctx = canvas.getContext("2d") as CustomCanvasRenderingContext2D;
  if (!ctx) return;

  const baseHeight = 40; // 기본 막대 높이 설정
  const amp = canvas.height / 2; // 캔버스 중앙 높이 계산

  // 캔버스 배경을 검정색으로 초기화
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // // 막대에 적용할 수직 그라데이션 생성
  // const gradient = ctx.createLinearGradient(
  //   0,
  //   amp - baseHeight, // 그라데이션 시작 위치
  //   0,
  //   amp + baseHeight // 그라데이션 종료 위치
  // );
  // gradient.addColorStop(0, "#00ff87"); // 상단 색상 (청록색)
  // gradient.addColorStop(1, "#60efff"); // 하단 색상 (하늘색)

  // 수평 그라데이션 생성 (좌 -> 우)
  const gradient = ctx.createLinearGradient(
    0,
    0, // 시작점 (x, y)
    canvas.width,
    0 // 종료점 (x, y)
  );

  gradient.addColorStop(0, "#0061ff"); // 시작 색상
  gradient.addColorStop(0.5, "#00ff87"); // 중간 색상
  gradient.addColorStop(1, "#60efff"); // 종료 색상

  // 네온 효과를 위한 그림자 설정
  // ctx.shadowBlur = 10; // 그림자의 흐림 정도
  ctx.shadowColor = "#60efff"; // 그림자 색상

  // 캔버스 너비에 맞는 총 막대 개수 계산
  const totalBars = Math.floor(canvas.width / (barWidth + gap));

  // 각 막대 그리기
  for (let i = 0; i < totalBars; i++) {
    ctx.fillStyle = gradient; // 막대 색상을 그라데이션으로 설정
    const x = i * (barWidth + gap); // 막대의 x 위치 계산

    // 현재 막대의 높이 계산
    const value = data[i] || 0; // 주파수 데이터가 없으면 0 사용
    const dynamicHeight = baseHeight + value / 2; // 기본 높이에 주파수 값 반영

    // 막대의 y 위치와 높이 계산 (중앙 기준)
    const y = amp - dynamicHeight / 2;
    const h = dynamicHeight;

    // 막대 그리기
    ctx.beginPath();

    // 일반 사각형 막대 그리기 roundRect를 이요하면 둥근 모서리 막대 그리기 가능!
    ctx.fillRect(x, y, barWidth, h);
    ctx.fill();
  }
};

const AudioVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("브라우저가 마이크 접근을 지원하지 않습니다.");
        return;
      }

      // audio에 접근하는 로직!
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256; // FFT 크기 조정
      analyser.minDecibels = -70; // 더 민감하게 반응하도록 조정
      analyser.maxDecibels = -30;
      analyser.smoothingTimeConstant = 0.8; // 부드러운 움직임을 위해 조정

      source.connect(analyser);
      analyserRef.current = analyser;
      setIsRecording(true);

      const animate = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        // audio analyser를 활용해서 data를 Unit8Array 형태로 만든다.
        const frequencyData = new Uint8Array(
          analyserRef.current.frequencyBinCount
        );
        analyserRef.current.getByteFrequencyData(frequencyData);

        const barWidth = 4;
        const gap = 2;
        const data = calculateBarData(
          frequencyData,
          canvasRef.current.width,
          barWidth,
          gap
        );

        draw(data, canvasRef.current, barWidth, gap);

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("마이크 접근에 실패했습니다. HTTPS 환경인지 확인해주세요.");
    }
  };

  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="border border-gray-200 rounded-lg bg-black"
      />
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-md text-white ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {isRecording ? "녹음 중지" : "녹음 시작"}
      </button>
    </div>
  );
};

export default AudioVisualizer;
