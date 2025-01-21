import "./App.css";
import AudioRecorder from "./components/audio-recorder";

function App() {
  const handleRecordingComplete = (blob: Blob) => {
    console.log("Recording completed:", blob);
  };

  return (
    <div>
      <h1>Voice Recorder</h1>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}

export default App;
