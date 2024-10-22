import React, { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

const BPMCounter = ({ startPlayingTracks }) => {
  const [isCountingOff, setIsCountingOff] = useState(false);
  const clickRef = useRef(null);

  useEffect(() => {
    const click = new Howl({
      src: ["/click.mp3"],
      volume: 1.0,
    });

    clickRef.current = click;

    return () => {
      if (clickRef.current) clickRef.current.stop();
    };
  }, []);

  const startCountoff = () => {
    const bpm = 120;
    const intervalDuration = (60 / bpm) * 1000;
    const beatsToWait = 9;

    setIsCountingOff(true);
    let beatCount = 0;

    const countOff = setInterval(() => {
      clickRef.current.play();
      beatCount++;

      if (beatCount >= beatsToWait) {
        clearInterval(countOff);
        setIsCountingOff(false);
        startPlayingTracks(); // Trigger track playback
      }
    }, intervalDuration);
  };

  return (
    <>
      <button onClick={startCountoff} disabled={isCountingOff}>
        {isCountingOff ? "Counting Off..." : "Start Countoff"}
      </button>
    </>
  );
};

export default BPMCounter;
