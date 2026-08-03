import { useState, useEffect, useRef } from 'react';
import { useStore } from '../stores';
import { Settings, X, Palette, RotateCcw, Download, Upload } from 'lucide-react';

const presetColors = [
  { hue: 220, label: '蓝', class: 'bg-blue-500' },
  { hue: 260, label: '紫', class: 'bg-purple-500' },
  { hue: 340, label: '粉', class: 'bg-pink-500' },
  { hue: 170, label: '青', class: 'bg-teal-500' },
  { hue: 30, label: '橙', class: 'bg-orange-500' },
  { hue: 0, label: '红', class: 'bg-red-500' },
  { hue: 120, label: '绿', class: 'bg-green-500' },
  { hue: 50, label: '黄', class: 'bg-yellow-500' },
];

export default function SettingsPanel() {
  const { settings, updateSettings } = useStore();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', `${settings.primaryHue} 85% 48%`);
    root.style.setProperty('--sidebar-accent', `${settings.primaryHue} 85% 48%`);
  }, [settings.primaryHue]);

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
        className={`p-2 rounded-lg transition-colors ${open ? 'bg-muted' : 'hover:bg-muted'}`}
      >
        <Settings size={17} className="text-muted-fg" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/30 shadow-xl z-50 p-4 animate-scale-in" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Palette size={15} /> 个性化设置
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                <X size={15} className="text-muted-fg" />
              </button>
            </div>

            {/* Theme Color */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-fg mb-2">主题色</p>
              <div className="grid grid-cols-8 gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c.hue}
                    onClick={() => updateSettings({ primaryHue: c.hue })}
                    className={`w-7 h-7 rounded-full ${c.class} transition-transform hover:scale-110 ${
                      settings.primaryHue === c.hue ? 'ring-2 ring-offset-2 ring-offset-card ring-fg scale-110' : ''
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-fg mb-2">自定义色调</p>
              <input
                type="range" min={0} max={360} value={settings.primaryHue}
                onChange={(e) => updateSettings({ primaryHue: Number(e.target.value) })}
                className="w-full accent-primary h-1.5"
              />
              <div className="flex justify-between text-xs text-muted-fg mt-1">
                <span>0&deg;</span>
                <span style={{ color: `hsl(${settings.primaryHue}, 85%, 48%)` }}>{settings.primaryHue}&deg;</span>
                <span>360&deg;</span>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => updateSettings({ primaryHue: 220, sidebarCollapsed: false })}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors"
            >
              <RotateCcw size={14} /> 恢复默认设置
            </button>

            {/* Data Export / Import */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-fg mb-2">数据备份</p>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors"
                >
                  <Download size={13} /> 导出 JSON
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors"
                >
                  <Upload size={13} /> 导入 JSON
                </button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              </div>
            </div>

            <p className="text-[10px] text-muted-fg mt-3 text-center">
              数据自动保存在浏览器本地存储 &middot; Ririgannnn v1.0 &middot; 荔荔绀工作台
            </p>
          </div>
        </>
      )}
    </div>
  );
}
