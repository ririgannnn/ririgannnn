import { useState, useEffect, useRef } from 'react';
import { useStore } from '../stores';
import { Settings, X, Palette, RotateCcw, Download, Upload } from 'lucide-react';

const presetThemes = [
  { hue: 220, sat: 52, label: '雾蓝' },
  { hue: 260, sat: 45, label: '薰衣草' },
  { hue: 340, sat: 48, label: '藕粉' },
  { hue: 170, sat: 38, label: '灰青' },
  { hue: 30,  sat: 50, label: '陶土' },
  { hue: 0,   sat: 45, label: '砖红' },
  { hue: 120, sat: 35, label: '苔绿' },
  { hue: 50,  sat: 45, label: '燕麦' },
];

export default function SettingsPanel() {
  const { settings, updateSettings } = useStore();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sat = settings.primarySaturation ?? 52;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', `${settings.primaryHue} ${sat}% 48%`);
    root.style.setProperty('--sidebar-accent', `${settings.primaryHue} ${sat}% 48%`);
  }, [settings.primaryHue, sat]);

  const handleExport = () => {
    const raw = localStorage.getItem('personal-workspace');
    if (!raw) return;
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ririgannnn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.state) throw new Error('Invalid format');
        const existing = JSON.parse(localStorage.getItem('personal-workspace') || '{}');
        const merged = { ...existing, state: { ...existing.state, ...data.state } };
        localStorage.setItem('personal-workspace', JSON.stringify(merged));
        window.location.reload();
      } catch {
        alert('导入失败：文件格式不正确，请使用导出的 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg transition-colors"
        style={{ background: open ? 'var(--bg-deep)' : 'transparent' }}
      >
        <Settings size={17} style={{ color: 'var(--text-dim)' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl z-50 p-4 animate-scale-in"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Palette size={15} style={{ color: 'var(--kon-dark)' }} /> 个性化设置
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-black/5">
                <X size={15} style={{ color: 'var(--text-dim)' }} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>主题色（低饱和度预设）</p>
              <div className="grid grid-cols-4 gap-2">
                {presetThemes.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => updateSettings({ primaryHue: c.hue, primarySaturation: c.sat })}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all hover:bg-black/[0.03]"
                    style={{
                      outline: settings.primaryHue === c.hue ? `2px solid hsl(${c.hue} ${c.sat}% 48%)` : 'none',
                      outlineOffset: -1,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full"
                      style={{ background: `hsl(${c.hue} ${c.sat}% 48%)` }}
                    />
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>自定义色相</p>
              <input
                type="range" min={0} max={360} value={settings.primaryHue}
                onChange={(e) => updateSettings({ primaryHue: Number(e.target.value) })}
                className="w-full h-1.5"
                style={{ accentColor: `hsl(${settings.primaryHue} ${sat}% 48%)` }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                <span>0°</span>
                <span style={{ color: `hsl(${settings.primaryHue} ${sat}% 48%)` }}>{settings.primaryHue}°</span>
                <span>360°</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>饱和度</p>
              <input
                type="range" min={10} max={90} value={sat}
                onChange={(e) => updateSettings({ primarySaturation: Number(e.target.value) })}
                className="w-full h-1.5"
                style={{ accentColor: `hsl(${settings.primaryHue} ${sat}% 48%)` }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                <span>低</span>
                <span style={{ color: `hsl(${settings.primaryHue} ${sat}% 48%)` }}>{sat}%</span>
                <span>高</span>
              </div>
            </div>

            <button
              onClick={() => updateSettings({ primaryHue: 220, primarySaturation: 52, sidebarCollapsed: false })}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-lg transition-colors"
              style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}
            >
              <RotateCcw size={14} /> 恢复默认设置
            </button>

            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>数据备份</p>
              <div className="flex gap-2">
                <button onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors"
                  style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>
                  <Download size={13} /> 导出 JSON
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors"
                  style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>
                  <Upload size={13} /> 导入 JSON
                </button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              </div>
            </div>

            <p className="text-[10px] mt-3 text-center" style={{ color: 'var(--text-dim)' }}>
              数据自动保存在浏览器本地存储 &middot; Ririgannnn v1.0 &middot; 荔荔绀工作台
            </p>
          </div>
        </>
      )}
    </div>
  );
}
