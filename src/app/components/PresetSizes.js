'use client';

const PRESETS = [
  { label: 'Square', name: '500×500', w: 500, h: 500 },
  { label: 'HD', name: '1280×720', w: 1280, h: 720 },
  { label: 'Full HD', name: '1920×1080', w: 1920, h: 1080 },
  { label: 'Instagram', name: '1080×1080', w: 1080, h: 1080 },
  { label: 'Story', name: '1080×1920', w: 1080, h: 1920 },
  { label: 'Twitter', name: '1200×675', w: 1200, h: 675 },
  { label: 'OG Image', name: '1200×628', w: 1200, h: 628 },
  { label: 'Thumbnail', name: '300×300', w: 300, h: 300 },
  { label: 'Banner', name: '728×90', w: 728, h: 90 },
  { label: 'Custom', name: '', w: null, h: null },
];

export default function PresetSizes({ width, height, onChange }) {
  const active = PRESETS.find(p => p.w === width && p.h === height);

  return (
    <div>
      <div className="presets-grid">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`preset-btn${active?.label === p.label ? ' active' : ''}`}
            onClick={() => p.w && onChange(p.w, p.h)}
            type="button"
          >
            {p.label}
            <span className="preset-name">{p.name}</span>
          </button>
        ))}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Width (px)</label>
          <input
            type="number"
            value={width}
            min={10} max={8000}
            onChange={(e) => onChange(parseInt(e.target.value) || width, height)}
          />
        </div>
        <div className="form-group">
          <label>Height (px)</label>
          <input
            type="number"
            value={height}
            min={10} max={8000}
            onChange={(e) => onChange(width, parseInt(e.target.value) || height)}
          />
        </div>
      </div>
    </div>
  );
}
