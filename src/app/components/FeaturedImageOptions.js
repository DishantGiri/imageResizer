'use client';
import { useState } from 'react';
import { ChevronIcon } from './Icons';

export default function FeaturedImageOptions({ options, onChange }) {
  const [open, setOpen] = useState(false);

  const FEATURED_PRESETS = [
    { label: 'OG / WordPress', w: 1200, h: 628 },
    { label: 'Facebook', w: 1200, h: 630 },
    { label: 'Twitter Card', w: 1200, h: 675 },
    { label: 'LinkedIn', w: 1200, h: 627 },
    { label: 'YouTube', w: 1280, h: 720 },
    { label: 'Email Header', w: 600, h: 200 },
  ];

  return (
    <div className="featured-section">
      <button
        type="button"
        className={`advanced-toggle${open ? ' open' : ''}`}
        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--accent)', justifyContent: 'flex-start' }}
        onClick={() => setOpen(o => !o)}
      >
        <ChevronIcon />
        ✦ Featured / Social Image Creator
      </button>

      <div className={`advanced-panel${open ? ' open' : ''}`}>
        <div style={{ paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Create a canvas with a solid or gradient background, perfect for blog featured images and social media headers.
          </p>

          <div className="presets-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {FEATURED_PRESETS.map(p => (
              <button key={p.label} type="button" className="preset-btn"
                onClick={() => onChange({ ...options, canvasWidth: p.w, canvasHeight: p.h })}>
                {p.label}
                <span className="preset-name">{p.w}×{p.h}</span>
              </button>
            ))}
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Canvas Width (px)</label>
              <input type="number" value={options.canvasWidth} min={100} max={4000}
                onChange={e => onChange({ ...options, canvasWidth: parseInt(e.target.value) || 1200 })} />
            </div>
            <div className="form-group">
              <label>Canvas Height (px)</label>
              <input type="number" value={options.canvasHeight} min={100} max={4000}
                onChange={e => onChange({ ...options, canvasHeight: parseInt(e.target.value) || 628 })} />
            </div>
          </div>

          <div className="color-row" style={{ marginTop: '0.5rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Background Color</label>
              <div className="color-picker-group">
                <div className="color-swatch">
                  <input type="color" value={options.bgColor}
                    onChange={e => onChange({ ...options, bgColor: e.target.value })} />
                </div>
                <input type="text" value={options.bgColor}
                  onChange={e => onChange({ ...options, bgColor: e.target.value })}
                  style={{ fontFamily: 'monospace' }} />
              </div>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Gradient End Color (optional)</label>
              <div className="color-picker-group">
                <div className="color-swatch">
                  <input type="color" value={options.gradientColor || '#000000'}
                    onChange={e => onChange({ ...options, gradientColor: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                  <input type="text" value={options.gradientColor || ''}
                    placeholder="None"
                    onChange={e => onChange({ ...options, gradientColor: e.target.value || null })}
                    style={{ fontFamily: 'monospace' }} />
                  {options.gradientColor && (
                    <button type="button" className="btn btn-sm btn-danger"
                      onClick={() => onChange({ ...options, gradientColor: null })}>✕</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Top Padding (px)</label>
              <input type="number" value={options.paddingTop} min={0} max={300}
                onChange={e => onChange({ ...options, paddingTop: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>Bottom Padding (px)</label>
              <input type="number" value={options.paddingBottom} min={0} max={300}
                onChange={e => onChange({ ...options, paddingBottom: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
