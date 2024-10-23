import React, { useRef, useState } from "react";
import { Howl } from "howler";

const Recorder = ({ pilotBpm, uploadRecording }) => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const clickRef = useRef(null);
  const [isCountingOff, setIsCountingOff] = useState(false);

  // Create a click sound effect for the countoff
  useState(() => {
    const click = new Howl({
      src: ["/click.mp3"],
      volume: 1.0,
    });
    clickRef.current = click;
  }, []);

  const startCountoffAndRecording = () => {
    const bpm = pilotBpm || 120;
    const intervalDuration = (60 / bpm) * 1000;
    const beatsToWait = 9;

    setIsCountingOff(true);
    let beatCount = 0;

    // Perform the countoff
    const countOff = setInterval(() => {
      clickRef.current.play();
      beatCount++;

      if (beatCount >= beatsToWait) {
        clearInterval(countOff);
        setIsCountingOff(false);

        // Stop the click sound immediately after the countoff
        clickRef.current.stop();

        // Add a tiny delay before starting the recording to avoid phantom clicks
        setTimeout(() => {
          startRecording();
        }, 100); // Delay of 100ms to ensure the last click doesn't overlap with the recording
      }
    }, intervalDuration);
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.start();

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        uploadRecording(audioUrl); // Pass the audio URL to be handled like an uploaded file
      };
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <>
      <h1>Direct Recording</h1>
      <button onClick={startCountoffAndRecording} disabled={isCountingOff}>
        {isCountingOff ? "Counting Off..." : "Start Recording"}
      </button>
      <button onClick={stopRecording}>Stop Recording</button>
    </>
  );
};

export default Recorder;
