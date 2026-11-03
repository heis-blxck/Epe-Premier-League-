import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link, Sparkles, Check, X } from 'lucide-react';

interface MediaUploaderProps {
  currentUrl?: string;
  onMediaSelect?: (url: string) => void;
  onSelectUrl?: (url: string) => void;
  label?: string;
  presetCategory?: 'app_icon' | 'team_crest' | 'player_photo' | 'coach_photo' | 'article_cover';
  onErrorToast?: (msg: string) => void;
  accept?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ accept = "image/*",
  currentUrl,
  onMediaSelect,
  onSelectUrl,
  label = 'Upload Image / Media',
  presetCategory = 'team_crest',
  onErrorToast
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (url: string) => {
    if (onMediaSelect) onMediaSelect(url);
    if (onSelectUrl) onSelectUrl(url);
  };

  // High-quality category presets
  const presets = {
    app_icon: [
      { name: 'Gold Trophy Crest', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80' },
      { name: 'Crown Emblem', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=200&q=80' },
      { name: 'Shield Star', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80' },
      { name: 'Lion Badge', url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=200&q=80' }
    ],
    team_crest: [
      { name: 'Epe United Shield', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80' },
      { name: 'Alaro City Crest', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=200&q=80' },
      { name: 'Atlantic Tigers Emblem', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80' },
      { name: 'Warriors Badge', url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=200&q=80' },
      { name: 'Poka Lions', url: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=200&q=80' }
    ],
    player_photo: [
      { name: 'Forward Pro', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
      { name: 'Winger Ace', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
      { name: 'Midfield Star', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
      { name: 'Defender Solid', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80' },
      { name: 'Keeper Gloves', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80' }
    ],
    coach_photo: [
      { name: 'Coach Segun', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80' },
      { name: 'Coach Clement', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80' },
      { name: 'Coach Samson', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80' }
    ],
    article_cover: [
      { name: 'Stadium Atmosphere', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80' },
      { name: 'Match Action Night', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80' },
      { name: 'Trophy Celebration', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80' },
      { name: 'Training Pitch', url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80' }
    ]
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        if (resultUrl) {
          const img = new Image();
          img.onerror = () => { if (onErrorToast) onErrorToast('Failed to load image format.'); setUploadError('Invalid image format'); };
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round(width * (MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedUrl = canvas.toDataURL('image/webp', 0.8);
              setPreviewUrl(compressedUrl);
              notify(compressedUrl);
            } else {
               setPreviewUrl(resultUrl);
               notify(resultUrl);
            }
          };
          img.src = resultUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setPreviewUrl(urlInput.trim());
      notify(urlInput.trim());
    }
  };

  const handleSelectPreset = (url: string) => {
    setPreviewUrl(url);
    setUrlInput(url);
    notify(url);
  };

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>{label}</span>
        </label>
        {previewUrl && (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
            <Check className="w-3 h-3" /> Image Selected
          </span>
        )}
      </div>

      {uploadError && (
        <div className="bg-rose-950 border border-rose-700 text-rose-200 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2">
          <span>⚠️ {uploadError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'upload' ? 'bg-[#800020] text-amber-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>File Upload</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'url' ? 'bg-[#800020] text-amber-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          <span>Web URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'presets' ? 'bg-[#800020] text-amber-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Presets</span>
        </button>
      </div>

      {/* Preview Box */}
      {previewUrl && (
        <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
          <div className="w-14 h-14 rounded-lg overflow-hidden border border-amber-400/40 bg-slate-950 shrink-0">
            <img src={previewUrl} alt="Selected Media" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-[11px] font-mono text-slate-400 truncate">
            {previewUrl.startsWith('data:') ? 'Local Digital Image File (Base64)' : previewUrl}
          </div>
          <button
            type="button"
            onClick={() => {
              setPreviewUrl('');
              notify('');
            }}
            className="p-1 rounded-md text-rose-400 hover:bg-rose-950/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Local File Upload */}
      {activeTab === 'upload' && (
        <label className="block border-2 border-dashed border-slate-800 hover:border-amber-400/60 bg-slate-900/60 hover:bg-slate-900 p-4 rounded-xl text-center cursor-pointer transition-all space-y-2">
          <input
            type="file"
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-400 mx-auto flex items-center justify-center pointer-events-none">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-200 pointer-events-none">
            Tap to upload digital media file from device
          </p>
          <p className="text-[10px] text-slate-500 pointer-events-none">
            Supports PNG, JPG, WEBP, SVG
          </p>
        </label>
      )}

      {/* Tab 2: Custom URL */}
      {activeTab === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/logo.png"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (urlInput.trim()) {
                  setPreviewUrl(urlInput.trim());
                  notify(urlInput.trim());
                }
              }
            }}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={() => {
              if (urlInput.trim()) {
                setPreviewUrl(urlInput.trim());
                notify(urlInput.trim());
              }
            }}
            className="bg-[#800020] hover:bg-rose-900 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Tab 3: Presets */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
          {presets[presetCategory].map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p.url)}
              className="group border border-slate-800 hover:border-amber-400 rounded-lg p-1 bg-slate-900 transition-all text-left cursor-pointer"
            >
              <img src={p.url} alt={p.name} className="w-full h-10 object-cover rounded mb-1" />
              <span className="text-[9px] font-bold text-slate-300 line-clamp-1 group-hover:text-amber-300">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
