import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

const View = () => {
  // Hardcoded IPFS URLs
  const hardcodedCIDs = [
    "http://localhost:8080/ipfs/QmdB9Ks6Fww9tcLntZ9pv2YqM8QPdZBdZfX22tpHJhkmtG",
    "http://localhost:8080/ipfs/QmRCNWVpt6whTYEQwKomGCciSaPFRjySNBnpcHJ74fxPXD",
  ];

  const [files, setFiles] = useState([]);
  const howlerRefs = useRef([]);
  const [muteStates, setMuteStates] = useState({});

  useEffect(() => {
    // Hardcoded files to mimic the response from an IPFS gateway
    const fetchFiles = async () => {
      const fileUrls = hardcodedCIDs;
      setFiles(fileUrls);

      howlerRefs.current = fileUrls.map(
        (file, index) =>
          new Howl({
            src: [file],
            loop: true,
            volume: 1.0,
            format: ["mp3", "ogg"],
            onloaderror: (id, msg) => {
              console.error("Howl loading error:", msg);
            },
          })
      );

      setMuteStates(
        fileUrls.reduce((acc, file, index) => {
          acc[index] = false;
          return acc;
        }, {})
      );
    };

    fetchFiles();

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
      <h1>Files</h1>
      <button onClick={playAll}>Play All</button>
      <button onClick={pauseAll}>Pause All</button>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <a href={file} target="_blank" rel="noopener noreferrer">
              {file}
            </a>
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
