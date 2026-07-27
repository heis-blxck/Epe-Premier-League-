import React, { useState, useEffect } from "react";
import { EplHighlight, AdminUser } from "../types";
import { api } from "../services/api";
import { Heart, Trash2, Camera } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";

interface EplHighlightPosterProps {
  currentAdmin?: AdminUser | null;
  triggerToast: (msg: string) => void;
  initialHighlights?: EplHighlight[];
}

export const EplHighlightPoster: React.FC<EplHighlightPosterProps> = ({
  currentAdmin,
  triggerToast,
  initialHighlights
}) => {
  const [highlights, setHighlights] = useState<EplHighlight[]>(initialHighlights || []);
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});

  const fetchHighlights = async () => {
    if (initialHighlights) return;
    try {
      const data = await api.getEplHighlights();
      const getTs = (id: string) => {
        const p = id.split("-");
        return p.length > 1 ? parseInt(p[p.length - 1], 10) : 0;
      };
      setHighlights(
        (data || []).sort(
          (a: EplHighlight, b: EplHighlight) => getTs(b.id) - getTs(a.id),
        ),
      );
    } catch (err) {
      console.error("Failed to load EPL highlights:", err);
    }
  };

  useEffect(() => {
    if (initialHighlights) {
      setHighlights(initialHighlights);
    } else {
      fetchHighlights();
    }
  }, [initialHighlights]);

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked[id]) return;

    try {
      setHasLiked((prev) => ({ ...prev, [id]: true }));
      const updated = await api.likeEplHighlight(id);
      setHighlights((prev) => prev.map((h) => (h.id === id ? updated : h)));
    } catch (err) {
      console.error("Failed to like highlight:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this highlight poster?")) return;
    try {
      await api.deleteEplHighlight(id);
      triggerToast("Highlight deleted");
      fetchHighlights();
    } catch (err: any) {
      triggerToast(err.message || "Failed to delete highlight");
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Camera className="w-5 h-5 text-amber-400" />
        <h3 className="text-xl font-black text-amber-400 font-serif uppercase tracking-wider">
          EPL Highlight
        </h3>
      </div>

      {!highlights || highlights.length === 0 ? (
        <div className="bg-slate-900/90 rounded-2xl p-8 shadow-xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 font-bold">No highlights yet</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x">
          {highlights.slice(0, 3).map((highlight) => (
            <div
              key={highlight.id}
              className="w-[320px] sm:w-[400px] shrink-0 snap-start bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            >
              <div className="w-full relative bg-slate-950 flex justify-center">
                <img
                  src={highlight.posterImageUrl}
                  alt="EPL Highlight"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-t-xl"
                />
              </div>

              <div className="p-4 sm:p-6 bg-slate-900 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-extrabold mb-2">
                    <span>{highlight.author || "Official League FA"}</span>
                    <VerifiedBadge role={highlight.authorRole || 'official_league'} />
                  </div>
                  {highlight.writeup && (
                    <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed mb-4">
                      {highlight.writeup}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                  <button
                    onClick={(e) => handleLike(highlight.id, e)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                      hasLiked[highlight.id]
                        ? "text-rose-400"
                        : "text-slate-400 hover:text-rose-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${hasLiked[highlight.id] ? "fill-rose-400 text-rose-400" : ""}`}
                    />
                    <span>{highlight.likesCount || 0}</span>
                  </button>

                  {currentAdmin && (
                    <button
                      onClick={() => handleDelete(highlight.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold p-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
