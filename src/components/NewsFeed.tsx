import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { Newspaper, Calendar, Heart, MessageSquare, Share2, Send, Check, Sparkles, BookOpen, UserCheck, Lock, X } from 'lucide-react';
import { api } from '../services/api';

interface NewsFeedProps {
  news: NewsArticle[];
  onNewsUpdated?: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, onNewsUpdated }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Show only verified/published articles in the public feed
  const publishedNews = news.filter(n => n.status === 'published' || n.isPublished === true || (!n.status && n.isPublished === undefined));
  const featured = publishedNews.find(n => n.featured) || publishedNews[0];
  const rest = publishedNews.filter(n => n.id !== featured?.id);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail.trim()) {
      setSubscriptionSuccess(true);
      setTimeout(() => setSubscriptionSuccess(false), 4000);
      setSubscribedEmail('');
    }
  };

  const handleLike = async (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasLiked[articleId]) return;

    try {
      setHasLiked(prev => ({ ...prev, [articleId]: true }));
      const updated = await api.likeNews(articleId);
      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle(updated);
      }
      if (onNewsUpdated) onNewsUpdated();
    } catch (err) {
      console.error('Failed to like article:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle || !commentText.trim() || !commentAuthor.trim()) return;

    setIsPostingComment(true);
    try {
      const updated = await api.addNewsComment(selectedArticle.id, {
        authorName: commentAuthor.trim(),
        content: commentText.trim()
      });
      setSelectedArticle(updated);
      setCommentText('');
      if (onNewsUpdated) onNewsUpdated();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleShare = (article: NewsArticle) => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Substack Publication Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/60 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-slate-100 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#800020]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#800020] text-amber-300 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-widest border border-rose-800 shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              SUBSTACK STANDARD PUBLICATION
            </span>
            <span className="text-xs text-slate-400 font-semibold">&bull; Official EPL Gazette</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-serif">
            The Epe Premier League Gazette & Substack Dispatch
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Tactical breakdowns, scouting reports, press releases, and deep-dive football journalism delivered directly from Epe Division.
          </p>

          {/* Substack Email Subscriber Bar */}
          <form onSubmit={handleSubscribe} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="relative flex-1">
              <input
                type="email"
                required
                placeholder="Enter your email for free dispatches..."
                value={subscribedEmail}
                onChange={(e) => setSubscribedEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              className="bg-[#800020] hover:bg-rose-900 text-amber-300 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-rose-700 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Subscribe Free</span>
            </button>
          </form>

          {subscriptionSuccess && (
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800 max-w-md animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              You are subscribed to the Epe Premier League Substack Dispatch!
            </div>
          )}
        </div>
      </div>

      {/* Featured Main Substack Article */}
      {featured && (
        <div 
          onClick={() => setSelectedArticle(featured)}
          className="bg-slate-900/90 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 cursor-pointer group grid grid-cols-1 md:grid-cols-12 hover:border-amber-400/80 transition-all backdrop-blur-md"
        >
          <div className="md:col-span-7 relative aspect-video md:aspect-auto overflow-hidden">
            <img
              src={featured.coverImage}
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              <span className="bg-[#800020] text-amber-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-rose-800">
                {featured.issueLabel || featured.category}
              </span>
              {featured.isSubstackExclusive && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Substack Exclusive
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Substack Author Byline */}
              <div className="flex items-center gap-3">
                <img
                  src={featured.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={featured.author}
                  className="w-10 h-10 rounded-full object-cover border border-amber-400/60 shadow-md"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    {featured.author}
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  </h4>
                  <p className="text-[10px] text-slate-400">{featured.authorTitle || 'Official League Correspondent'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold pt-1">
                <span>{new Date(featured.publishedAt).toLocaleDateString()}</span>
                <span>&bull;</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {featured.readTime || '3 min read'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-100 group-hover:text-amber-300 transition-colors leading-tight font-serif">
                {featured.title}
              </h2>

              {featured.subtitle && (
                <p className="text-xs font-bold text-slate-300 italic">
                  {featured.subtitle}
                </p>
              )}

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {featured.summary}
              </p>
            </div>

            {/* Substack Social Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={(e) => handleLike(featured.id, e)}
                  className={`flex items-center gap-1.5 transition-colors ${hasLiked[featured.id] ? 'text-rose-400' : 'hover:text-rose-400'}`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked[featured.id] ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{(featured.likesCount || 0) + (hasLiked[featured.id] ? 1 : 0)}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{featured.comments?.length || 0}</span>
                </div>
              </div>

              <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                Read Dispatch &rarr;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map(article => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-slate-900/90 rounded-2xl overflow-hidden shadow-xl border border-slate-800 cursor-pointer hover:border-slate-700 hover:-translate-y-1 transition-all flex flex-col justify-between backdrop-blur-md"
          >
            <div>
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-slate-950/90 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-slate-800">
                  {article.issueLabel || article.category}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <img
                    src={article.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={article.author}
                    className="w-7 h-7 rounded-full object-cover border border-amber-400/40"
                  />
                  <div className="text-[11px] font-bold text-slate-300">
                    <span>{article.author}</span>
                    <span className="text-slate-500 font-normal ml-1.5">&bull; {article.readTime || '3 min'}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-100 text-base line-clamp-2 hover:text-amber-300 transition-colors font-serif">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </div>

            <div className="px-5 pb-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleLike(article.id, e)}
                  className={`flex items-center gap-1 transition-colors ${hasLiked[article.id] ? 'text-rose-400' : 'hover:text-rose-400'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${hasLiked[article.id] ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{(article.likesCount || 0) + (hasLiked[article.id] ? 1 : 0)}</span>
                </button>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{article.comments?.length || 0}</span>
                </div>
              </div>

              <span className="text-amber-400 font-bold">
                Read story &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Substack Full Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto border border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-100">
            {/* Top Bar */}
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black tracking-widest text-slate-200 uppercase">
                  SUBSTACK DISPATCH &bull; {selectedArticle.issueLabel || 'EPL GAZETTE'}
                </span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-10 space-y-6">
              {/* Header Title & Subtitle */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
                  <span className="bg-[#800020] text-amber-300 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-800">
                    {selectedArticle.category}
                  </span>
                  <span>&bull;</span>
                  <span>{selectedArticle.readTime || '4 min read'}</span>
                  <span>&bull;</span>
                  <span>{new Date(selectedArticle.publishedAt).toLocaleDateString()}</span>
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
                    src={selectedArticle.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={selectedArticle.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/60 shadow-md"
                  />
                  <div>
                    <div className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{selectedArticle.author}</span>
                      <UserCheck className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {selectedArticle.authorTitle || 'Senior Football Writer, Epe Dispatch'}
                    </div>
                  </div>
                </div>

                {/* Substack Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(selectedArticle.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      hasLiked[selectedArticle.id]
                        ? 'bg-rose-950 border-rose-700 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked[selectedArticle.id] ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{(selectedArticle.likesCount || 0) + (hasLiked[selectedArticle.id] ? 1 : 0)}</span>
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
                {selectedArticle.content}
              </div>

              {/* Substack Comments Section */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    <span>Discussion & Comments ({selectedArticle.comments?.length || 0})</span>
                  </h3>
                </div>

                {/* Comment Form */}
                <form onSubmit={handlePostComment} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Your Name (e.g. Tunde Supporter)..."
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <textarea
                    required
                    rows={3}
                    placeholder="Join the discussion... What are your thoughts on this dispatch?"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPostingComment}
                      className="bg-[#800020] hover:bg-rose-900 text-amber-300 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow border border-rose-800 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isPostingComment ? 'Posting...' : 'Post Comment'}</span>
                    </button>
                  </div>
                </form>

                {/* Comment List */}
                <div className="space-y-3">
                  {(!selectedArticle.comments || selectedArticle.comments.length === 0) ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      No comments yet. Be the first to share your perspective on this Substack dispatch!
                    </p>
                  ) : (
                    selectedArticle.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={comment.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                              alt={comment.authorName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                            <span className="text-xs font-bold text-slate-200">{comment.authorName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
