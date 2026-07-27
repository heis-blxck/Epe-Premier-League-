import React, { useState } from "react";
import { api } from "../services/api";
import { MediaUploader } from "./MediaUploader";
import { Sparkles, Save, Check } from "lucide-react";
import { AdminUser } from "../types";

interface EplHighlightAdminProps {
  showToast: (msg: string) => void;
  currentAdmin?: AdminUser | null;
}

export const EplHighlightAdmin: React.FC<EplHighlightAdminProps> = ({
  showToast,
  currentAdmin
}) => {
  const [posterImageUrl, setPosterImageUrl] = useState("");
  const [writeup, setWriteup] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterImageUrl) {
      showToast("Poster image is required!");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.saveEplHighlight({
        id: "highlight-" + Date.now(),
        posterImageUrl,
        writeup,
        likesCount: 0,
        author: currentAdmin?.name || "Official League FA",
        authorRole: currentAdmin?.role || "official_league",
        authorEmail: currentAdmin?.email
      });
      showToast("EPL Highlight published successfully!");
      setPosterImageUrl("");
      setWriteup("");
    } catch (err: any) {
      showToast(err.message || "Failed to publish highlight");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-xl font-black text-slate-100 font-serif flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          EPL Highlight Poster Studio
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Publish the new "EPL Highlight" module. Requires a full-width image
          poster and an optional writeup.
        </p>
      </div>

      <form onSubmit={handlePublish} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase mb-2 text-slate-300">
            Poster Image *
          </label>
          <MediaUploader
            onUploadSuccess={(url) => setPosterImageUrl(url)}
            onUploadStart={() => {}}
            onUploadError={(err) => showToast(err.message)}
            buttonText="Upload Poster Image"
          />
          {posterImageUrl && (
            <div className="mt-4 relative rounded-xl overflow-hidden border border-slate-700 inline-block max-w-sm">
              <img
                src={posterImageUrl}
                alt="Poster preview"
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-2 text-slate-300">
            Writeup / Context (Optional)
          </label>
          <textarea
            rows={5}
            value={writeup}
            onChange={(e) => setWriteup(e.target.value)}
            placeholder="Add context or a brief story about this highlight..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-medium text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder:text-slate-600 resize-none"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting || !posterImageUrl}
            className="bg-[#800020] hover:bg-rose-900 disabled:opacity-50 text-amber-300 font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-rose-700"
          >
            {isSubmitting ? (
              <>Publishing...</>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Publish Highlight Poster
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
