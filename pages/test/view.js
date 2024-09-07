import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

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

  const [songs, setSongs] = useState([]); // Stores song URLs
  const [metadata, setMetadata] = useState([]); // Stores metadata
  const howlerRefs = useRef([]);
  const [muteStates, setMuteStates] = useState({});

  useEffect(() => {
    const fetchSongsAndMetadata = async () => {
      try {
        // Fetch metadata for each track
        const metadataPromises = hardcodedMetadataCIDs.map(async (cid) => {
          const response = await fetch(cid);
          return await response.json();
        });

        const fetchedMetadata = await Promise.all(metadataPromises);
        setMetadata(fetchedMetadata);

        // Extract audio track URLs from metadata
        const songUrls = hardcodedSongCIDs; // Using hardcoded URLs for now
        setSongs(songUrls);

        // Initialize Howler instances for each song
        howlerRefs.current = songUrls.map(
          (url, index) =>
            new Howl({
              src: [url],
              loop: true,
              volume: 1.0,
              format: ["mp3", "ogg"],
              onloaderror: (id, msg) => {
                console.error("Howl loading error:", msg);
              },
            })
        );

        // Initialize mute states for each track
        setMuteStates(
          songUrls.reduce((acc, _, index) => {
            acc[index] = false;
            return acc;
          }, {})
        );
      } catch (error) {
        console.error("Error fetching songs and metadata:", error);
      }
    };

    fetchSongsAndMetadata();

    // Clean up Howler instances on component unmount
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

  return (
    <>
      <h1>Tracks with Metadata</h1>
      <button onClick={playAll}>Play All</button>
      <button onClick={pauseAll}>Pause All</button>
      <ul>
        {songs.map((song, index) => (
          <li key={index}>
            {metadata[index] ? (
              <>
                <p>
                  <strong>Track Name:</strong> {metadata[index].name}
                </p>
                <p>
                  <strong>BPM:</strong> {metadata[index].bpm}
                </p>
                <p>
                  <strong>Instrument:</strong> {metadata[index].instrument}
                </p>
              </>
            ) : (
              <p>Loading metadata...</p>
            )}
            <a href={song} target="_blank" rel="noopener noreferrer">
              {song}
            </a>
            <audio controls>
              <source src={song} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
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
