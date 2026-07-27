const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldVerify = `                                    await api.saveNews({
                                      ...item,
                                      status: 'published',
                                      isPublished: true
                                    });`;

const newVerify = `                                    await api.saveNews({
                                      ...item,
                                      status: 'published',
                                      isPublished: true,
                                      isSuperAdminAction: true
                                    } as any);`;

const oldRevert = `                                    await api.saveNews({
                                      ...item,
                                      status: 'pending_approval',
                                      isPublished: false
                                    });`;

const newRevert = `                                    await api.saveNews({
                                      ...item,
                                      status: 'pending_approval',
                                      isPublished: false,
                                      isSuperAdminAction: true
                                    } as any);`;

code = code.replace(oldVerify, newVerify);
code = code.replace(oldRevert, newRevert);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard verify patched");
