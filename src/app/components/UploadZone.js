'use client';
import { useState, useRef, useCallback } from 'react';
import { UploadIcon, LinkIcon } from './Icons';

export default function UploadZone({ onFile, onUrl }) {
  const [dragOver, setDragOver]   = useState(false);   // any drag
  const [dragType, setDragType]   = useState('');      // 'file' | 'url'
  const [fileName, setFileName]   = useState('');
  const [status,   setStatus]     = useState('idle');  // 'idle' | 'fetching' | 'done' | 'error'
  const [errMsg,   setErrMsg]     = useState('');
  const inputRef = useRef(null);

  /* ── detect what's being dragged ── */
  const getDragType = (e) => {
    const types = [...(e.dataTransfer?.types || [])];
    if (types.includes('Files'))            return 'file';
    if (types.includes('text/uri-list'))    return 'url';
    if (types.includes('text/plain'))       return 'url';
    return 'file';
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
    setDragType(getDragType(e));
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
      setDragType('');
    }
  }, []);

  /* ── handle a local file ── */
  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrMsg('Please drop an image file.');
      setStatus('error');
      return;
    }
    setFileName(file.name);
    setErrMsg('');
    setStatus('done');
    onFile(file);
  }, [onFile]);

  /* ── handle an online URL ── */
  const handleUrl = useCallback(async (url) => {
    const cleaned = url.trim();
    if (!cleaned) return;

    // Check if it looks like an image URL or just a page URL
    const looksLikeImage = /\.(png|jpe?g|webp|gif|bmp|tiff?|avif|svg)(\?.*)?$/i.test(cleaned);

    setStatus('fetching');
    setFileName('');
    setErrMsg('');

    try {
      // Proxy through our API to avoid CORS
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(cleaned)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/') && !looksLikeImage) {
        throw new Error('URL does not appear to be an image.');
      }
      const blob = await res.blob();
      const ext  = contentType.split('/')[1]?.split(';')[0] || 'jpg';
      const file = new File([blob], `dropped-image.${ext}`, { type: contentType || 'image/jpeg' });
      setFileName(file.name);
      setStatus('done');
      onFile(file);
    } catch (err) {
      // Fallback: pass URL directly (works if server can fetch it)
      setStatus('done');
      setFileName(cleaned.split('/').pop().split('?')[0] || 'online-image');
      onUrl?.(cleaned);
    }
  }, [onFile, onUrl]);

  /* ── drop handler ── */
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    setDragType('');

    const dt = e.dataTransfer;

    // 1. Local file dropped
    if (dt.files && dt.files.length > 0) {
      handleFile(dt.files[0]);
      return;
    }

    // 2. Image element dragged from browser (has src URL)
    const html = dt.getData('text/html');
    if (html) {
      const match = html.match(/src=["']([^"']+)["']/i);
      if (match?.[1]) { await handleUrl(match[1]); return; }
    }

    // 3. URI list (drag from browser address bar or image)
    const uriList = dt.getData('text/uri-list');
    if (uriList) {
      const firstUrl = uriList.split('\n').find(l => l.trim() && !l.startsWith('#'));
      if (firstUrl) { await handleUrl(firstUrl.trim()); return; }
    }

    // 4. Plain text URL
    const text = dt.getData('text/plain');
    if (text?.startsWith('http')) { await handleUrl(text); return; }

    setErrMsg('Could not read the dropped item. Try dropping an image file instead.');
    setStatus('error');
  }, [handleFile, handleUrl]);

  /* ── zone label ── */
  const zoneLabel = () => {
    if (status === 'fetching') return { icon: '⏳', title: 'Fetching image…', sub: 'Downloading from URL' };
    if (status === 'error')    return { icon: '⚠️', title: 'Drop failed', sub: errMsg };
    if (status === 'done')     return { icon: '✓',  title: fileName, sub: 'Click or drop to replace' };
    if (dragOver && dragType === 'url') return { icon: '🔗', title: 'Drop URL to fetch image', sub: 'Supports any public image link' };
    if (dragOver) return { icon: '📂', title: 'Drop to upload', sub: 'Release to load this image' };
    return { icon: null, title: 'Drop image or URL here', sub: 'or click to browse files' };
  };

  const label = zoneLabel();

  return (
    <div
      className={`upload-zone${dragOver ? ' drag-over' : ''}${status === 'error' ? ' zone-error' : ''}${status === 'done' ? ' zone-done' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => status !== 'fetching' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {/* Icon */}
      <div className="upload-icon" style={{ fontSize: label.icon && label.icon !== null && typeof label.icon === 'string' && label.icon.length > 1 ? '2.2rem' : undefined }}>
        {label.icon ? (
          <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{label.icon}</span>
        ) : (
          status === 'fetching' ? <span style={{ fontSize: '2rem' }}>⏳</span> : <UploadIcon />
        )}
      </div>

      <h3 style={{
        color: status === 'done'  ? 'var(--accent)' :
               status === 'error' ? '#f5576c'       :
               dragOver && dragType === 'url' ? '#a78bfa' : undefined,
        wordBreak: 'break-all',
        maxWidth: '100%',
      }}>
        {label.title}
      </h3>
      <p>{label.sub}</p>

      {/* Drag type badge */}
      {dragOver && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          marginTop: '0.5rem',
          padding: '0.3rem 0.75rem',
          borderRadius: '2rem',
          background: dragType === 'url' ? 'rgba(167,139,250,0.15)' : 'rgba(99,102,241,0.15)',
          border: `1px solid ${dragType === 'url' ? 'rgba(167,139,250,0.4)' : 'rgba(99,102,241,0.4)'}`,
          fontSize: '0.8rem',
          color: dragType === 'url' ? '#a78bfa' : 'var(--accent)',
        }}>
          {dragType === 'url' ? <LinkIcon /> : <UploadIcon />}
          {dragType === 'url' ? 'URL detected — will fetch image' : 'Local file detected'}
        </div>
      )}

      {status === 'idle' && !dragOver && (
        <div className="formats">
          Supports PNG · JPEG · WebP · GIF · BMP · TIFF · AVIF
          &nbsp;·&nbsp;
          <span style={{ color: '#a78bfa' }}>Drag from browser too!</span>
        </div>
      )}
    </div>
  );
}
