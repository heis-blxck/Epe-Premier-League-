const fs = require('fs');
let code = fs.readFileSync('src/components/MediaUploader.tsx', 'utf8');

const oldBlock = `        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-amber-400/60 bg-slate-900/60 hover:bg-slate-900 p-4 rounded-xl text-center cursor-pointer transition-all space-y-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-400 mx-auto flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-200">
            Click to upload digital media file from device
          </p>
          <p className="text-[10px] text-slate-500">
            Supports PNG, JPG, WEBP, SVG
          </p>
        </div>`;

const newBlock = `        <label className="block border-2 border-dashed border-slate-800 hover:border-amber-400/60 bg-slate-900/60 hover:bg-slate-900 p-4 rounded-xl text-center cursor-pointer transition-all space-y-2">
          <input
            type="file"
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-400 mx-auto flex items-center justify-center pointer-events-none">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-200 pointer-events-none">
            Tap to upload digital media file from device
          </p>
          <p className="text-[10px] text-slate-500 pointer-events-none">
            Supports PNG, JPG, WEBP, SVG
          </p>
        </label>`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/MediaUploader.tsx', code);
