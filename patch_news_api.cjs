const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldEndpoint = `  app.post("/api/news", (req, res) => {
    try {
      const newArticle = {
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
      };
      const saved = db.saveNews(newArticle);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });`;

const newEndpoint = `  app.post("/api/news", async (req, res) => {
    try {
      let isApproved = true;
      const textToScan = \`\${req.body.title || ""} \${req.body.subtitle || ""} \${req.body.summary || ""} \${req.body.content || ""}\`.toLowerCase();
      
      const badWords = ["fuck", "shit", "bitch", "cunt", "nigger", "slut", "whore", "dick", "pussy", "cock", "porn", "nudity", "naked", "sex", "rape"];
      const containsBadWords = badWords.some(word => textToScan.includes(word));
      
      if (containsBadWords) {
          isApproved = false;
      }
      
      if (process.env.GEMINI_API_KEY && !containsBadWords) {
          try {
             const { GoogleGenAI } = await import("@google/genai");
             const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
             const response = await ai.models.generateContent({
                 model: 'gemini-2.5-flash',
                 contents: \`You are a content moderator for a football league website.
                 Does the following article contain nudity, sexually explicit content, or extremely derogatory language?
                 Answer with only YES or NO.
                 
                 Article:
                 \${textToScan.substring(0, 5000)}\`
             });
             if (response.text.toUpperCase().includes('YES')) {
                 isApproved = false;
             }
          } catch (e) {
             console.error('Gemini API Error:', e);
          }
      }

      let finalStatus = req.body.status || "published";
      let finalIsPublished = req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true;

      // Always allow super admin to specify their status, but news reporters are vetted
      if (req.body.authorRole === "news_reporter") {
          if (isApproved) {
              finalStatus = "published";
              finalIsPublished = true;
          } else {
              finalStatus = "pending_approval";
              finalIsPublished = false;
          }
      }

      const newArticle = {
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
        status: finalStatus,
        isPublished: finalIsPublished,
        authorRole: req.body.authorRole || "news_reporter",
        authorEmail: req.body.authorEmail || ""
      };
      
      const saved = db.saveNews(newArticle);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });`;

if (code.includes('app.post("/api/news", (req, res) => {')) {
  code = code.replace(oldEndpoint, newEndpoint);
  fs.writeFileSync('server.ts', code);
  console.log("server.ts news moderation patched");
}
