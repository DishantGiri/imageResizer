'use client';
import { useState, useRef } from 'react';
import { UploadIcon } from './Icons';

export default function UploadZone({ onFile }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    onFile(file);
  };

  return (
    <div
      className={`upload-zone${dragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className="upload-icon">
        <UploadIcon />
      </div>
      {fileName ? (
        <>
          <h3 style={{ color: 'var(--accent)' }}>✓ {fileName}</h3>
          <p>Click or drop to replace</p>
        </>
      ) : (
        <>
          <h3>Drop your image here</h3>
          <p>or click to browse files</p>
          <div className="formats">Supports PNG · JPEG · WebP · GIF · BMP · TIFF · AVIF and more</div>
        </>
      )}
    </div>
  );
}
