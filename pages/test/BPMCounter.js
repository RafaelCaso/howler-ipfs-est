import React, { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

const BPMCounter = () => {
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4); // Default to 4/4
  const [isPlaying, setIsPlaying] = useState(false);
  const beepRef = useRef(null);
  const clickRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      const beep = new Howl({
        src: ["/beep.mp3"], // Path to beep sound
        volume: 1.0,
      });

      const click = new Howl({
        src: ["/click.mp3"], // Path to click sound
        volume: 1.0,
      });

      beepRef.current = beep;
      clickRef.current = click;

      const intervalDuration = (60 / bpm) * 1000; // Duration in milliseconds
      const measureDuration = intervalDuration * beatsPerMeasure;

      const playSounds = () => {
        beepRef.current.play();
        clickRef.current.play();
        // Schedule clicks on each beat within the measure
        for (let i = 1; i < beatsPerMeasure; i++) {
          setTimeout(() => clickRef.current.play(), i * intervalDuration);
        }
      };

      // Play sounds on each measure
      intervalRef.current = setInterval(() => {
        playSounds();
      }, measureDuration);

      return () => {
        clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [bpm, beatsPerMeasure, isPlaying]);

  const handleBPMChange = (event) => {
    setBpm(Number(event.target.value));
  };

  const handleBeatsChange = (event) => {
    setBeatsPerMeasure(Number(event.target.value));
  };

  return (
    <div>
      <h2>BPM Counter</h2>
      <input
        type="number"
        value={bpm}
        onChange={handleBPMChange}
        min="60"
        max="240"
      />
      <select value={beatsPerMeasure} onChange={handleBeatsChange}>
        <option value={3}>3/4</option>
        <option value={4}>4/4</option>
      </select>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? "Stop" : "Start"}
      </button>
    </div>
  );
};

export default BPMCounter;
