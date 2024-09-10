import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import BPMCounter from "./BPMCounter"; // Reuse BPMCounter to handle the click sound

const View = () => {
  // Hardcoded IPFS URLs for tracks and metadata
  const hardcodedSongCIDs = [
    "http://localhost:8080/ipfs/QmYuPWyw2QAP3orqc8QjCKFtWQKC3CmaJ9zDJHzAgp63aP",
    "http://localhost:8080/ipfs/QmSFLEuRSyMAi8K1CHJwzvkE4M8k2WrnpUXSxfRkUn5fSA",
    "http://localhost:8080/ipfs/QmdB9Ks6Fww9tcLntZ9pv2YqM8QPdZBdZfX22tpHJhkmtG",
  ];
  const hardcodedMetadataCIDs = [
    "http://localhost:8080/ipfs/QmVrg62tc7EfSctKkoYjPozk4obf7XD3s53HzsaurPeUKQ",
    "http://localhost:8080/ipfs/QmP1Wn4kiaziEM1RWwFzvV7nARWhh4HgrjesRhmeSC23Ck",
    "http://localhost:8080/ipfs/QmcZhfWp3yTPPocVZxcxMiD6gmDgLWGokv2KhMq1sZtfJw",
  ];

  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [muteStates, setMuteStates] = useState({});
  const howlerRefs = useRef([]);

  useEffect(() => {
    const fetchFilesAndMetadata = async () => {
      try {
        setFiles(hardcodedSongCIDs);

        const metadataPromises = hardcodedMetadataCIDs.map((cid) =>
          fetch(cid).then((response) => response.json())
        );
        const meta = await Promise.all(metadataPromises);
        setMetadata(meta);

        howlerRefs.current = hardcodedSongCIDs.map(
          (file, index) =>
            new Howl({
              src: [file],
              loop: true,
              volume: 1.0,
              format: ["mp3", "ogg"],
            })
        );

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

    return () => {
      howlerRefs.current.forEach((howler) => howler.unload());
    };
  }, []);

  const playAll = () => {
    howlerRefs.current.forEach((howler) => {
      if (!howler.playing()) {
        howler.play();
      }
    });
  };

  const pauseAll = () => {
    howlerRefs.current.forEach((howler) => {
      if (howler.playing()) {
        howler.pause();
      }
    });
  };

  const toggleMute = (index) => {
    const newMuteStates = { ...muteStates, [index]: !muteStates[index] };
    setMuteStates(newMuteStates);
    howlerRefs.current[index].mute(newMuteStates[index]);
  };

  // This function will be passed to BPMCounter to start playing the tracks after the countoff
  const startPlayingTracks = () => {
    playAll();
  };

  return (
    <>
      <h1>Files</h1>
      <BPMCounter
        bpm={metadata[0]?.bpm || 120}
        startPlayingTracks={startPlayingTracks}
      />
      <button onClick={pauseAll}>Pause All</button>
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
    </>
  );
};

export default View;
