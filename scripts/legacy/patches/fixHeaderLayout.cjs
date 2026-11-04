const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

const startRegex = /\{\/\* STICKY COMPACT TOP BAR \*\/\}/;
const endRegex = /\{\/\* ================= 1. PROFILE VIEW ================= \*\/\}/;

const startIndex = content.search(startRegex);
const endIndex = content.search(endRegex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* SCROLLABLE BODY CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto ios-scroll flex flex-col relative" onScroll={handleScroll}>
          {/* LAYER 1: STICKY COMPACT TOP BAR (The Top Mask) */}
          <div className="sticky top-0 z-[100] bg-[#800020] text-white px-5 py-4 border-b border-rose-900/60 flex items-center justify-between shadow-md shrink-0">
            <button
              onClick={() => {
                if (viewMode === 'settings' || viewMode === 'edit_profile') {
                  setViewMode('profile');
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black tracking-tight text-white uppercase font-sans">
              {viewMode === 'settings' ? 'Settings' : viewMode === 'edit_profile' ? 'Edit Profile' : viewMode === 'login' ? 'Authentication' : 'Profile'}
            </h2>
            <div className="flex items-center gap-2">
              {currentUser && viewMode === 'profile' && (
                <button
                  onClick={() => setViewMode('settings')}
                  className="p-2 rounded-full transition-colors cursor-pointer bg-white/10 hover:bg-white/20 text-white"
                  title="Open Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* FOLDING HERO HEADER (Layer 2 & 3) */}
          {viewMode !== 'settings' && (
            <div className="bg-[#800020] text-white shrink-0 flex flex-col items-center justify-center pt-2 pb-6 border-b border-rose-900/60 relative z-10">
              {/* Layer 2: Avatar Row */}
              <div 
                className="flex flex-col items-center transition-opacity" 
                style={{ 
                  opacity: Math.max(0, 1 - scrollY / 60)
                }}
              >
                <div className="text-[11px] text-rose-100/90 font-medium text-center mb-3">
                  Joined: {currentUser ? '26.07.2023.' : 'Guest Visitor'}
                </div>
                <div className="relative group">
                  <img 
                    src={currentUser?.avatarUrl || profileAvatar || AVATAR_PRESETS[0].url} 
                    alt={currentUser?.name || 'Manager Avatar'}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-2xl bg-slate-900 border-4 ring-4 border-amber-400/90 ring-white/10"
                  />
                </div>
              </div>

              {/* Layer 3: Username Row */}
              <div className="mt-4 text-center">
                {currentUser ? (
                  <h3 className="font-black text-white tracking-tight text-xl">
                    {currentUser.name}
                  </h3>
                ) : (
                  <h3 className="font-extrabold text-white text-lg">
                    Welcome to EPL Premier League
                  </h3>
                )}
              </div>
            </div>
          )}

          <div className="p-4 space-y-4">
            
            {/* ================= 1. PROFILE VIEW ================= */}`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + '{/* ================= 1. PROFILE VIEW ================= */}'.length);
  fs.writeFileSync('src/components/UserAuthDeckModal.tsx', newContent);
  console.log("Successfully replaced");
} else {
  console.log("Not found");
}
