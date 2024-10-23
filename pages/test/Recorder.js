import React, { useRef } from "react";

const Recorder = ({ uploadRecording }) => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      // mediaRecorder.onstop = () => {
      //   const audioBlob = new Blob(audioChunksRef.current, {
      //     type: "audio/wav",
      //   });
      //   const audioUrl = URL.createObjectURL(audioBlob);
      //   const audio = new Audio(audioUrl);
      //   // audio.play();
      //   uploadRecording(audio);
      //   // save or upload as needed
      // };
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
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
    </>
  );
};

export default Recorder;
