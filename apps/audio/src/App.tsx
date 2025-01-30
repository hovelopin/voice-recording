import './App.css'
import EnhancedAudioRecorder from './components/EnhancedAudioRecorder'

function App() {

  return (
    <EnhancedAudioRecorder 
  onRecordingComplete={(blob) => {
    // 녹음 완료 후 처리할 로직
    console.log('Recording completed:', blob);
  }} 
/>
  )
}

export default App
