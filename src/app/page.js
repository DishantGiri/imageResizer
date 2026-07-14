'use client';
import { useState, useRef } from 'react';
import UploadZone from './components/UploadZone';
import PresetSizes from './components/PresetSizes';
import AdvancedOptions from './components/AdvancedOptions';
import OutputOptions from './components/OutputOptions';
import FeaturedImageOptions from './components/FeaturedImageOptions';
import ResultPanel from './components/ResultPanel';
import {
  UploadIcon, LinkIcon, ZapIcon, LayersIcon,
  StarIcon, AlertIcon, ImageIcon, WandIcon, DownloadIcon,
  ScissorsIcon, SparkleIcon, PackageIcon
} from './components/Icons';
import { removeBackground } from '@imgly/background-removal';

const DEFAULT_ADVANCED = { paddingTop: 20, paddingBottom: 20, bgColor: null, removeBg: false };
const DEFAULT_OUTPUT = { format: 'png', quality: 90, filename: '' };
const DEFAULT_FEATURED = {
  canvasWidth: 1200, canvasHeight: 628,
  bgColor: '#ffffff', gradientColor: null,
  paddingTop: 20, paddingBottom: 20,
};

export default function Home() {
  const [tab, setTab] = useState('upload');       // 'upload' | 'url'
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [advanced, setAdvanced] = useState(DEFAULT_ADVANCED);
  const [output, setOutput] = useState(DEFAULT_OUTPUT);
  const [featured, setFeatured] = useState(DEFAULT_FEATURED);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing…');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [featuredQuickBgColor, setFeaturedQuickBgColor] = useState('#ffffff');
  const [qpFilename, setQpFilename] = useState('');
  const [qpFormat, setQpFormat] = useState('webp');
  const formRef = useRef(null);
  const abortControllerRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const cancelOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    showToast('Operation cancelled.');
  };

  // ── Handle file selection ──
  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreviewSrc(e.target.result);
    reader.readAsDataURL(f);
  };

  // ── Handle URL dropped into upload zone ──
  const handleDroppedUrl = (url) => {
    setImageUrl(url);
    setPreviewSrc(url);
    setFile(null);
    setResult(null);
    setError('');
    setTab('url');
  };

  // ── Build FormData and submit (accepts optional overrides) ──
  const submit = async (action = 'resize', overrides = {}) => {
    if (tab === 'upload' && !file) { showToast('Please select an image file to continue.'); return; }
    if (tab === 'url' && !imageUrl.trim()) { showToast('Please enter an image URL to continue.'); return; }

    // Merge overrides so preset buttons don’t mutate global state
    const effWidth    = overrides.width    ?? width;
    const effHeight   = overrides.height   ?? height;
    const effAdvanced = overrides.advanced ? { ...advanced, ...overrides.advanced } : advanced;
    const effFeatured = overrides.featured ? { ...featured, ...overrides.featured } : featured;
    const effFormat   = overrides.format   ?? output.format;
    const effFilename = overrides.filename ?? output.filename;

    setError('');
    setResult(null);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let finalFile = file;
    let finalImageUrl = imageUrl;

    if (effAdvanced.removeBg) {
      setLoadingMsg('Removing background (AI loading on first use)…');
      try {
        const source = file || imageUrl.trim();
        const blob = await removeBackground(source, { signal: controller.signal });
        if (controller.signal.aborted) return;
        finalFile = new File([blob], 'bg-removed.png', { type: 'image/png' });
        finalImageUrl = '';
      } catch (e) {
        if (controller.signal.aborted || e.name === 'AbortError') return;
        setError('Background removal failed: ' + e.message);
        setLoading(false);
        return;
      }
    }

    setLoadingMsg(
      action === 'featured' ? 'Creating featured image…' :
      action === 'compress'  ? 'Compressing image…'      : 'Processing image…'
    );

    const fd = new FormData();
    fd.append('action', action);
    if (finalFile) fd.append('file', finalFile);
    else fd.append('image_url', finalImageUrl.trim());

    fd.append('output_width',    effWidth);
    fd.append('output_height',   effHeight);
    fd.append('padding_top',     effAdvanced.paddingTop);
    fd.append('padding_bottom',  effAdvanced.paddingBottom);
    if (effAdvanced.bgColor) fd.append('bg_color', effAdvanced.bgColor);
    fd.append('output_format',   effFormat);
    fd.append('compress_quality', output.quality);
    if (effFilename) fd.append('custom_filename', effFilename);

    if (action === 'featured') {
      fd.append('canvas_width',    effFeatured.canvasWidth);
      fd.append('canvas_height',   effFeatured.canvasHeight);
      fd.append('background_color', effFeatured.bgColor);
      if (effFeatured.gradientColor) fd.append('gradient_color', effFeatured.gradientColor);
      fd.append('padding_top',    effFeatured.paddingTop);
      fd.append('padding_bottom', effFeatured.paddingBottom);
    }

    try {
      const res = await fetch('/api/process', { method: 'POST', body: fd, signal: controller.signal });
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.success) {
        setResult({ ...data, originalPreview: previewSrc || null });
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(`Network error: ${e.message}`);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  // ── Download Both (Square transparent + Featured with BG) ──
  const downloadBoth = async () => {
    if (tab === 'upload' && !file) { showToast('Please select an image file to continue.'); return; }
    if (tab === 'url' && !imageUrl.trim()) { showToast('Please enter an image URL to continue.'); return; }

    setError('');
    setResult(null);
    setLoading(true);
    setLoadingMsg('Removing background (AI loading on first use)…');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Step 1: Remove BG once, reuse for both
      const source = file || imageUrl.trim();
      const blob = await removeBackground(source, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const bgRemovedFile = new File([blob], 'bg-removed.png', { type: 'image/png' });

      setLoadingMsg('Generating Square & Featured images in parallel…');

      const makeSquareFd = () => {
        const fd = new FormData();
        fd.append('action', 'resize');
        fd.append('file', bgRemovedFile);
        fd.append('output_width',  500);
        fd.append('output_height', 500);
        fd.append('padding_top',    advanced.paddingTop);
        fd.append('padding_bottom', advanced.paddingBottom);
        fd.append('threshold',      advanced.threshold);
        fd.append('output_format',   qpFormat);
        fd.append('compress_quality', output.quality);
        if (qpFilename) {
          fd.append('custom_filename', `${qpFilename}-square`);
        }
        return fd;
      };

      const makeFeaturedFd = () => {
        const fd = new FormData();
        fd.append('action', 'featured');
        fd.append('file', bgRemovedFile);
        fd.append('canvas_width',    1200);
        fd.append('canvas_height',   628);
        fd.append('background_color', featuredQuickBgColor);
        fd.append('padding_top',      featured.paddingTop);
        fd.append('padding_bottom',   featured.paddingBottom);
        fd.append('output_format',    qpFormat);
        fd.append('compress_quality', output.quality);
        if (qpFilename) {
          fd.append('custom_filename', `${qpFilename}-feature`);
        }
        return fd;
      };

      // Step 2: Fire both in parallel
      const [squareRes, featuredRes] = await Promise.all([
        fetch('/api/process', { method: 'POST', body: makeSquareFd(), signal: controller.signal }),
        fetch('/api/process', { method: 'POST', body: makeFeaturedFd(), signal: controller.signal }),
      ]);
      const [squareData, featuredData] = await Promise.all([
        squareRes.json(), featuredRes.json(),
      ]);
      if (controller.signal.aborted) return;

      // Step 3: Trigger downloads
      const triggerDownload = (dataUrl, filename) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      let anyError = false;
      if (squareData.success) {
        const ext = squareData.filename?.split('.').pop() || qpFormat;
        const name = qpFilename ? `${qpFilename}-square.${ext}` : `square-500x500.${ext}`;
        triggerDownload(squareData.dataUrl, name);
      }
      else { setError('Square failed: ' + squareData.message); anyError = true; }

      if (featuredData.success) {
        const ext = featuredData.filename?.split('.').pop() || qpFormat;
        const name = qpFilename ? `${qpFilename}-feature.${ext}` : `featured-1200x628.${ext}`;
        triggerDownload(featuredData.dataUrl, name);
      }
      else { setError((anyError ? '' : '') + 'Featured failed: ' + featuredData.message); anyError = true; }

      if (!anyError) showToast('✅ Both files downloaded successfully!');
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError('Download Both failed: ' + e.message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewSrc('');
    setImageUrl('');
    setResult(null);
    setError('');
  };

  return (
    <>
      <div className="bg-mesh" />
      <div className="container" style={{ paddingTop: '1rem' }}>

        {/* ── Header ── */}
        <header className="header">
          <div className="header-badge">
            <ZapIcon />
            Pro Image Tools
          </div>
          <h1>PixelForge</h1>
          <p>Resize, compress &amp; convert images with smart content-aware padding. Export to any format.</p>
          <div className="header-features">
            {['Smart Padding', 'Any Format', 'Compress', 'Featured Images', 'URL Support', 'Batch Export'].map(f => (
              <div className="feature-pill" key={f}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {f}
              </div>
            ))}
          </div>
        </header>

        {/* ── Result ── */}
        {result && <ResultPanel result={result} onReset={reset} />}

        {/* ── Error ── */}
        {error && (
          <div className="alert alert-error">
            <AlertIcon /> {error}
          </div>
        )}

        {/* ── Main Card ── */}
        {!result && (
          <div className="card">

            {/* ── Tabs ── */}
            <div className="tabs">
              <button
                className={`tab-btn${tab === 'upload' ? ' active' : ''}`}
                onClick={() => { setTab('upload'); setError(''); }}
                type="button"
              >
                <UploadIcon /> Upload File
              </button>
              <button
                className={`tab-btn${tab === 'url' ? ' active' : ''}`}
                onClick={() => { setTab('url'); setError(''); }}
                type="button"
              >
                <LinkIcon /> From URL
              </button>
            </div>

            {/* ── Upload Tab ── */}
            {tab === 'upload' && (
              <>
                <div className="section-title"><ImageIcon />Select Image</div>
                <UploadZone onFile={handleFile} onUrl={handleDroppedUrl} />
                {previewSrc && (
                  <div className="preview-grid" style={{ marginTop: '1rem' }}>
                    <div className="preview-box">
                      <div className="preview-box-header">
                        <span>Preview</span>
                        <span className="badge">Original</span>
                      </div>
                      <div className="preview-img-wrap">
                        <img src={previewSrc} alt="Preview" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── URL Tab ── */}
            {tab === 'url' && (
              <>
                <div className="section-title"><LinkIcon />Image URL</div>
                <div className="form-group">
                  <label>Paste a direct image URL</label>
                  <input
                    className="url-input"
                    type="text"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onBlur={(e) => { if (e.target.value) setPreviewSrc(e.target.value); }}
                  />
                </div>
                {previewSrc && (
                  <div className="preview-grid" style={{ marginTop: '1rem' }}>
                    <div className="preview-box">
                      <div className="preview-box-header">
                        <span>Preview</span>
                        <span className="badge">Original</span>
                      </div>
                      <div className="preview-img-wrap">
                        <img src={previewSrc} alt="URL Preview" onError={() => setPreviewSrc('')} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <hr className="divider" />

            {/* ── Output Dimensions ── */}
            <div className="section-title"><LayersIcon />Output Dimensions</div>
            <PresetSizes
              width={width} height={height}
              onChange={(w, h) => { setWidth(w); setHeight(h); }}
            />

            <hr className="divider" />

            {/* ── Output Format ── */}
            <OutputOptions options={output} onChange={setOutput} />

            <hr className="divider" />

            {/* ── Advanced Padding ── */}
            <AdvancedOptions options={advanced} onChange={setAdvanced} />

            <hr className="divider" />

            {/* ── Featured Image ── */}
            <FeaturedImageOptions options={featured} onChange={setFeatured} />

            <hr className="divider" />

            {/* ── Quick Presets ── */}
            <div className="qp-header">
              <div className="section-title" style={{ marginBottom: 0 }}>
                <WandIcon /> Quick Presets
              </div>
              <span className="qp-badge">AI removes BG automatically</span>
            </div>

            {/* Quick Preset Options */}
            <div className="qp-settings-bar">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="qp-settings-label">Custom Preset Name Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. product-image"
                  value={qpFilename}
                  onChange={(e) => setQpFilename(e.target.value)}
                  className="qp-settings-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="qp-settings-label">Preset Format</label>
                <select
                  value={qpFormat}
                  onChange={(e) => setQpFormat(e.target.value)}
                  className="qp-settings-select"
                  style={{ appearance: 'auto' }}
                >
                  <option value="webp">WebP (Default)</option>
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="avif">AVIF</option>
                  <option value="gif">GIF</option>
                  <option value="tiff">TIFF</option>
                  <option value="bmp">BMP</option>
                </select>
              </div>
            </div>

            <div className="preset-grid">

              {/* Square — transparent */}
              <div className="preset-card preset-card--square">
                <div className="preset-card-tag">500 × 500 px</div>
                <div className="preset-card-header">
                  <div className="preset-card-icon-wrap preset-icon-sq">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                    </svg>
                  </div>
                  <div>
                    <div className="preset-card-title">Square Image</div>
                    <div className="preset-card-sub">
                      {['jpeg', 'jpg', 'bmp'].includes(qpFormat) ? `${qpFormat.toUpperCase()} (Solid BG)` : `Transparent ${qpFormat.toUpperCase()}`}
                    </div>
                  </div>
                </div>
                <p className="preset-card-desc">Removes background, tight-crops the object. Exported in {qpFormat.toUpperCase()} format.</p>
                <div className="preset-transparent-badge">
                  {['jpeg', 'jpg', 'bmp'].includes(qpFormat) ? (
                    <>
                      <span className="checkerboard-mini" style={{ background: '#ffffff', backgroundImage: 'none' }} />
                      Solid white background
                    </>
                  ) : (
                    <>
                      <span className="checkerboard-mini" />
                      Transparent background
                    </>
                  )}
                </div>
                <button className="btn btn-primary preset-btn-full"
                  onClick={() => submit('resize', {
                    width: 500,
                    height: 500,
                    advanced: { ...advanced, removeBg: true, bgColor: null },
                    format: qpFormat,
                    filename: qpFilename ? `${qpFilename}-square` : ''
                  })}
                  disabled={loading} type="button">
                  <WandIcon /> Generate Square
                </button>
              </div>

              {/* Featured — custom bg */}
              <div className="preset-card preset-card--featured">
                <div className="preset-card-tag preset-card-tag--purple">1200 × 628 px</div>
                <div className="preset-card-header">
                  <div className="preset-card-icon-wrap preset-icon-feat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                      <path d="M2 10h20"/>
                    </svg>
                  </div>
                  <div>
                    <div className="preset-card-title">Featured Image</div>
                    <div className="preset-card-sub">Blog &amp; Social Media ({qpFormat.toUpperCase()})</div>
                  </div>
                </div>
                <p className="preset-card-desc">Removes background, places subject on your chosen color. Exported in {qpFormat.toUpperCase()} format.</p>
                <div className="preset-color-row">
                  <label className="preset-color-label">Background</label>
                  <div className="preset-color-pick">
                    <div className="color-swatch" style={{ width: 32, height: 32, borderRadius: 8 }}>
                      <input type="color" value={featuredQuickBgColor} onChange={e => setFeaturedQuickBgColor(e.target.value)} />
                    </div>
                    <input type="text" value={featuredQuickBgColor}
                      onChange={e => setFeaturedQuickBgColor(e.target.value)}
                      className="preset-color-input" />
                  </div>
                </div>
                <button className="btn preset-btn-full preset-btn-feat"
                  onClick={() => submit('featured', {
                    advanced: { ...advanced, removeBg: true },
                    featured: { ...featured, bgColor: featuredQuickBgColor },
                    format: qpFormat,
                    filename: qpFilename ? `${qpFilename}-feature` : ''
                  })}
                  disabled={loading} type="button">
                  <StarIcon /> Generate Featured
                </button>
              </div>

            </div>

            {/* ── Download Both ── */}
            <button
              className="btn btn-primary"
              style={{
                width: '100%', marginTop: '0.75rem',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                boxShadow: '0 4px 24px rgba(245,87,108,0.4)',
                fontSize: '1rem', fontWeight: 700, padding: '0.9rem',
              }}
              onClick={downloadBoth}
              disabled={loading}
              type="button"
            >
              <DownloadIcon />
              {loading && loadingMsg.includes('Generating Square') ? 'Generating both…' : `⬇  Download Both (Square + Featured - ${qpFormat.toUpperCase()})`}
            </button>

            <hr className="divider" />

            {/* ── Custom Actions ── */}
            <div className="section-title"><ZapIcon />Custom Actions</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ flex: 1, minWidth: '140px' }}
                onClick={() => submit('resize')} disabled={loading} type="button">
                <ZapIcon />
                {loading && loadingMsg === 'Processing image…' ? 'Processing…' : 'Resize & Export'}
              </button>
              <button className="btn btn-accent" style={{ flex: 1, minWidth: '140px' }}
                onClick={() => submit('compress')} disabled={loading} type="button">
                <LayersIcon />
                {loading && loadingMsg === 'Compressing image…' ? 'Compressing…' : 'Compress Only'}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1, minWidth: '140px' }}
                onClick={() => submit('featured')} disabled={loading} type="button">
                <StarIcon />
                {loading && loadingMsg === 'Creating featured image…' ? 'Creating…' : 'Featured Image'}
              </button>
            </div>
          </div>
        )}


        {/* ── Footer ── */}
        <footer className="footer">
          <p>PixelForge — Smart Image Resizer &amp; Converter &nbsp;•&nbsp; Built with Next.js &amp; Sharp</p>
        </footer>
      </div>

      {/* ── Fixed Loader Dialog ── */}
      {loading && (
        <div className="loader-backdrop">
          <div className="loader-dialog">
            <div className="loader-orb">
              <div className="loader-ring" />
              <div className="loader-ring loader-ring-2" />
              <div className="loader-ring loader-ring-3" />
              <span className="loader-orb-icon">
                {loadingMsg.includes('Removing') ? <ScissorsIcon /> :
                 loadingMsg.includes('Generating') ? <ZapIcon /> :
                 loadingMsg.includes('featured') || loadingMsg.includes('Featured') ? <ImageIcon /> :
                 loadingMsg.includes('Compress') ? <PackageIcon /> : <SparkleIcon />}
              </span>
            </div>
            <div className="loader-dialog-body">
              <p className="loader-dialog-title">
                {loadingMsg.includes('Removing') ? 'Removing Background…' :
                 loadingMsg.includes('Generating') ? 'Generating Images…' :
                 loadingMsg.includes('Compress') ? 'Compressing…' :
                 loadingMsg.includes('featured') || loadingMsg.includes('Featured') ? 'Creating Featured…' :
                 'Processing…'}
              </p>
              <p className="loader-dialog-sub">{loadingMsg}</p>
              <div className="loader-steps">
                {[
                  { key: 'bg',   label: 'Remove BG',   active: loadingMsg.includes('Removing') },
                  { key: 'proc', label: 'Process',      active: loadingMsg.includes('Processing') || loadingMsg.includes('Generating') || loadingMsg.includes('Compress') || loadingMsg.includes('featured') || loadingMsg.includes('Featured') },
                  { key: 'out',  label: 'Export',       active: false },
                ].map((step, i) => {
                  const isDone = step.key === 'bg' && !loadingMsg.includes('Removing');
                  return (
                    <div key={step.key} className={`loader-step${step.active ? ' active' : ''}${isDone ? ' done' : ''}`}>
                      <div className="loader-step-dot">
                        {isDone ? <span style={{fontSize:'0.7rem'}}>&#10003;</span> : step.active ? <span className="dot-pulse" /> : <span style={{opacity:0.3}}>{i+1}</span>}
                      </div>
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={cancelOperation}
                  type="button"
                  style={{
                    background: 'rgba(255, 90, 90, 0.1)',
                    border: '1px solid rgba(255, 90, 90, 0.2)',
                    color: 'var(--danger)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 90, 90, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 90, 90, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 90, 90, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 90, 90, 0.2)';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <AlertIcon />
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
