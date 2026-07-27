import subprocess

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#b3002d" />
      <stop offset="70%" stop-color="#600018" />
      <stop offset="100%" stop-color="#3b000e" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe885" />
      <stop offset="30%" stop-color="#f59e0b" />
      <stop offset="70%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
    <linearGradient id="goldLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Shield -->
  <path d="M 256,16 C 360,16 448,56 448,150 C 448,320 340,430 256,488 C 172,430 64,320 64,150 C 64,56 152,16 256,16 Z" 
        fill="url(#bgGlow)" 
        stroke="url(#shieldBorder)" 
        stroke-width="12" 
        filter="url(#dropShadow)" />

  <!-- Inner Shield Accent Line -->
  <path d="M 256,32 C 345,32 428,68 428,154 C 428,308 328,410 256,464 C 184,410 84,308 84,154 C 84,68 167,32 256,32 Z" 
        fill="none" 
        stroke="url(#goldLight)" 
        stroke-width="3" 
        stroke-dasharray="8 4" 
        opacity="0.7" />

  <!-- Crown on Top of Lion -->
  <g transform="translate(256, 115) scale(0.95)" filter="url(#dropShadow)">
    <path d="M -70,-20 L -90,-75 L -40,-45 L 0,-90 L 40,-45 L 90,-75 L 70,-20 Z" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2"/>
    <!-- Jewels on Crown -->
    <circle cx="-90" cy="-75" r="7" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>
    <circle cx="-40" cy="-45" r="5" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
    <circle cx="0" cy="-90" r="9" fill="#10b981" stroke="#fff" stroke-width="2"/>
    <circle cx="40" cy="-45" r="5" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
    <circle cx="90" cy="-75" r="7" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>
    <!-- Crown Base Band -->
    <rect x="-72" y="-20" width="144" height="14" rx="4" fill="url(#goldLight)" stroke="#78350f" stroke-width="1.5"/>
    <circle cx="-45" cy="-13" r="3" fill="#ef4444"/>
    <circle cx="-22" cy="-13" r="3" fill="#3b82f6"/>
    <circle cx="0" cy="-13" r="3.5" fill="#10b981"/>
    <circle cx="22" cy="-13" r="3" fill="#3b82f6"/>
    <circle cx="45" cy="-13" r="3" fill="#ef4444"/>
  </g>

  <!-- Majestic Lion Face / Silhouette -->
  <g transform="translate(256, 235)">
    <!-- Mane Outline -->
    <path d="M 0,-70 
             C 40,-70 80,-40 95,-10 
             C 110,20 105,60 85,95 
             C 65,130 35,150 0,160 
             C -35,150 -65,130 -85,95 
             C -105,60 -110,20 -95,-10 
             C -80,-40 -40,-70 0,-70 Z" 
          fill="url(#goldGrad)" 
          stroke="#fffbeb" 
          stroke-width="3" />
    
    <!-- Inner Dark Mane Details -->
    <path d="M -70,-10 C -50,30 -40,80 0,135 C 40,80 50,30 70,-10 C 45,-30 20,-45 0,-45 C -20,-45 -45,-30 -70,-10 Z" fill="#450a0a" opacity="0.95"/>

    <!-- Lion Facial Structure (Gold Lines) -->
    <path d="M 0,-35 L -25,10 L -15,40 L 0,55 L 15,40 L 25,10 Z" fill="url(#goldLight)"/>
    <path d="M -15,40 L -35,55 L -20,70 L 0,78 L 20,70 L 35,55 L 15,40 Z" fill="url(#goldGrad)"/>

    <!-- Eyes -->
    <polygon points="-30,5 -10,12 -22,20" fill="#fef08a"/>
    <polygon points="30,5 10,12 22,20" fill="#fef08a"/>
    <circle cx="-21" cy="12" r="2.5" fill="#000"/>
    <circle cx="21" cy="12" r="2.5" fill="#000"/>

    <!-- Nose & Mouth -->
    <polygon points="-8,42 8,42 0,52" fill="#78350f"/>
    <path d="M 0,52 L 0,64 M 0,64 C -8,70 -16,66 -22,60 M 0,64 C 8,70 16,66 22,60" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
  </g>

  <!-- Soccer Ball Emblem -->
  <g transform="translate(256, 385) scale(0.65)" filter="url(#dropShadow)">
    <circle cx="0" cy="0" r="32" fill="#ffffff" stroke="url(#goldGrad)" stroke-width="4"/>
    <polygon points="0,-12 -11,-4 -7,10 7,10 11,-4" fill="#1e293b"/>
    <line x1="0" y1="-12" x2="0" y2="-32" stroke="#1e293b" stroke-width="3"/>
    <line x1="-11" y1="-4" x2="-28" y2="-14" stroke="#1e293b" stroke-width="3"/>
    <line x1="-7" y1="10" x2="-20" y2="28" stroke="#1e293b" stroke-width="3"/>
    <line x1="7" y1="10" x2="20" y2="28" stroke="#1e293b" stroke-width="3"/>
    <line x1="11" y1="-4" x2="28" y2="-14" stroke="#1e293b" stroke-width="3"/>
  </g>

  <!-- Banner ribbon across bottom -->
  <g transform="translate(256, 435)" filter="url(#dropShadow)">
    <path d="M -180,0 L -150,-18 L 150,-18 L 180,0 L 160,28 L -160,28 Z" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2"/>
    <path d="M -150,-18 L -180,0 L -160,28 L -150,12 Z" fill="#92400e"/>
    <path d="M 150,-18 L 180,0 L 160,28 L 150,12 Z" fill="#92400e"/>
    <text x="0" y="8" font-family="'Arial Black', 'Impact', sans-serif" font-size="20" font-weight="900" fill="#3b000e" text-anchor="middle" letter-spacing="2">EPE PREMIER LEAGUE</text>
  </g>
</svg>
'''

with open('logo_master.svg', 'w') as f:
    f.write(svg_content)

print("SVG created successfully")

# Convert to PNG and JPG
subprocess.run(["convert", "-background", "none", "logo_master.svg", "public/logo.png"], check=True)
subprocess.run(["convert", "-background", "#800020", "logo_master.svg", "public/logo.jpg"], check=True)
subprocess.run(["cp", "public/logo.png", "dist/logo.png"], check=False)
subprocess.run(["cp", "public/logo.jpg", "dist/logo.jpg"], check=False)

print("Converted to public/logo.png and public/logo.jpg!")
