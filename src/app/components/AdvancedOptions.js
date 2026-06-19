'use client';
import { useState } from 'react';
import { ChevronIcon } from './Icons';

export default function AdvancedOptions({ options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '1rem' }}>
      <button
        type="button"
        className={`advanced-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <ChevronIcon />
        Advanced Options
      </button>

      <div className={`advanced-panel${open ? ' open' : ''}`}>
        <div style={{ paddingTop: '1.25rem' }}>
          <div className="info-box">
            <strong>Processing Flow:</strong> AI removes background → transparent edges are trimmed tight around the object → image is stretched to your size → background color is applied.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Top Padding (px)</label>
              <input type="number" value={options.paddingTop} min={0} max={500}
                onChange={e => onChange({ ...options, paddingTop: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>Bottom Padding (px)</label>
              <input type="number" value={options.paddingBottom} min={0} max={500}
                onChange={e => onChange({ ...options, paddingBottom: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Background Color (For Transparent Images)</label>
            <div className="color-picker-group">
              <div className="color-swatch">
                <input type="color" value={options.bgColor || '#000000'}
                  onChange={e => onChange({ ...options, bgColor: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                <input type="text" value={options.bgColor || ''}
                  placeholder="Transparent"
                  onChange={e => onChange({ ...options, bgColor: e.target.value || null })}
                  style={{ fontFamily: 'monospace' }} />
                {options.bgColor && (
                  <button type="button" className="btn btn-sm btn-danger"
                    onClick={() => onChange({ ...options, bgColor: null })}>✕</button>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={options.removeBg || false} 
                onChange={e => onChange({ ...options, removeBg: e.target.checked })} 
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent)' }}
              />
              Remove Original Background (AI)
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Automatically isolates the subject before resizing, compressing, or adding the new background color.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
