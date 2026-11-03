import React, { useState, useEffect } from 'react';
import { Advertisement } from '../types';
import { api } from '../services/api';
import { Megaphone, Plus, Trash2, Edit2, Save, X, ExternalLink, Video, Image as ImageIcon, Clock } from 'lucide-react';
import { MediaUploader } from './MediaUploader';

interface Props {
  onShowToast: (msg: string) => void;
}

export function AdsManager({ onShowToast }: Props) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Advertisement>>({});
  const [sendPush, setSendPush] = useState(false);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdvertisements();
      setAds(data);
    } catch (err) {
      console.error(err);
      onShowToast('Failed to load advertisements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleAddNew = () => {
    setFormData({
      id: `ad_${Date.now()}`,
      companyName: '',
      mediaType: 'image',
      mediaUrl: '',
      imageUrl: '',
      linkUrl: '',
      targetLink: '',
      duration: 15,
      isActive: true,
      position: 'sidebar'
    });
    setSendPush(false);
    setIsEditing('new');
  };

  const handleEdit = (ad: Advertisement) => {
    setFormData({
      ...ad,
      mediaType: ad.mediaType || 'image',
      mediaUrl: ad.mediaUrl || ad.imageUrl || '',
      targetLink: ad.targetLink || ad.linkUrl || '',
      duration: ad.duration || 15
    });
    setSendPush(false);
    setIsEditing(ad.id);
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMediaUrl = formData.mediaUrl || formData.imageUrl;
    const finalTargetLink = formData.targetLink || formData.linkUrl;

    if (!formData.companyName || !finalMediaUrl || !finalTargetLink || !formData.position) {
      onShowToast('Please fill all required fields (Company, Media URL, Target Link, Position)');
      return;
    }

    const adToSave: Advertisement = {
      id: formData.id || `ad_${Date.now()}`,
      companyName: formData.companyName,
      mediaType: formData.mediaType || 'image',
      mediaUrl: finalMediaUrl,
      imageUrl: finalMediaUrl, // Backward compatibility
      targetLink: finalTargetLink,
      linkUrl: finalTargetLink, // Backward compatibility
      duration: formData.mediaType === 'video' ? (Number(formData.duration) || 15) : undefined,
      isActive: formData.isActive ?? true,
      position: formData.position || 'sidebar'
    };

    try {
      await api.saveAdvertisement(adToSave);
      
      if (sendPush) {
        await api.createNotification({
          title: `📢 Special Offer: ${formData.companyName}`,
          message: `Check out our new sponsor: ${formData.companyName}! Tap here to see the deal.`,
          type: 'ad_broadcast',
          eventType: 'Sponsored Ad Broadcasts'
        });
      }

      onShowToast(`Advertisement for ${formData.companyName} saved successfully`);
      setIsEditing(null);
      setFormData({});
      fetchAds();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save advertisement');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAdvertisement(id);
      onShowToast('Advertisement deleted successfully');
      fetchAds();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete advertisement');
    }
  };

  const handleToggleStatus = async (ad: Advertisement) => {
    try {
      await api.saveAdvertisement({ ...ad, isActive: !ad.isActive });
      onShowToast(`Advertisement ${ad.isActive ? 'disabled' : 'enabled'}`);
      fetchAds();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to toggle advertisement status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#800020]/20 border border-[#800020]/40 rounded-xl text-[#800020]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Sponsor Advertisements</h3>
            <p className="text-xs text-slate-400">Manage optimized image & video ad campaigns</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#800020] text-amber-300 font-bold text-sm rounded-xl hover:bg-rose-900 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Campaign
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 bg-slate-800/40 p-5 rounded-xl border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Sponsor / Company Name</label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#800020]"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Display Position</label>
              <select
                value={formData.position || 'sidebar'}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#800020]"
              >
                <option value="top">Top Banner</option>
                <option value="sidebar">Sidebar Rectangle</option>
                <option value="footer">Footer Banner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Media Format</label>
              <select
                value={formData.mediaType || 'image'}
                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'image' | 'video' })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#800020]"
              >
                <option value="image">Static Image Banner</option>
                <option value="video">Optimized Video Ad (.mp4 / Storage Bucket)</option>
              </select>
            </div>

            {formData.mediaType === 'video' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Video Duration (Seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.duration || 15}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#800020]"
                  placeholder="e.g. 5 or 15"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Media Type Indicator</label>
                <div className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Standard High-Res Image Banner
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Target Link (Click URL)</label>
              <input
                type="url"
                value={formData.targetLink || formData.linkUrl || ''}
                onChange={(e) => setFormData({ ...formData, targetLink: e.target.value, linkUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#800020]"
                placeholder="https://"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                {formData.mediaType === 'video' ? 'Firebase Cloud Storage / CDN Video File URL' : 'Image / Banner URL'}
              </label>
              <input
                type="url"
                value={formData.mediaUrl || formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value, imageUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#800020] mb-2"
                placeholder={formData.mediaType === 'video' ? "https://storage.googleapis.com/.../ad_video.mp4" : "https://..."}
                required
              />
              <MediaUploader
                currentUrl={formData.mediaUrl || formData.imageUrl}
                onSelectUrl={(url) => setFormData({ ...formData, mediaUrl: url, imageUrl: url })}
                label="Upload Banner / Video Poster Asset"
                presetCategory="article_cover"
                onErrorToast={onShowToast}
              />
            </div>

            <div className="flex flex-col gap-3 mt-2 md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#800020] rounded border-slate-700 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-300 cursor-pointer">Campaign Active</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendPush"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="w-4 h-4 text-[#800020] rounded border-slate-700 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="sendPush" className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                  Send Push Notification
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Marketing</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-[#800020] hover:bg-rose-900 text-amber-300 font-bold rounded-lg transition-colors shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Campaign
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-700 rounded-xl">
              <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium mb-1">No Active Campaigns</p>
              <p className="text-sm text-slate-500">Create an advertisement campaign to display to users.</p>
            </div>
          ) : (
            ads.map((ad) => {
              const isVideo = ad.mediaType === 'video' || (ad.mediaUrl || ad.imageUrl || '').match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
              const mediaSrc = ad.mediaUrl || ad.imageUrl;
              const targetLink = ad.targetLink || ad.linkUrl;

              return (
                <div key={ad.id} className={`border rounded-xl overflow-hidden flex flex-col bg-slate-800/30 ${ad.isActive ? 'border-amber-500/30' : 'border-slate-700 opacity-60'}`}>
                  <div className="h-36 bg-slate-900 relative">
                    {isVideo ? (
                      <video
                        src={mediaSrc}
                        muted
                        playsInline
                        loop
                        controls={false}
                        preload="metadata"
                        className="w-full h-full object-cover bg-slate-950"
                      />
                    ) : (
                      <img src={mediaSrc} alt={ad.companyName} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md backdrop-blur-md ${ad.isActive ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-300'}`}>
                        {ad.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md backdrop-blur-md bg-slate-900/80 text-cyan-300">
                        {ad.position}
                      </span>
                      <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md backdrop-blur-md bg-amber-500/90 text-slate-950 flex items-center gap-1">
                        {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                        {isVideo ? `${ad.duration || 15}s` : 'IMG'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-slate-200 mb-1 truncate">{ad.companyName}</h4>
                    <a href={targetLink} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-4 truncate">
                      {targetLink} <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-700/50">
                      <button
                        onClick={() => handleToggleStatus(ad)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${ad.isActive ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/80'}`}
                      >
                        {ad.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(ad)} className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-900 rounded-md transition-colors cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ad.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-900 rounded-md transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

