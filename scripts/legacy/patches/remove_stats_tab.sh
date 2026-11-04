sed -i 's/| '"'"'stats'"'"'//g' src/App.tsx
sed -i 's/| '"'"'stats'"'"' //g' src/App.tsx
sed -i '/{activeTab === '"'"'stats'"'"' && (/,/)}/d' src/App.tsx
sed -i 's/| '"'"'stats'"'"'//g' src/components/Header.tsx
sed -i 's/| '"'"'stats'"'"' //g' src/components/Header.tsx
sed -i '/<button/,/<\/button>/ {
  /activeTab === '"'"'stats'"'"'/ {
    N
    N
    N
    N
    N
    N
    N
    N
    N
    N
    d
  }
}' src/components/Header.tsx
