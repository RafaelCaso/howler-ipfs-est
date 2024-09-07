import React, { useState } from "react";
import { create } from "ipfs-http-client";

const ipfs = create({ host: "localhost", port: "5001", protocol: "http" });

const UploadMusic = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [name, setName] = useState("");
  const [bpm, setBpm] = useState("");
  const [instrument, setInstrument] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !name || !bpm || !instrument) {
      alert("Please fill in all fields and select a file!");
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {
        const buffer = Buffer.from(reader.result);
        const result = await ipfs.add(buffer);
        const fileIpfsUrl = `http://localhost:8080/ipfs/${result.path}`;
        setFileUrl(fileIpfsUrl);

        // Create metadata
        const metadata = {
          name,
          bpm,
          instrument,
          fileUrl: fileIpfsUrl,
        };

        // Upload metadata to IPFS
        const metadataBuffer = Buffer.from(JSON.stringify(metadata));
        const metadataResult = await ipfs.add(metadataBuffer);
        const metadataUrl = `http://localhost:8080/ipfs/${metadataResult.path}`;

        console.log("File uploaded to IPFS:", fileIpfsUrl);
        console.log("Metadata uploaded to IPFS:", metadataUrl);
      };
    } catch (error) {
      console.error("Error uploading file to IPFS:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Music with Metadata</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginBottom: "10px", display: "block" }}
      />
      <input
        type="number"
        placeholder="BPM"
        value={bpm}
        onChange={(e) => setBpm(e.target.value)}
        style={{ marginBottom: "10px", display: "block" }}
      />
      <input
        type="text"
        placeholder="Instrument"
        value={instrument}
        onChange={(e) => setInstrument(e.target.value)}
        style={{ marginBottom: "10px", display: "block" }}
      />
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ marginBottom: "10px", display: "block" }}
      />
      <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
        Upload
      </button>
      {fileUrl && (
        <div>
          <p>File uploaded to IPFS:</p>
          <audio controls>
            <source src={fileUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default UploadMusic;
