import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import BPMCounter from "./BPMCounter"; // Reuse BPMCounter to handle the click sound

const View = () => {
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
  const [uploadedFile, setUploadedFile] = useState(null);

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

  const startPlayingTracks = () => {
    playAll();
  };

  // File upload handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadedFile(file);
  };

  // Merging audio files
  const mergeAudioFiles = async (fileUrls) => {
    const audioContext = new AudioContext();

    // Fetch and decode the default website audio file
    const response1 = await fetch(fileUrls[0]);
    const arrayBuffer1 = await response1.arrayBuffer();
    const buffer1 = await audioContext.decodeAudioData(arrayBuffer1);

    // Decode the uploaded file
    const uploadedFile = fileUrls[1];
    const arrayBuffer2 = await uploadedFile.arrayBuffer();
    const buffer2 = await audioContext.decodeAudioData(arrayBuffer2);

    const maxLength = Math.max(buffer1.length, buffer2.length);

    const offlineContext = new OfflineAudioContext(
      buffer1.numberOfChannels,
      maxLength,
      buffer1.sampleRate
    );

    const mergedBuffer = offlineContext.createBuffer(
      buffer1.numberOfChannels,
      maxLength,
      buffer1.sampleRate
    );

    for (let channel = 0; channel < mergedBuffer.numberOfChannels; channel++) {
      const output = mergedBuffer.getChannelData(channel);
      [buffer1, buffer2].forEach((buffer) => {
        const input = buffer.getChannelData(channel);
        for (let i = 0; i < buffer.length; i++) {
          output[i] += input[i];
        }
      });
    }

    const source = offlineContext.createBufferSource();
    source.buffer = mergedBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const audioBlob = await bufferToBlob(renderedBuffer);

    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(audioBlob);
    downloadLink.download = "mergedTrack.ogg";
    downloadLink.innerText = "Download Merged Track";
    document.body.appendChild(downloadLink);
  };

  const bufferToBlob = async (audioBuffer) => {
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);
    return new Blob([wavBlob], { type: "audio/ogg" });
  };

  function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      bufferArray = new ArrayBuffer(length),
      view = new DataView(bufferArray),
      channels = [],
      sampleRate = buffer.sampleRate;

    let pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan); // number of channels
    setUint32(sampleRate); // sample rate
    setUint32(sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < buffer.length; i++) {
      for (let j = 0; j < numOfChan; j++) {
        const sample = Math.max(-1, Math.min(1, channels[j][i]));
        view.setInt16(
          pos,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
        pos += 2;
      }
    }

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    return bufferArray;
  }

  const handleMerge = () => {
    if (!uploadedFile) {
      alert("Please upload a file first!");
      return;
    }
    const fileUrls = [hardcodedSongCIDs[0], uploadedFile];
    mergeAudioFiles(fileUrls);
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
      <h2>Upload and Merge your Accompaniment</h2>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      <button onClick={handleMerge}>Merge and Download</button>
    </>
  );
};

export default View;
