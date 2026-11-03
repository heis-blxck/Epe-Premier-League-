import React, { useState, useEffect } from "react";
import { useURLModal } from "../hooks/useURLModal";
import { MatchVideo } from "../types";
import { api } from "../services/api";
import { Play, ArrowLeft, ThumbsUp } from "lucide-react";

import { VerifiedBadge } from "./VerifiedBadge";

interface VideoHighlightsHubProps {
  triggerToast?: (msg: string) => void;
  currentAdmin?: any;
  initialVideos?: MatchVideo[];
}

export const VideoHighlightsHub: React.FC<VideoHighlightsHubProps> = ({
  triggerToast,
  currentAdmin,
  initialVideos
}) => {
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) return url;
    
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      videoId = match[2];
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    
    return url;
  };

  const getVideoThumbnail = (video: MatchVideo) => {
    // If user provided a custom thumbnail url that isn't empty
    if (video.thumbnail_url && !video.thumbnail_url.includes("unsplash.com/photo-1508098682722")) {
      return video.thumbnail_url;
    }
    // Try YouTube thumbnail auto-extraction
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = (video.embed_url || "").match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    return video.thumbnail_url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";
  };

  const [videos, setVideos] = useState<MatchVideo[]>(initialVideos || []);
  const { isOpen: isVideoModalOpen, openModal: openVideoModal, closeModal: closeVideoModal, modalData: videoModalData } = useURLModal<{ videoId: string }>('videoPlayer');
  const activeVideo = isVideoModalOpen && videoModalData?.videoId ? videos.find(v => v.id === videoModalData.videoId) : null;

  

  const fetchVideos = async () => {
    if (initialVideos) return;
    try {
      const data = await api.getMatchVideos();
      setVideos(
        (data || []).sort(
          (a: MatchVideo, b: MatchVideo) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    } catch (err) {
      console.error("Failed to load match videos:", err);
    }
  };

  useEffect(() => {
    if (initialVideos) {
      setVideos(initialVideos);
    } else {
      fetchVideos();
    }
  }, [initialVideos]);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <Play className="w-4 h-4 text-amber-400 fill-amber-400 ml-0.5" />
          </div>
          <h3 className="text-xl font-black text-amber-400 font-serif uppercase tracking-wider">
            Videos for you
          </h3>
        </div>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="bg-slate-900/90 rounded-2xl p-8 shadow-xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 font-bold">No videos yet</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x">
          {videos.map((video) => {
            const thumbUrl = getVideoThumbnail(video);
            return (
              <div
                key={video.id}
                onClick={() => openVideoModal({ videoId: video.id })}
                className="w-[280px] h-[340px] rounded-xl overflow-hidden shrink-0 snap-start cursor-pointer group relative bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg"
              >
                <img
                  src={thumbUrl}
                  alt={video.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0 flex flex-col justify-end p-4"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
                  }}
                >
                  <h4 className="text-white font-bold leading-snug line-clamp-2 text-sm mb-1">
                    {video.title}
                  </h4>
                  {video.description && (
                    <p className="text-slate-300 text-xs line-clamp-2 mb-2 leading-relaxed font-normal">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-slate-300 font-bold text-[11px] truncate">
                      <span className="truncate">{video.author || "Official League Media"}</span>
                      <VerifiedBadge role={video.authorRole || 'official_league'} />
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{video.likesCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stage 2: Immersive Player & Playlist */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in">
          <div className="p-4 flex items-center justify-between bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <button
                onClick={() => closeVideoModal()}
                className="w-10 h-10 rounded-full bg-slate-900 hover:bg-amber-400 text-white hover:text-slate-950 transition-colors flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-white font-bold text-lg">Videos for you</h2>
            </div>
          </div>
          <div className="w-full aspect-video bg-black shrink-0 relative">
            <iframe
              src={getYouTubeEmbedUrl(activeVideo.embed_url)}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>

          <div className="p-4 bg-slate-950 shrink-0 border-b border-slate-800 flex flex-col gap-1">
            <h3 className="text-lg font-bold text-white line-clamp-2">
              {activeVideo.title}
            </h3>
            {activeVideo.description && (
              <p className="text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto mt-1">
                {activeVideo.description}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-4">
            {videos.map((video) => {
              const isPlaying = video.id === activeVideo.id;
              const itemThumb = getVideoThumbnail(video);
              return (
                <div
                  key={video.id}
                  onClick={() => !isPlaying && openVideoModal({ videoId: video.id })}
                  className={`flex gap-3 items-center cursor-pointer group ${isPlaying ? "" : "hover:bg-slate-900"} p-2 rounded-xl transition-colors relative`}
                >
                  <div className="w-32 aspect-video rounded-lg overflow-hidden relative shrink-0">
                    <img
                      src={itemThumb}
                      className="w-full h-full object-cover"
                      alt={video.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    {isPlaying ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold text-xs uppercase tracking-wider">
                          Now playing
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                        <Play className="w-6 h-6 text-white fill-white shadow-lg" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h4
                      className={`text-sm font-bold line-clamp-2 ${isPlaying ? "text-amber-400" : "text-slate-200 group-hover:text-white"}`}
                    >
                      {video.title}
                    </h4>
                    {video.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
