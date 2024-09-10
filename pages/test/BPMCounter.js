import React, { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

const BPMCounter = ({ onCountoffComplete }) => {
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4); // Default to 4/4
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false); // To track if metronome was playing before BPM change
  const beepRef = useRef(null);
  const clickRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const beep = new Howl({
      src: ["/beep.mp3"],
      volume: 1.0,
    });

    const click = new Howl({
      src: ["/click.mp3"],
      volume: 1.0,
    });

    beepRef.current = beep;
    clickRef.current = click;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startMetronome();
    } else {
      stopMetronome();
    }
  }, [bpm, beatsPerMeasure, isPlaying]);

  const startMetronome = () => {
    const intervalDuration = (60 / bpm) * 1000;
    const measureDuration = intervalDuration * beatsPerMeasure;

    const playSounds = () => {
      beepRef.current.play();
      clickRef.current.play();
      for (let i = 1; i < beatsPerMeasure; i++) {
        setTimeout(() => clickRef.current.play(), i * intervalDuration);
      }
    };

    intervalRef.current = setInterval(playSounds, measureDuration);
  };

  const stopMetronome = () => {
    clearInterval(intervalRef.current);
  };

  const handleBPMChange = (event) => {
    const inputBpm = Number(event.target.value);
    const clampedBpm = Math.min(Math.max(inputBpm, 60), 240);

    if (isPlaying) {
      setWasPlaying(true);
      setIsPlaying(false);
    }

    setBpm(clampedBpm);

    setTimeout(() => {
      if (wasPlaying) {
        setIsPlaying(true);
        setWasPlaying(false);
      }
    }, 100);
  };

  const handleBeatsChange = (event) => {
    setBeatsPerMeasure(Number(event.target.value));
  };

  // Function to handle countoff logic, can be used by parent
  const startCountoff = () => {
    const barsToWait = 2;
    const beatsPerBar = beatsPerMeasure;
    const intervalDuration = (60 / bpm) * 1000;
    const totalBeats = barsToWait * beatsPerBar;

    let currentBeat = 0;

    const metronomeInterval = setInterval(() => {
      if (currentBeat < totalBeats) {
        clickRef.current.play();
        currentBeat++;
      } else {
        clearInterval(metronomeInterval);
        if (onCountoffComplete) onCountoffComplete(); // Notify parent
      }
    }, intervalDuration);
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
