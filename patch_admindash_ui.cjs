const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const motmUi = `
              {/* MOTM & FANTASY BONUS */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Match Awards & Fantasy Bonus Points
                </div>
                {selectedMatch.status === 'Full-Time' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-bold block">Man of the Match</label>
                      <select
                        value={motmPlayerId}
                        onChange={(e) => setMotmPlayerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-100"
                      >
                        <option value="">-- Select MOTM --</option>
                        {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.teamId === selectedMatch.homeTeamId ? selectedMatch.homeTeam?.shortName : selectedMatch.awayTeam?.shortName})</option>
                        ))}
                      </select>
                    </div>
                    {motmPlayerId && (
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 font-bold block">MOTM Graphic (JPEG, Max 2MB)</label>
                        <MediaUploader
                          accept="image/jpeg, image/jpg"
                          onUploadComplete={setMotmGraphicUrl}
                          label="Upload MOTM Image"
                        />
                        {motmGraphicUrl && (
                          <div className="mt-2 border rounded-lg border-slate-800 overflow-hidden bg-slate-950 p-2">
                            <img src={motmGraphicUrl} alt="Preview" className="w-full h-auto object-cover rounded" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="pt-2 space-y-3 border-t border-slate-800">
                      <label className="text-[10px] text-slate-400 font-bold block uppercase text-emerald-400">Fantasy Bonus Allocation</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">1st Place (3 pts)</label>
                          <select
                            value={bonusFirstPlace}
                            onChange={(e) => setBonusFirstPlace(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-100"
                          >
                            <option value="">-- Select --</option>
                            {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">2nd Place (2 pts)</label>
                          <select
                            value={bonusSecondPlace}
                            onChange={(e) => setBonusSecondPlace(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-100"
                          >
                            <option value="">-- Select --</option>
                            {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">3rd Place (1 pt)</label>
                          <select
                            value={bonusThirdPlace}
                            onChange={(e) => setBonusThirdPlace(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-100"
                          >
                            <option value="">-- Select --</option>
                            {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-500 italic p-2 text-center bg-slate-950 rounded-lg border border-slate-800 border-dashed">
                    Match must be 'Full-Time' to allocate awards and bonus points.
                  </div>
                )}
              </div>
            </div>
            <button
`;

code = code.replace(
  /(\s*\<\/div\>\s*\<button\s*onClick=\{handleSaveMatchStats\})/g,
  `${motmUi}`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
