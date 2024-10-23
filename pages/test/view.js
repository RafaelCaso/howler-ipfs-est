import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import BPMCounter from "./BPMCounter";
import Recorder from "./Recorder";

const View = () => {
  const hardcodedSongCIDs = [
    "http://localhost:8080/ipfs/QmUQAoJjy2mJAHHyXAHVnzkbt4LphrfqoT1eDzNj6KBAhU",
    // You can add more CIDs here
  ];
  const hardcodedMetadataCIDs = [
    "http://localhost:8080/ipfs/QmfHUpYzaRhSP4Q3yfhtX8sh5h1JnLtKoEWJCjQSLyW5d4",
    // You can add more metadata CIDs here
  ];

  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [muteStates, setMuteStates] = useState({});
  const howlerRefs = useRef([]); // Store Howl instances
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pilotBpm, setPilotBpm] = useState();

  useEffect(() => {
    const fetchFilesAndMetadata = async () => {
      try {
        setFiles(hardcodedSongCIDs);

        const metadataPromises = hardcodedMetadataCIDs.map((cid) =>
          fetch(cid).then((response) => response.json())
        );
        const meta = await Promise.all(metadataPromises);
        meta.forEach((m) => {
          if (m.pilot) {
            console.log("Pilot found", m);
            setPilotBpm(m.bpm);
          }
        });
        setMetadata(meta);

        // Initialize Howl instances for each track
        howlerRefs.current = hardcodedSongCIDs.map((file, index) => {
          const isPilot = meta[index]?.pilot; // Check if it's the pilot track
          return new Howl({
            src: [file],
            loop: isPilot, // Only loop the pilot track
            volume: 1.0,
            format: ["mp3", "ogg"],
            onend: !isPilot ? () => howlerRefs.current[index].stop() : null, // Stop accompaniments after they finish
          });
        });

        setMuteStates(
          hardcodedSongCIDs.reduce((acc, file, index) => {
            acc[index] = false;
            return acc;
          }, {})
        );
      } catch (error) {
        console.error("Error fetching metadata or initializing files:", error);
      }
    };

    fetchFilesAndMetadata();

    // Cleanup when component unmounts
    return () => {
      howlerRefs.current.forEach((howler) => howler.unload());
    };
  }, []);

  // Play all tracks
  const playAll = () => {
    howlerRefs.current.forEach((howler) => {
      if (!howler.playing()) {
        howler.play();
      }
    });
  };

  // Pause all tracks
  const pauseAll = () => {
    howlerRefs.current.forEach((howler) => {
      if (howler.playing()) {
        howler.pause();
      }
    });
  };

  // Stop all tracks and reset them to the start
  const stopAllTracks = () => {
    howlerRefs.current.forEach((howler) => {
      howler.stop(); // Stop the track
      howler.seek(0); // Reset to the start
    });
  };

  // Toggle mute for a specific track
  const toggleMute = (index) => {
    const newMuteStates = { ...muteStates, [index]: !muteStates[index] };
    setMuteStates(newMuteStates);
    howlerRefs.current[index].mute(newMuteStates[index]);
  };

  // Handle file upload and add new Howl instance
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file); // Local URL for the uploaded file

    const newHowl = new Howl({
      src: [url],
      loop: false, // Do not loop uploaded tracks
      volume: 1.0,
      format: ["mp3", "ogg"],
      onend: () => newHowl.stop(), // Stop the track after it finishes
    });

    stopAllTracks(); // Stop and reset all tracks before adding a new one

    howlerRefs.current.push(newHowl); // Add new track
    setFiles((prevFiles) => [...prevFiles, url]);
    setMuteStates((prevMuteStates) => ({
      ...prevMuteStates,
      [files.length]: false,
    }));
  };

  // Handle recording upload similar to file upload
  const handleRecordingUpload = (audioUrl) => {
    const newHowl = new Howl({
      src: [audioUrl],
      loop: false, // Do not loop recordings
      volume: 1.0,
      format: ["wav"], // Ensure format matches
      onend: () => newHowl.stop(), // Stop after it finishes
    });

    stopAllTracks(); // Stop and reset all tracks before adding a new one

    howlerRefs.current.push(newHowl); // Add new track
    setFiles((prevFiles) => [...prevFiles, audioUrl]); // Add the URL to files array
    setMuteStates((prevMuteStates) => ({
      ...prevMuteStates,
      [files.length]: false,
    }));
  };

  const startPlayingTracks = () => {
    playAll(); // Play all tracks together
  };

  return (
    <>
      <h1>Tracks</h1>
      <BPMCounter startPlayingTracks={startPlayingTracks} pilotBpm={pilotBpm} />
      <button onClick={pauseAll}>Pause All</button>
      <button onClick={stopAllTracks}>Stop All</button>

      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <a href={file} target="_blank" rel="noopener noreferrer">
              {file}
            </a>
            <p>{metadata[index]?.name || "Unknown Track"}</p>
            <p>{metadata[index]?.instrument || "Unknown Instrument"}</p>
            <button onClick={() => toggleMute(index)}>
              {muteStates[index] ? "Unmute" : "Mute"}
            </button>
          </li>
        ))}
      </ul>

      <h2>Upload and Preview Additional Track</h2>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      <Recorder pilotBpm={pilotBpm} uploadRecording={handleRecordingUpload} />
    </>
  );
};

export default View;
