import React, { useState } from "react";
import { create } from "ipfs-http-client";

const ipfs = create({ host: "localhost", port: "5001", protocol: "http" });

const UploadMusic = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {
        const buffer = Buffer.from(reader.result);
        const result = await ipfs.add(buffer);
        const url = `http://localhost:8080/ipfs/${result.path}`;
        setFileUrl(url);
        console.log("File uploaded to IPFS:", url);
      };
    } catch (error) {
      console.error("Error uploading file to IPFS:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Music</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
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
