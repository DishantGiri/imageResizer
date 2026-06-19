'use client';
import { useState } from 'react';
import { ChevronIcon } from './Icons';

const FORMATS = [
  { value: 'png',  label: 'PNG',  desc: 'Lossless, transparency' },
  { value: 'jpeg', label: 'JPEG', desc: 'Lossy, smallest size' },
  { value: 'webp', label: 'WebP', desc: 'Modern, great quality' },
  { value: 'avif', label: 'AVIF', desc: 'Next-gen compression' },
  { value: 'gif',  label: 'GIF',  desc: 'Legacy animated' },
  { value: 'tiff', label: 'TIFF', desc: 'Print quality' },
  { value: 'bmp',  label: 'BMP',  desc: 'Uncompressed bitmap' },
];

export default function OutputOptions({ options, onChange }) {
  const [open, setOpen] = useState(true);
  const qualityFormats = ['jpeg', 'webp', 'avif', 'tiff'];
  const showQuality = qualityFormats.includes(options.format);

  return (
    <div>
      <button
        type="button"
        className={`advanced-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <ChevronIcon />
        Output Format &amp; Compression
      </button>

      <div className={`advanced-panel${open ? ' open' : ''}`}>
        <div style={{ paddingTop: '1.25rem' }}>
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {FORMATS.map(f => (
              <button
                key={f.value}
                type="button"
                className={`preset-btn${options.format === f.value ? ' active' : ''}`}
                onClick={() => onChange({ ...options, format: f.value })}
              >
                {f.label}
                <span className="preset-name">{f.desc}</span>
              </button>
            ))}
          </div>

          {showQuality && (
            <div className="form-group">
              <div className="slider-wrapper">
                <div className="slider-label">
                  <label>Compression Quality</label>
                  <span className="slider-value">{options.quality}%</span>
                </div>
                <input type="range" min={1} max={100} value={options.quality}
                  onChange={e => onChange({ ...options, quality: parseInt(e.target.value) })} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Lower = smaller file size, higher = better image quality
                </span>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Custom Filename (optional)</label>
            <input type="text" value={options.filename}
              placeholder={`my-image.${options.format}`}
              onChange={e => onChange({ ...options, filename: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}
