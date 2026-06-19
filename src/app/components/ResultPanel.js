'use client';
import { DownloadIcon, CheckIcon, RefreshIcon } from './Icons';

export default function ResultPanel({ result, onReset }) {
  if (!result) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = result.filename;
    a.click();
  };

  return (
    <div className="card result-panel">
      <div className="result-header">
        <div className="result-icon">
          <CheckIcon />
        </div>
        <div>
          <div className="result-title">Image Ready!</div>
          <div className="result-subtitle">{result.message}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Dimensions</span>
          <span className="stat-value">{result.dimensions?.width} × {result.dimensions?.height}px</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Format</span>
          <span className="stat-value">{result.mimeType?.split('/')[1]?.toUpperCase()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Original Size</span>
          <span className="stat-value">{formatNumberBytes(result.originalSize)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">New Size</span>
          <span className="stat-value">{formatBytes(result.dataUrl)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Savings</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {calculateSavings(result.originalSize, getBase64Bytes(result.dataUrl))}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Filename</span>
          <span className="stat-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{result.filename}</span>
        </div>
      </div>

      {/* Boundary analysis */}
      {result.boundaries && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">Content Boundary Analysis</div>
          <div className="analysis-grid">
            {Object.entries(result.boundaries).map(([key, val]) => (
              <div className="analysis-item" key={key}>
                <div className="label">{key}</div>
                <div className="value">{val}px</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="preview-grid">
        {result.originalPreview && (
          <div className="preview-box">
            <div className="preview-box-header">
              <span>Original</span>
              <span className="badge">Before</span>
            </div>
            <div className="preview-img-wrap">
              <img src={result.originalPreview} alt="Original" />
            </div>
          </div>
        )}
        <div className="preview-box" style={{ gridColumn: result.originalPreview ? '' : '1 / -1' }}>
          <div className="preview-box-header">
            <span>Processed</span>
            <span className="badge accent">After</span>
          </div>
          <div className="preview-img-wrap">
            <img src={result.dataUrl} alt="Processed" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="result-actions">
        <button className="btn btn-accent" onClick={handleDownload}>
          <DownloadIcon />
          Download {result.filename}
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          <RefreshIcon />
          Process Another
        </button>
      </div>
    </div>
  );
}

function getBase64Bytes(dataUrl) {
  try {
    const base64 = dataUrl.split(',')[1];
    return Math.round((base64.length * 3) / 4);
  } catch {
    return 0;
  }
}

function formatBytes(dataUrl) {
  const bytes = getBase64Bytes(dataUrl);
  return formatNumberBytes(bytes);
}

function formatNumberBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function calculateSavings(original, newSize) {
  if (!original || !newSize) return '—';
  if (newSize >= original) {
    const increase = ((newSize - original) / original * 100).toFixed(1);
    return `+${increase}%`;
  }
  const savings = ((original - newSize) / original * 100).toFixed(1);
  return `-${savings}%`;
}
