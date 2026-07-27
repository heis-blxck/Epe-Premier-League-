const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const editBlock = `                        {/* EDIT BUTTON */}
                        {(isSuperAdmin || (currentAdmin?.role === 'news_reporter' && item.authorEmail === currentUserEmail)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNewsId(item.id);
                            setNewsTitle(item.title);
                            setNewsSubtitle(item.subtitle || '');
                            setNewsCoverUrl(item.coverImage || '');
                            setNewsSummary(item.summary || '');
                            setNewsContent(item.content || '');
                            setNewsCategory(item.category || 'Match Report');
                            setNewsIssueLabel(item.issueLabel || 'EPL Dispatch');
                            setNewsReadTime(item.readTime || '3 min read');
                            setNewsAuthor(item.author || '');
                            setNewsAuthorTitle(item.authorTitle || '');
                            setNewsAuthorAvatar(item.authorAvatar || '');
                            setNewsIsSubstackExclusive(!!item.isSubstackExclusive);
                            setNewsFeatured(!!item.featured);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        )}
`;

code = code.replace(
  /{[^}]*EDIT BUTTON[^}]*}\n\s*<button[\s\S]*?<span>Edit<\/span>\n\s*<\/button>/g,
  editBlock.trim()
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Edit restriction patched");
