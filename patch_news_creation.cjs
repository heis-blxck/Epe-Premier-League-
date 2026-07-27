const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const newsCreation = `
              await api.saveNews({
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
`;

code = code.replace(
/await api\.saveNews\(\{\s*\.\.\.\(editingNewsId \? \{ id: editingNewsId \} : \{\}\),\s*title: newsTitle,\s*subtitle: newsSubtitle,\s*summary: newsSummary \|\| newsContent\.slice\(0, 140\),\s*content: newsContent,\s*coverImage: newsCoverUrl \|\| '[^']*',\s*category: newsCategory,\s*issueLabel: newsIssueLabel \|\| '[^']*',\s*readTime: newsReadTime \|\| '[^']*',\s*author: newsAuthor \|\| \(currentAdmin\?\.name \|\| '[^']*'\),\s*authorTitle: newsAuthorTitle \|\| '[^']*',\s*authorAvatar: newsAuthorAvatar \|\| '[^']*',\s*isSubstackExclusive: newsIsSubstackExclusive,\s*featured: newsFeatured,\s*status: defaultStatus,\s*isPublished: defaultPublished,\s*authorRole: currentAdmin\?\.role \|\| 'news_reporter'\s*\}\);/g,
  newsCreation.trim()
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("News creation patched");
