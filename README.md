# Liminal Backrooms Game 🎮

An interactive 3D exploration game inspired by The Backrooms and liminal space aesthetics, built with Three.js and WebGL.

## 🌙 Overview

Experience an infinite parking lot under a deep night sky. Navigate through an atmospheric liminal space filled with procedurally placed lamp posts, mysterious lighting, and an overwhelming sense of isolation and wrongness.

## ✨ Features

### Visual & Atmosphere
- **Liminal Aesthetic**: Dark blue gradient sky with dense exponential fog
- **Dynamic Lighting**: 
  - Ambient light for base visibility
  - Point lights on every lamp post
  - Flashlight effect attached to camera
- **Procedural World**: Infinite, seamless parking lot with modulo-based wrapping
- **Detailed Assets**: 
  - Curved lamp posts with concrete bases
  - Textured asphalt with line markings
  - Realistic shadows and materials

### Gameplay
- **FPS Controls**: WASD movement + mouse look via Pointer Lock API
- **Physics System**: Realistic collision detection with lamp post bases
- **Dynamic World**: Chunks load/unload based on view distance
- **Atmospheric UI**: 
  - Minimalist start screen
  - Loading screen with progress
  - Crosshair focus point
  - Real-time position & FPS display

### Technical Stack
- **Engine**: Three.js (r128+)
- **Graphics**: WebGL with shadow mapping
- **Physics**: Custom collision detection system
- **Controls**: Pointer Lock for immersive FPS experience
- **Performance**: Frustum culling, LOD, chunk-based generation

## 🚀 Quick Start

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3+ (for local server, optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andridzen-coder/LiminalGame.git
cd LiminalGame
```

2. Start a local server:
```bash
# Using Python 3
python -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000

# Or using Node.js http-server
npx http-server
```

3. Open in browser: `http://localhost:8000`

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W/Up Arrow** | Move Forward |
| **S/Down Arrow** | Move Backward |
| **A/Left Arrow** | Move Left |
| **D/Right Arrow** | Move Right |
| **Shift** | Sprint |
| **Mouse Move** | Look Around (when locked) |
| **Click** | Lock/Unlock Cursor |
| **Escape** | Unlock Cursor |

## 📁 Project Structure

```
LiminalGame/
├── index.html              # Main HTML entry
├── package.json            # Project metadata
├── README.md              # This file
├── css/
│   └── style.css          # Styles and animations
└── js/
    ├── main.js            # Game initialization & loop
    ├── atmosphere.js      # Lighting and fog setup
    ├── world.js           # World generation & assets
    ├── physics.js         # Collision detection
    └── controls.js        # FPS input handling
```

## 🎨 Customization

### Modify Atmosphere
Edit `js/atmosphere.js`:
```javascript
const ATMOSPHERE = {
    skyColor: 0x0a1428,           // Sky color
    fogDensity: 0.03,              // Fog thickness
    ambientIntensity: 0.3,         // Overall brightness
    spotLightIntensity: 1.5,       // Flashlight strength
    // ... more options
};
```

### Adjust World Parameters
Edit `js/world.js`:
```javascript
const WORLD = {
    poleSpacing: 15,               // Distance between posts
    poleHeight: 12,                // Height of lamp posts
    tileSize: 50,                  // Size of terrain tiles
    renderDistance: 300,           // How far to render
};
```

### Tweak Controls
Edit `js/controls.js`:
```javascript
this.speed = 0.15;               // Movement speed
this.sprintMultiplier = 1.5;     // Sprint speed factor
```

## 🔧 Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ Mobile browsers (limited support, no pointer lock)

## 📊 Performance

- Target: 60 FPS on modern hardware
- Chunk-based terrain reduces draw calls
- Exponential fog provides natural culling
- Optimized shadow maps (2048x2048)

## 🎯 Future Enhancements

- [ ] Audio system (ambient sounds, footsteps)
- [ ] Entity system (moving objects, anomalies)
- [ ] Advanced shader system
- [ ] Mobile touch controls
- [ ] Leaderboards
- [ ] Screenshots/recording
- [ ] VR support
- [ ] Procedural variation in tiles

## 📜 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 👤 Author

**andridzen-coder**  
GitHub: [@andridzen-coder](https://github.com/andridzen-coder)

## 🙏 Credits

- Inspired by The Backrooms aesthetic
- Built with [Three.js](https://threejs.org/)
- Powered by WebGL

## 📝 Notes

This game emphasizes atmosphere and exploration over traditional gameplay. The sense of emptiness and isolation is intentional. Enjoy your stay in the backrooms... if you can find your way out.

---

*"You wake up in an endless parking lot. The sky is always dusk. It's never been any other time here."*
