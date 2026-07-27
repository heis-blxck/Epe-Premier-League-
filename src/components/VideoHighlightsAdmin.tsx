import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Sparkles, Check, Video, Trash2, Calendar } from "lucide-react";
import { MatchVideo, AdminUser } from "../types";

interface VideoHighlightsAdminProps {
  showToast: (msg: string) => void;
  currentAdmin?: AdminUser | null;
}

export const VideoHighlightsAdmin: React.FC<VideoHighlightsAdminProps> = ({
  showToast,
  currentAdmin
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newEmbedUrl, setNewEmbedUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videos, setVideos] = useState<MatchVideo[]>([]);

  const fetchVideos = async () => {
    try {
      const data = await api.getMatchVideos();
      setVideos(
        (data || []).sort(
          (a: MatchVideo, b: MatchVideo) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    } catch (err) {
      console.error("Failed to load videos:", err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteVideo = async (id: string) => {
    try {
      await api.deleteMatchVideo(id);
      showToast("Video highlight deleted successfully");
      fetchVideos();
    } catch (err: any) {
      showToast(err.message || "Failed to delete video");
    } finally {
      setDeletingId(null);
    }
  };

  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    return "";
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newEmbedUrl.trim()) {
      showToast("Title and Embed URL are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalThumb = getYouTubeThumbnail(newEmbedUrl.trim()) ||
          "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";

      const vid: MatchVideo = {
        id: "vid-" + Date.now(),
        title: newTitle.trim(),
        embed_url: newEmbedUrl.trim(),
        thumbnail_url: finalThumb,
        source_platform: "YouTube",
        description: newDescription.trim(),
        created_at: new Date().toISOString(),
        likesCount: 0,
        author: currentAdmin?.name || "Official League FA",
        authorRole: currentAdmin?.role || "official_league",
        authorEmail: currentAdmin?.email
      };

      await api.saveMatchVideo(vid);
      showToast("Match video highlight published successfully!");

      setNewTitle("");
      setNewEmbedUrl("");
      setNewDescription("");
      fetchVideos();
    } catch (err: any) {
      showToast(err.message || "Failed to add video highlight");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVideoThumbnail = (video: MatchVideo) => {
    if (video.thumbnail_url && !video.thumbnail_url.includes("unsplash.com/photo-1508098682722")) {
      return video.thumbnail_url;
    }
    const ytThumb = getYouTubeThumbnail(video.embed_url || "");
    return ytThumb || video.thumbnail_url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-xl font-black text-slate-100 font-serif flex items-center gap-2">
          <Video className="w-5 h-5 text-amber-400" />
          Match Videos & Highlights Studio
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Publish YouTube, TikTok, or other video highlights to the main feed.
        </p>
      </div>

      <form onSubmit={handleAddVideo} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase mb-2 text-slate-300">
            Video Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Stunning Freekick Winner in Injury Time"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-2 text-slate-300">
            Embed URL (YouTube / TikTok / X Link) *
          </label>
          <input
            type="url"
            required
            placeholder="https://www.youtube.com/embed/..."
            value={newEmbedUrl}
            onChange={(e) => setNewEmbedUrl(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-2 text-slate-300">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Short summary or description of the video highlight..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting || !newTitle || !newEmbedUrl}
            className="bg-[#800020] hover:bg-rose-900 disabled:opacity-50 text-amber-300 font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-rose-700"
          >
            {isSubmitting ? (
              <>Publishing...</>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Publish Video
              </>
            )}
          </button>
        </div>
      </form>

      {videos.length > 0 && (
        <div className="pt-8 border-t border-slate-800 space-y-4">
          <h4 className="text-lg font-black text-slate-100 font-serif">
            Manage Existing Videos ({videos.length})
          </h4>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {videos.map((video) => {
              const thumb = getVideoThumbnail(video);
              return (
                <div
                  key={video.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 items-center"
                >
                  <img
                    src={thumb}
                    alt={video.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";
                    }}
                    className="w-24 h-16 object-cover rounded-lg shrink-0 border border-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-sm text-slate-100 truncate">
                      {video.title}
                    </h5>
                    {video.description && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1.5">
                      <span className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded uppercase">
                        {video.source_platform || "Video"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{" "}
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {deletingId === video.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1 border border-rose-500 cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setDeletingId(video.id);
                        setTimeout(() => {
                          setDeletingId((current) => (current === video.id ? null : current));
                        }, 4000);
                      }}
                      className="w-9 h-9 rounded-full bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 flex items-center justify-center font-bold cursor-pointer shrink-0 transition-colors border border-rose-800/40"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
