const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldNewsObj = `      const newArticle = {
        id: req.body.id || \`news-\${Date.now()}\`,
        title: req.body.title || "Untitled Article",
        subtitle: req.body.subtitle || "",
        summary: req.body.summary || "",
        content: req.body.content || "",
        coverImage: req.body.coverImage || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
        publishedAt: req.body.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
        author: req.body.author || "EPL Media Team",
        authorAvatar: req.body.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        authorTitle: req.body.authorTitle || "Official League Correspondent",
        category: req.body.category || "League News",
        readTime: req.body.readTime || "3 min read",
        issueLabel: req.body.issueLabel || "EPL Dispatch",
        isSubstackExclusive: Boolean(req.body.isSubstackExclusive),
        likesCount: Number(req.body.likesCount || 0),
        featured: Boolean(req.body.featured),
        comments: req.body.comments || []
      };`;

const newNewsObj = `      const newArticle = {
        id: req.body.id || \`news-\${Date.now()}\`,
        title: req.body.title || "Untitled Article",
        subtitle: req.body.subtitle || "",
        summary: req.body.summary || "",
        content: req.body.content || "",
        coverImage: req.body.coverImage || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
        publishedAt: req.body.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
        author: req.body.author || "EPL Media Team",
        authorAvatar: req.body.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        authorTitle: req.body.authorTitle || "Official League Correspondent",
        category: req.body.category || "League News",
        readTime: req.body.readTime || "3 min read",
        issueLabel: req.body.issueLabel || "EPL Dispatch",
        isSubstackExclusive: Boolean(req.body.isSubstackExclusive),
        likesCount: Number(req.body.likesCount || 0),
        featured: Boolean(req.body.featured),
        comments: req.body.comments || [],
        status: req.body.status || "published",
        isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true,
        authorRole: req.body.authorRole || "news_reporter",
        authorEmail: req.body.authorEmail || ""
      };`;

if (code.includes('const newArticle = {')) {
  code = code.replace(oldNewsObj, newNewsObj);
  fs.writeFileSync('server.ts', code);
  console.log("server.ts news patched");
}
