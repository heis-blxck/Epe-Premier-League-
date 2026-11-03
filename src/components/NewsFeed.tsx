import React, { useState, useMemo } from "react";
import { useURLModal } from "../hooks/useURLModal";

import { VerifiedBadge } from "./VerifiedBadge";
import { NewsArticle, AdminUser, MatchVideo, EplHighlight } from "../types";
import {
  Newspaper,
  Calendar,
  Heart,
  MessageSquare,
  Share2,
  Send,
  Check,
  Sparkles,
  BookOpen,
  UserCheck,
  Lock,
  X,
  Megaphone,
  ArrowLeft,
} from "lucide-react";
import { api } from "../services/api";
import { VideoHighlightsHub } from "./VideoHighlightsHub";

import { EplHighlightPoster } from "./EplHighlightPoster";

interface NewsFeedProps {
  currentUser?: import("../types").UserAccount | null;
  news: NewsArticle[];
  onNewsUpdated?: () => void;
  currentAdmin?: AdminUser | null;
  onShowToast?: (msg: string) => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  news = [],
  currentUser,
  onNewsUpdated,
  currentAdmin,
  onShowToast,
}) => {
  
  
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);



  const publishedNews = (news || [])
    .filter(
      (n) =>
        n.status === "published" ||
        n.isPublished === true ||
        (!n.status && n.isPublished === undefined),
    )
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  const topNews = publishedNews.slice(0, 3);
  const featured = topNews[0];
  const rest = topNews.slice(1);

  const { isOpen: isNewsModalOpen, openModal: openNewsModal, closeModal: closeNewsModal, modalData: newsModalData } = useURLModal<{ articleId: string; stage: 'teaser' | 'reader' }>('newsArticle');

  const teaserArticle = isNewsModalOpen && newsModalData?.stage === 'teaser' ? publishedNews.find(n => n.id === newsModalData.articleId) : null;
  const selectedArticle = isNewsModalOpen && newsModalData?.stage === 'reader' ? publishedNews.find(n => n.id === newsModalData.articleId) : null;

  

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail.trim()) {
      setSubscriptionSuccess(true);
      setTimeout(() => setSubscriptionSuccess(false), 4000);
      setSubscribedEmail("");
    }
  };

  const handleLike = async (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasLiked[articleId]) return;

    try {
      setHasLiked((prev) => ({ ...prev, [articleId]: true }));
      await api.likeNews(articleId);
      if (onNewsUpdated) onNewsUpdated();
    } catch (err: any) {
      setHasLiked((prev) => ({ ...prev, [articleId]: false }));
      console.error("Failed to like article:", err);
      if (onShowToast) onShowToast(err.message || "Failed to like article");
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle || !commentText.trim()) return;

    setIsPostingComment(true);
    try {
      await api.addNewsComment(selectedArticle.id, {
        authorName: currentUser?.name || "Anonymous Fan",
        content: commentText.trim(),
      });
      // modal will automatically re-render with updated article
      setCommentText("");
      if (onNewsUpdated) onNewsUpdated();
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      if (onShowToast) onShowToast(err.message || "Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleShare = (article: NewsArticle) => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [highlights, setHighlights] = useState<EplHighlight[]>([]);
  const [isPreloading, setIsPreloading] = useState(true);

  React.useEffect(() => {
    let isMounted = true;
    const preloadAssets = async () => {
      try {
        const [videosData, highlightsData] = await Promise.all([
          api.getMatchVideos(),
          api.getEplHighlights()
        ]);
        
        if (!isMounted) return;

        const getTs = (id: string) => {
          const p = id.split("-");
          return p.length > 1 ? parseInt(p[p.length - 1], 10) : 0;
        };

        const sortedVideos = (videosData || []).sort(
          (a: MatchVideo, b: MatchVideo) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const sortedHighlights = (highlightsData || []).sort(
          (a: EplHighlight, b: EplHighlight) => getTs(b.id) - getTs(a.id),
        );

        setVideos(sortedVideos);
        setHighlights(sortedHighlights);

        // Thumbnail helper
        const getVideoThumbnail = (video: MatchVideo) => {
          if (video.thumbnail_url && !video.thumbnail_url.includes("unsplash.com/photo-1508098682722")) {
            return video.thumbnail_url;
          }
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
          const match = (video.embed_url || "").match(regExp);
          if (match && match[2] && match[2].length === 11) {
            return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
          }
          return video.thumbnail_url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80";
        };

        const topNewsImages = topNews.map(n => n.coverImageUrl || n.coverImage).filter(Boolean);
        const topVideoImages = sortedVideos.slice(0, 3).map(getVideoThumbnail).filter(Boolean);
        const highlightImages = sortedHighlights.slice(0, 3).map(h => h.posterImageUrl).filter(Boolean);

        const allImages = [...topNewsImages, ...topVideoImages, ...highlightImages];

        await Promise.all(
          allImages.map((src) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.src = src;
              img.onload = resolve;
              img.onerror = resolve; // resolve even on error to not block UI
            });
          })
        );
        
        if (isMounted) setIsPreloading(false);
      } catch (err) {
        console.error("Preload error", err);
        if (isMounted) setIsPreloading(false); // fallback
      }
    };
    
    preloadAssets();
    
    return () => { isMounted = false; };
  }, [news]); // Depend on news to re-evaluate if needed

  if (isPreloading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="bg-slate-900/60 rounded-2xl h-[400px] w-full"></div>
        <div className="bg-slate-900/60 rounded-2xl h-[200px] w-full"></div>
        <div className="bg-slate-900/60 rounded-2xl h-[340px] w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 ease-out">
      {/* Top News Container */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Megaphone className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-black text-amber-400 font-serif uppercase tracking-wider">
            Top news
          </h3>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4 shadow-xl border border-slate-800 space-y-4">
          {featured && (
            <div
              onClick={() => openNewsModal({ articleId: featured.id, stage: 'teaser' })}
              className="cursor-pointer group flex flex-col gap-3"
            >
              <div className="w-full aspect-video rounded-t-xl overflow-hidden relative">
                <img
                  src={featured.coverImageUrl || featured.coverImage}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-2 pb-3 border-b border-slate-800/60">
                <h3 className="text-lg font-black text-slate-100 group-hover:text-amber-400 transition-colors leading-snug font-serif">
                  {featured.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 flex-wrap">
                  <span className="bg-[#800020] text-amber-300 px-2 py-0.5 rounded uppercase">
                    {featured.issueLabel || featured.category}
                  </span>
                  <span>&bull;</span>
                  <span>
                    {new Date(featured.publishedAt).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )}
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1 text-slate-200 font-extrabold bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                    <span>{featured.author || "Official League FA"}</span>
                    <VerifiedBadge role={featured.authorRole || (featured.author?.toLowerCase().includes("official") ? 'official_league' : 'news_reporter')} className="w-3.5 h-3.5 inline-block ml-0.5 align-middle shrink-0" />
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-1">
            {rest.map((article) => (
              <div
                key={article.id}
                onClick={() => openNewsModal({ articleId: article.id, stage: 'teaser' })}
                className="flex flex-row items-center gap-3 cursor-pointer group"
              >
                <img
                  src={article.coverImageUrl || article.coverImage}
                  alt={article.title}
                  className="w-[110px] h-[75px] rounded-lg object-cover shrink-0 group-hover:opacity-80 transition-opacity"
                />
                <div className="flex flex-col gap-1.5 flex-1">
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 flex-wrap">
                    <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase">
                      {article.issueLabel || article.category}
                    </span>
                    <span>&bull;</span>
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-slate-200 font-extrabold bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                      <span>{article.author || "Official League FA"}</span>
                      <VerifiedBadge role={article.authorRole || (article.author?.toLowerCase().includes("official") ? 'official_league' : 'news_reporter')} className="w-3 h-3 inline-block ml-0.5 align-middle shrink-0" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Substack Publication Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/60 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 text-slate-100 relative overflow-hidden backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#800020]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex-1 space-y-2 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#800020] text-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-rose-800 shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Gazette Dispatch
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif leading-tight">
            The Epe Premier League Gazette
          </h1>

          <p className="text-xs text-slate-300 font-sans hidden md:block">
            Tactical breakdowns, scouting reports, and football journalism from
            Epe Division.
          </p>
        </div>

        {/* Substack Email Subscriber Bar */}
        <div className="relative z-10 w-full md:w-auto md:min-w-[320px]">
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter email for free dispatches..."
              value={subscribedEmail}
              onChange={(e) => setSubscribedEmail(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="bg-[#800020] hover:bg-rose-900 text-amber-300 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-rose-700 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Subscribe</span>
            </button>
          </form>

          {subscriptionSuccess && (
            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-2 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800 animate-in fade-in absolute -bottom-8">
              <Check className="w-3 h-3 text-emerald-400" />
              Subscribed to the Gazette!
            </div>
          )}
        </div>
      </div>

      {/* Video Highlights & Media Hub */}
      <VideoHighlightsHub
        currentAdmin={currentAdmin}
        triggerToast={onShowToast || ((m) => console.log(m))}
        initialVideos={videos}
      />

      {/* EPL Highlight Poster */}
      <EplHighlightPoster
        currentAdmin={currentAdmin}
        triggerToast={onShowToast || ((m) => console.log(m))}
        initialHighlights={highlights}
      />

      {/* Teaser Preview Modal (Stage 2) */}
      {teaserArticle && !selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in slide-in-from-bottom-4 overflow-y-auto">
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => closeNewsModal()}
              className="w-10 h-10 bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-amber-400 hover:text-[#800020] transition-colors border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full h-[45vh] sm:h-[55vh] relative shrink-0">
            <img
              src={teaserArticle.coverImageUrl || teaserArticle.coverImage}
              alt={teaserArticle.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 flex-wrap">
              <span className="bg-[#800020] text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-md border border-rose-800">
                {teaserArticle.issueLabel || teaserArticle.category}
              </span>
              <span className="text-slate-300 text-xs font-bold shadow-sm">
                {new Date(teaserArticle.publishedAt).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "short", year: "numeric" },
                )}
              </span>
              <span className="text-amber-300 text-xs font-black shadow-sm flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-md border border-amber-500/30">
                <span>By {teaserArticle.author || "Official League FA"}</span>
                <VerifiedBadge role={teaserArticle.authorRole || (teaserArticle.author?.toLowerCase().includes("official") ? 'official_league' : 'news_reporter')} className="w-4 h-4 inline-block ml-0.5 align-middle shrink-0" />
              </span>
            </div>
          </div>

          <div className="flex-1 px-6 pt-4 pb-8 flex flex-col max-w-3xl mx-auto w-full">
            <h2 className="text-2xl sm:text-4xl font-black text-white font-serif leading-tight mb-4">
              {teaserArticle.title}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-auto line-clamp-3">
              {teaserArticle.summaryExcerpt || teaserArticle.summary}
            </p>

            <button
              onClick={() => openNewsModal({ articleId: teaserArticle?.id, stage: 'reader' })}
              className="mt-8 w-full border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-[#800020] font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>[ ↗ READ ARTICLE ]</span>
            </button>
          </div>
        </div>
      )}

      {/* Substack Full Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto border border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-100">
            {/* Top Bar */}
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => closeNewsModal()}
                  className="mr-2 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Newspaper className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black tracking-widest text-slate-200 uppercase">
                  SUBSTACK DISPATCH &bull;{" "}
                  {selectedArticle.issueLabel || "EPL GAZETTE"}
                </span>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-10 space-y-6">
              {/* Header Title & Subtitle */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
                  <span className="bg-[#800020] text-amber-300 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-800">
                    {selectedArticle.category}
                  </span>
                  <span>&bull;</span>
                  <span>{selectedArticle.readTime || "4 min read"}</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(selectedArticle.publishedAt).toLocaleDateString(
                      "en-GB",
                      { timeZone: "Africa/Lagos" },
                    )}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-slate-100 leading-tight font-serif">
                  {selectedArticle.title}
                </h1>

                {selectedArticle.subtitle && (
                  <h2 className="text-base sm:text-lg font-bold text-slate-300 italic font-sans leading-relaxed">
                    {selectedArticle.subtitle}
                  </h2>
                )}
              </div>

              {/* Substack Author Byline Box */}
              <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      selectedArticle.authorAvatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    }
                    alt={selectedArticle.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/60 shadow-md"
                  />
                  <div>
                    <div className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{selectedArticle.author}</span>
                      <VerifiedBadge role={selectedArticle.authorRole || 'news_reporter'} />
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {(selectedArticle.authorRole?.toUpperCase() === 'LEAGUE_OFFICIAL' || selectedArticle.authorRole?.toUpperCase() === 'OFFICIAL_LEAGUE') ? 'Football Association' : (selectedArticle.customReporterRole || selectedArticle.authorTitle || 'Reporter')}
                    </div>
                  </div>
                </div>

                {/* Substack Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(selectedArticle.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      hasLiked[selectedArticle.id]
                        ? "bg-rose-950 border-rose-700 text-rose-300"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${hasLiked[selectedArticle.id] ? "fill-rose-400 text-rose-400" : ""}`}
                    />
                    <span>
                      {(selectedArticle.likesCount || 0) +
                        (hasLiked[selectedArticle.id] ? 1 : 0)}
                    </span>
                  </button>

                  <button
                    onClick={() => handleShare(selectedArticle)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                    title="Share Dispatch"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {copiedLink && (
                <div className="bg-emerald-950 text-emerald-300 text-xs font-bold p-2 rounded-lg text-center border border-emerald-800">
                  Article link copied to clipboard!
                </div>
              )}

              {/* Cover Photo */}
              <div className="rounded-2xl overflow-hidden aspect-video border border-slate-800 shadow-xl">
                <img
                  src={selectedArticle.coverImage}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Substack Callout Quote Box */}
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-5 rounded-2xl border-l-4 border-amber-400 border-y border-r border-slate-800/80 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  KEY DISPATCH SUMMARY
                </p>
                <p className="text-sm font-semibold text-slate-200 leading-relaxed italic">
                  "{selectedArticle.summary}"
                </p>
              </div>

              {/* Article Content */}
              <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line font-serif space-y-4 pt-2 border-b border-slate-800 pb-8">
                {selectedArticle.fullBodyContent || selectedArticle.content}
              </div>

              {/* Substack Comments Section */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    <span>
                      Discussion & Comments (
                      {selectedArticle.comments?.length || 0})
                    </span>
                  </h3>
                </div>

                {/* Comment Form */}
                <form
                  onSubmit={handlePostComment}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
                >
                  <textarea
                    required
                    rows={3}
                    placeholder="Join the discussion... What are your thoughts on this dispatch?"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Posting as:{" "}
                      <strong className="text-amber-400">
                        {currentUser?.name || "Anonymous Fan"}
                      </strong>
                    </span>
                    <button
                      type="submit"
                      disabled={isPostingComment}
                      className="bg-[#800020] hover:bg-rose-900 text-amber-300 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow border border-rose-800 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isPostingComment ? "Posting..." : "Post Comment"}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Comment List */}
                <div className="space-y-3">
                  {!selectedArticle.comments ||
                  selectedArticle.comments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      No comments yet. Be the first to share your perspective on
                      this Substack dispatch!
                    </p>
                  ) : (
                    selectedArticle.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                comment.avatarUrl ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                              }
                              alt={comment.authorName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                            <span className="text-xs font-bold text-slate-200">
                              {comment.authorName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {new Date(comment.timestamp).toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Africa/Lagos",
                              },
                            )}{" "}
                            WAT
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 pl-9 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
