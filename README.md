# 🌙 Liminal Backrooms - WebGL Game

An interactive 3D exploration game built with **pure WebGL 2.0** — no frameworks, no Three.js, no dependencies. Just raw GPU power and atmospheric dread.

![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-blue)
![Technology](https://img.shields.io/badge/tech-WebGL%202.0-orange)

## 🎮 Features

### Core Mechanics
- **Infinite World**: Procedurally generated parking lot that wraps seamlessly
- **FPS Controls**: WASD movement + mouse look with pointer lock
- **Collision System**: Physical interaction with lamp post bases
- **Chunk Loading**: Dynamic world generation based on render distance
- **Performance**: Optimized for 60 FPS on modern hardware

### Visual & Atmosphere
- **Pure WebGL Rendering**: Vertex and fragment shaders, no abstractions
- **Dynamic Lighting**: 
  - Ambient light for base visibility
  - Point lights on every lamp post
  - Directional light simulation
- **Procedural Texture**: Real-time generated asphalt with parking lot markings
- **Exponential Fog**: Creates sense of isolation and infinite space
- **Curved Lamp Posts**: Geometric cylinders with concrete bases
- **Starfield**: Subtle procedural stars in the dark blue sky

### Technical Stack
- **Graphics API**: WebGL 2.0
- **Shading**: GLSL ES 3.0
- **Physics**: Custom collision detection
- **Math**: Handwritten matrix & vector math (no GLM, no math libraries)
- **Architecture**: Pure JavaScript ES6

## 🚀 Quick Start

### Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- Python 3+ (for local server)

### Installation

```bash
# Clone repository
git clone https://github.com/andridzen-coder/LiminalGame.git
cd LiminalGame

# Start local server
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

## 🎮 Controls

| Input | Action |
|-------|--------|
| **W** | Move forward |
| **A** | Move left |
| **S** | Move backward |
| **D** | Move right |
| **Shift** | Sprint (2x speed) |
| **Mouse Move** | Look around (when locked) |
| **Click** | Lock/unlock cursor |
| **ESC** | Unlock cursor |

## 🏗️ Architecture

### Single File Design
The entire game is in `game.js` (~1500 lines) with clear sections:

```
1. WebGL Context Setup
2. Shader Programs (Terrain, Lamps, Sky, Lights)
3. Math Utilities (Mat4, Vec3)
4. Geometry Generation (Cylinders, Planes, Cubes, Skybox)
5. VAO/VBO Management
6. Procedural Texturing
7. Game State
8. Chunk System
9. Input Handling
10. Camera & Collisions
11. Render Loop
12. Initialization
```

### Key Systems

#### Shader System
Four shader programs handle different rendering:
- **terrain.vert/frag**: Asphalt with UV mapping and fog
- **lamp.vert/frag**: Cylinders with phong lighting
- **sky.vert/frag**: Starfield and gradient sky
- **light.vert/frag**: Light source visualization

#### Chunk System
- Grid-based world generation
- Each chunk: 50×50 meters
- 4×4 lamp posts per chunk
- Dynamic loading/unloading based on render distance

#### Collision Detection
- AABB-based pole collision
- Player radius: 0.3 units
- Automatic push-out when colliding

#### Math System
- `Mat4`: 4×4 matrix operations (identity, translate, scale, multiply, lookAt, perspective)
- `Vec3`: 3D vectors (add, subtract, multiply, normalize)
- No dependencies — everything custom

## 🎨 Customization

### World Parameters
Edit constants at top of `game.js`:

```javascript
const CHUNK_SIZE = 50;           // Size of each chunk
const POLE_SPACING = 12.5;       // Distance between lamp posts
const RENDER_DISTANCE = 300;     // How far to render
const FOG_DENSITY = 0.03;        // Fog thickness
const CAMERA_HEIGHT = 1.7;       // Player eye height
const MOVE_SPEED = 0.15;         // Units per millisecond
```

### Lighting
Modify in shader code:
```glsl
vec3 ambientColor = vec3(0.2);   // Ambient brightness
vec3 diffuseColor = vec3(0.6);   // Diffuse reflection
vec3 specularColor = vec3(0.1);  // Shine intensity
```

### Sky Color
Edit in `skyFragmentShader`:
```glsl
vec3 skyTop = vec3(0.01, 0.04, 0.15);     // Top color
vec3 skyBottom = vec3(0.02, 0.06, 0.18);  // Bottom color
```

## 📊 Performance

- **Target FPS**: 60
- **Render Distance**: 300 meters
- **Shadow Maps**: Not used (forward rendering)
- **Draw Calls**: ~100-200 per frame
- **Polygon Count**: ~50k-100k per frame
- **Memory**: ~50-100MB

### Optimization Techniques
- Frustum culling (implicit through fog)
- Chunk-based rendering
- Vertex buffer reuse
- Exponential fog for natural occlusion

## 🔧 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Excellent | Best performance |
| Firefox | ✅ Excellent | Identical performance |
| Safari | ✅ Good | Minor shader differences |
| Edge | ✅ Good | Chromium-based |
| Mobile | ⚠️ Limited | No pointer lock support |

## 📝 Code Structure

### Important Functions

```javascript
// Main render loop
function render() { ... }

// World generation
function updateChunks() { ... }
function createChunk(chunkX, chunkZ) { ... }

// Geometry creation
function createCylinder(radius, height, segments) { ... }
function createPlane(width, height, widthSegments, heightSegments) { ... }

// Collision
function checkCollisions(pos) { ... }

// Camera control
function updateCamera(deltaTime) { ... }
function getViewMatrix() { ... }
```

## 🎯 Future Enhancements

- [ ] Audio system (WebAudio API)
- [ ] Advanced shadows (shadow mapping)
- [ ] Entity system (NPCs, objects)
- [ ] Procedural variation (different pole types)
- [ ] Advanced shaders (normal maps, parallax)
- [ ] Leaderboards (local storage)
- [ ] Particle effects
- [ ] Post-processing (bloom, SSAO)
- [ ] Mobile support
- [ ] VR support

## 📜 License

MIT License — see LICENSE file for details

## 🎓 Learning Resources

If you want to understand how this works:

1. **WebGL Basics**: MDN WebGL tutorial
2. **Matrix Math**: 3Blue1Brown linear algebra series
3. **Game Engine Design**: Game Engine Architecture by Jason Gregory
4. **Shader Programming**: The Book of Shaders

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve performance
- Fix shader issues

## 👤 Author

**andridzen-coder**  
GitHub: [@andridzen-coder](https://github.com/andridzen-coder)

## 🙏 Inspiration

- The Backrooms (Kane Pixels)
- Liminal space aesthetic
- Classic WebGL tutorials
- GPU-driven game engines

---

> *"You wake up in an endless parking lot. The sky is always dusk. The lamps hum softly. Something feels... wrong."*

**Enter if you dare. 🌙**