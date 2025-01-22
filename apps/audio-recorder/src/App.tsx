import "./App.css";
import AudioRecorder from "./components/audio-recorder";

function App() {
  const handleRecordingComplete = (blob: Blob) => {
    console.log("Recording completed:", blob);
  };

  return (
    <div
      style={{
        width: 400,
      }}
    >
      <h1>Voice Recorder</h1>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}

export default App;
