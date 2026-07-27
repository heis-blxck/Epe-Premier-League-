const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldToast = `              if (isSuperAdmin) {
                showToast('Article published live to news feed!');
              } else {
                showToast('Article submitted! Sent to Super Admin for verification before going live.');
              }`;

const newToast = `              const saved = await api.saveNews({
                ...(editingNewsId ? { id: editingNewsId } : {}),
                title: newsTitle,
                subtitle: newsSubtitle,
                summary: newsSummary || newsContent.slice(0, 140),
                content: newsContent,
                coverImage: newsCoverUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
                category: newsCategory,
                issueLabel: newsIssueLabel || 'EPL Dispatch',
                readTime: newsReadTime || '3 min read',
                author: newsAuthor || (currentAdmin?.name || 'Segun Samson'),
                authorTitle: newsAuthorTitle || 'Senior Football Writer',
                authorAvatar: newsAuthorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                isSubstackExclusive: newsIsSubstackExclusive,
                featured: newsFeatured,
                status: defaultStatus,
                isPublished: defaultPublished,
                authorRole: currentAdmin?.role || 'news_reporter',
                authorEmail: currentUserEmail
              });

              if (saved.status === 'published') {
                showToast(isSuperAdmin ? 'Article published live to news feed!' : 'Article passed moderation and is published live!');
              } else {
                showToast('Article submitted! Held for Super Admin review due to moderation rules.');
              }`;

code = code.replace(
/await api\.saveNews\(\{[\s\S]*?authorEmail: currentUserEmail\n\s*\}\);\n\n\s*if \(isSuperAdmin\) \{\n\s*showToast\('Article published live to news feed!'\);\n\s*\} else \{\n\s*showToast\('Article submitted! Sent to Super Admin for verification before going live\.'\);\n\s*\}/g,
newToast
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Toast patched");
