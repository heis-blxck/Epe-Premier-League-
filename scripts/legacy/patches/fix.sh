sed -i '4997,5010c\
      {adminTab === '\''valuations'\'' && (\
        <PlayerValuationManager\
          players={players}\
          teams={teams}\
          onRefresh={onRefreshAll}\
          onShowToast={showToast}\
        />\
      )}\
\
      {/* FPL ENGINE & GAMEWEEK FINALIZER */}\
      {adminTab === '\''fpl_finalizer'\'' && (\
        <FplFinalizerManager />\
      )}' src/components/AdminDashboard.tsx
