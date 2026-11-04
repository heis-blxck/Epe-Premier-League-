const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(/allow create, update, delete: if isSuperAdmin\(\) \|\| \(isSignedIn\(\) .*? request\.auth\.uid == userId\);/g, 'allow create, update, delete: if isSuperAdmin() || (isSignedIn() && request.auth.uid == userId);');

code = code.replace(/allow create: if isSuperAdmin\(\) \|\| \(isSignedIn\(\) .*? request\.resource\.data\.authorId == request\.auth\.uid\);/g, 'allow create: if isSuperAdmin() || (isSignedIn() && request.resource.data.authorId == request.auth.uid);');

code = code.replace(/allow update, delete: if isSuperAdmin\(\) \|\| \(isSignedIn\(\) .*? request\.auth\.uid == resource\.data\.authorId\);/g, 'allow update, delete: if isSuperAdmin() || (isSignedIn() && request.auth.uid == resource.data.authorId);');

fs.writeFileSync('firestore.rules', code);
