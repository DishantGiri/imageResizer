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
  StarIcon, AlertIcon, ImageIcon, WandIcon, DownloadIcon
} from './components/Icons';
import { removeBackground } from '@imgly/background-removal';

const DEFAULT_ADVANCED = { paddingTop: 20, paddingBottom: 20, threshold: 5, bgColor: null, removeBg: false };
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
  const formRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
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

  // ── Build FormData and submit (accepts optional overrides) ──
  const submit = async (action = 'resize', overrides = {}) => {
    if (tab === 'upload' && !file) { showToast('Please select an image file to continue.'); return; }
    if (tab === 'url' && !imageUrl.trim()) { showToast('Please enter an image URL to continue.'); return; }

    // Merge overrides so preset buttons don’t mutate global state
    const effWidth    = overrides.width    ?? width;
    const effHeight   = overrides.height   ?? height;
    const effAdvanced = overrides.advanced ? { ...advanced, ...overrides.advanced } : advanced;
    const effFeatured = overrides.featured ? { ...featured, ...overrides.featured } : featured;

    setError('');
    setResult(null);
    setLoading(true);

    let finalFile = file;
    let finalImageUrl = imageUrl;

    if (effAdvanced.removeBg) {
      setLoadingMsg('Removing background (AI loading on first use)…');
      try {
        const source = file || imageUrl.trim();
        const blob = await removeBackground(source);
        finalFile = new File([blob], 'bg-removed.png', { type: 'image/png' });
        finalImageUrl = '';
      } catch (e) {
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
    fd.append('threshold',       effAdvanced.threshold);
    if (effAdvanced.bgColor) fd.append('bg_color', effAdvanced.bgColor);
    fd.append('output_format',   output.format);
    fd.append('compress_quality', output.quality);
    if (output.filename) fd.append('custom_filename', output.filename);

    if (action === 'featured') {
      fd.append('canvas_width',    effFeatured.canvasWidth);
      fd.append('canvas_height',   effFeatured.canvasHeight);
      fd.append('background_color', effFeatured.bgColor);
      if (effFeatured.gradientColor) fd.append('gradient_color', effFeatured.gradientColor);
      fd.append('padding_top',    effFeatured.paddingTop);
      fd.append('padding_bottom', effFeatured.paddingBottom);
    }

    try {
      const res = await fetch('/api/process', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setResult({ ...data, originalPreview: previewSrc || null });
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
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

    try {
      // Step 1: Remove BG once, reuse for both
      const source = file || imageUrl.trim();
      const blob = await removeBackground(source);
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
        // No bg_color → transparent PNG
        fd.append('output_format',   'png');
        fd.append('compress_quality', output.quality);
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
        fd.append('output_format',    output.format);
        fd.append('compress_quality', output.quality);
        return fd;
      };

      // Step 2: Fire both in parallel
      const [squareRes, featuredRes] = await Promise.all([
        fetch('/api/process', { method: 'POST', body: makeSquareFd() }),
        fetch('/api/process', { method: 'POST', body: makeFeaturedFd() }),
      ]);
      const [squareData, featuredData] = await Promise.all([
        squareRes.json(), featuredRes.json(),
      ]);

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
      if (squareData.success)  triggerDownload(squareData.dataUrl, 'square-500x500.png');
      else { setError('Square failed: ' + squareData.message); anyError = true; }

      if (featuredData.success) triggerDownload(featuredData.dataUrl, `featured-1200x628.${featuredData.filename?.split('.').pop() || output.format}`);
      else { setError((anyError ? '' : '') + 'Featured failed: ' + featuredData.message); anyError = true; }

      if (!anyError) showToast('✅ Both files downloaded successfully!');
    } catch (e) {
      setError('Download Both failed: ' + e.message);
    } finally {
      setLoading(false);
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
      <div className="container">

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
          <div className="card" style={{ position: 'relative' }}>

            {/* Loading overlay */}
            {loading && (
              <div className="loading-overlay">
                <div className="spinner" />
                <div className="loading-text">{loadingMsg}</div>
              </div>
            )}

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
                <UploadZone onFile={handleFile} />
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
            <div className="section-title" style={{ marginTop: '0.5rem' }}>
              <WandIcon /> Quick Presets
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>AI removes BG → places on your color</span>
            </div>
            <div className="preset-grid">

              {/* Square — always transparent */}
              <div className="preset-card">
                <div className="preset-card-header">
                  <div className="preset-card-icon">&#9634;</div>
                  <div>
                    <div className="preset-card-title">Square Image</div>
                    <div className="preset-card-dim">500 × 500 px</div>
                  </div>
                </div>
                <p className="preset-card-desc">Isolates subject on a <strong>transparent background</strong>. Perfect for product listings &amp; e-commerce.</p>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem',
                  padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)',
                  background:'rgba(255,255,255,0.04)', border:'1px dashed rgba(255,255,255,0.12)' }}>
                  <span style={{ fontSize:'1.1rem' }}>&#9601;</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Transparent — no background fill</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }}
                  onClick={() => submit('resize', {
                    width: 500, height: 500,
                    advanced: { ...advanced, removeBg: true, bgColor: null }
                  })}
                  disabled={loading} type="button">
                  <WandIcon /> Generate Square
                </button>
              </div>

              {/* Featured */}
              <div className="preset-card">
                <div className="preset-card-header">
                  <div className="preset-card-icon">&#128444;</div>
                  <div>
                    <div className="preset-card-title">Featured Image</div>
                    <div className="preset-card-dim">1200 × 628 px</div>
                  </div>
                </div>
                <p className="preset-card-desc">Isolates subject, places on custom background. Perfect for blog posts &amp; social media.</p>
                <div className="color-picker-group" style={{ marginBottom: '0.75rem' }}>
                  <div className="color-swatch">
                    <input type="color" value={featuredQuickBgColor} onChange={e => setFeaturedQuickBgColor(e.target.value)} />
                  </div>
                  <input type="text" value={featuredQuickBgColor}
                    onChange={e => setFeaturedQuickBgColor(e.target.value)}
                    style={{ fontFamily: 'monospace', flex: 1 }} />
                </div>
                <button className="btn btn-primary"
                  style={{ width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)', boxShadow: '0 4px 20px rgba(102,126,234,0.35)' }}
                  onClick={() => submit('featured', {
                    advanced: { ...advanced, removeBg: true },
                    featured: { ...featured, bgColor: featuredQuickBgColor }
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
              {loading && loadingMsg.includes('Generating Square') ? 'Generating both…' : '⬇  Download Both (Square + Featured)'}
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
