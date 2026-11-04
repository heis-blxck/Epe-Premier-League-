sed -i '/<PlayerValuationManager/,/>/!b;/>/!b;a\
\
      {/* FPL ENGINE & GAMEWEEK FINALIZER */}\
      {adminTab === '\''fpl_finalizer'\'' && (\
        <FplFinalizerManager />\
      )}' src/components/AdminDashboard.tsx
