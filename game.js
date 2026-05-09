// ==================== WEBGL LIMINAL BACKROOMS GAME ====================
// Pure WebGL 2.0 implementation without dependencies
// ========================================================================

const canvas = document.getElementById('gameCanvas');
const gl = canvas.getContext('webgl2', {
    antialias: true,
    alpha: false,
    depth: true
});

if (!gl) {
    alert('WebGL 2.0 not supported');
    throw new Error('WebGL 2.0 context failed');
}

// ==================== CONSTANTS ====================
const CHUNK_SIZE = 50;
const POLE_SPACING = 12.5;
const POLES_PER_CHUNK = 4;
const POLE_HEIGHT = 12;
const POLE_RADIUS = 0.3;
const BASE_RADIUS = 1.2;
const BASE_HEIGHT = 0.5;
const RENDER_DISTANCE = 300;
const FOG_DENSITY = 0.03;
const CAMERA_HEIGHT = 1.7;
const MOVE_SPEED = 0.15;
const SPRINT_MULTIPLIER = 2;
const MOUSE_SENSITIVITY = 0.003;

// ==================== SHADER PROGRAMS ====================

function createShaderProgram(vertexSrc, fragmentSrc) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSrc);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
    }
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSrc);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
    }
    
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
    return program;
}

// Main terrain shader
const terrainVertexShader = `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat4 uMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vPos;
out vec3 vNormal;
out vec2 vUV;
out float vFog;

const float FOG_DENSITY = ${FOG_DENSITY.toFixed(4)};
const float FOG_START = 10.0;

void main() {
    vPos = position;
    vNormal = normalize((uMatrix * vec4(normal, 0.0)).xyz);
    vUV = uv;
    
    vec4 worldPos = uMatrix * vec4(position, 1.0);
    vec4 viewPos = uViewMatrix * worldPos;
    vec4 clipPos = uProjectionMatrix * viewPos;
    
    float dist = length(viewPos.xyz);
    vFog = clamp(exp(-FOG_DENSITY * FOG_DENSITY * dist * dist), 0.0, 1.0);
    
    gl_Position = clipPos;
}
`;

const terrainFragmentShader = `#version 300 es
precision highp float;

in vec3 vPos;
in vec3 vNormal;
in vec2 vUV;
in float vFog;

uniform sampler2D uTexture;
uniform vec3 uCameraPos;
uniform vec3 uLightPos;

out vec4 outColor;

void main() {
    // Texture with detailed pattern
    vec4 texColor = texture(uTexture, vUV * 4.0);
    
    // Add some noise
    float noise = sin(vUV.x * 50.0) * 0.1 + sin(vUV.y * 50.0) * 0.1;
    texColor.rgb += noise * 0.1;
    
    // Lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vPos);
    vec3 viewDir = normalize(uCameraPos - vPos);
    
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(viewDir, reflect(-lightDir, normal)), 0.0), 32.0);
    
    vec3 ambient = vec3(0.2);
    vec3 diffuse = vec3(0.6) * diff;
    vec3 specular = vec3(0.1) * spec;
    
    vec3 finalColor = (ambient + diffuse + specular) * texColor.rgb;
    
    // Apply fog
    vec3 fogColor = vec3(0.02, 0.04, 0.12);
    finalColor = mix(fogColor, finalColor, vFog);
    
    outColor = vec4(finalColor, 1.0);
}
`;

const lampVertexShader = `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;

uniform mat4 uMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vPos;
out vec3 vNormal;
out float vFog;

const float FOG_DENSITY = ${FOG_DENSITY.toFixed(4)};

void main() {
    vPos = position;
    vNormal = normalize((uMatrix * vec4(normal, 0.0)).xyz);
    
    vec4 worldPos = uMatrix * vec4(position, 1.0);
    vec4 viewPos = uViewMatrix * worldPos;
    vec4 clipPos = uProjectionMatrix * viewPos;
    
    float dist = length(viewPos.xyz);
    vFog = clamp(exp(-FOG_DENSITY * FOG_DENSITY * dist * dist), 0.0, 1.0);
    
    gl_Position = clipPos;
}
`;

const lampFragmentShader = `#version 300 es
precision highp float;

in vec3 vPos;
in vec3 vNormal;
in float vFog;

uniform vec3 uColor;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;

out vec4 outColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vPos);
    vec3 viewDir = normalize(uCameraPos - vPos);
    
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(viewDir, reflect(-lightDir, normal)), 0.0), 16.0);
    
    vec3 ambient = vec3(0.15);
    vec3 diffuse = vec3(0.7) * diff;
    vec3 specular = vec3(0.2) * spec;
    
    vec3 finalColor = (ambient + diffuse + specular) * uColor;
    
    // Apply fog
    vec3 fogColor = vec3(0.02, 0.04, 0.12);
    finalColor = mix(fogColor, finalColor, vFog);
    
    outColor = vec4(finalColor, 1.0);
}
`;

const skyVertexShader = `#version 300 es
precision highp float;

in vec3 position;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

out vec3 vDir;

void main() {
    vDir = position;
    vec4 pos = uProjectionMatrix * (uViewMatrix * vec4(position, 0.0));
    gl_Position = pos.xyww;
}
`;

const skyFragmentShader = `#version 300 es
precision highp float;

in vec3 vDir;

out vec4 outColor;

void main() {
    // Dark blue gradient sky
    vec3 dir = normalize(vDir);
    float height = dir.y * 0.5 + 0.5;
    
    vec3 skyTop = vec3(0.01, 0.04, 0.15);
    vec3 skyBottom = vec3(0.02, 0.06, 0.18);
    vec3 skyColor = mix(skyBottom, skyTop, height);
    
    // Add some stars
    float stars = sin(dir.x * 1000.0) * sin(dir.y * 1000.0) * sin(dir.z * 1000.0);
    stars = step(0.995, stars);
    skyColor += stars * vec3(0.8, 0.8, 0.9);
    
    outColor = vec4(skyColor, 1.0);
}
`;

const lightVertexShader = `#version 300 es
precision highp float;

in vec3 position;

uniform mat4 uMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    vec4 worldPos = uMatrix * vec4(position, 1.0);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

const lightFragmentShader = `#version 300 es
precision highp float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}
`;

// ==================== SHADER PROGRAMS ====================
const terrainProgram = createShaderProgram(terrainVertexShader, terrainFragmentShader);
const lampProgram = createShaderProgram(lampVertexShader, lampFragmentShader);
const skyProgram = createShaderProgram(skyVertexShader, skyFragmentShader);
const lightProgram = createShaderProgram(lightVertexShader, lightFragmentShader);

// ==================== MATH UTILITIES ====================

class Mat4 {
    constructor(data = null) {
        this.data = data || new Float32Array(16);
        if (!data) this.identity();
    }
    
    identity() {
        const m = this.data;
        m[0] = m[5] = m[10] = m[15] = 1;
        m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
        return this;
    }
    
    translate(x, y, z) {
        const m = this.data;
        m[12] = x; m[13] = y; m[14] = z;
        return this;
    }
    
    scale(x, y, z) {
        const m = this.data;
        m[0] = x; m[5] = y; m[10] = z;
        return this;
    }
    
    multiply(other) {
        const a = this.data;
        const b = other.data;
        const c = new Float32Array(16);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[i * 4 + k] * b[k * 4 + j];
                }
                c[i * 4 + j] = sum;
            }
        }
        
        return new Mat4(c);
    }
    
    static perspective(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const m = new Float32Array(16);
        m[0] = f / aspect;
        m[5] = f;
        m[10] = (far + near) / (near - far);
        m[11] = -1;
        m[14] = (2 * far * near) / (near - far);
        return new Mat4(m);
    }
    
    static lookAt(eye, center, up) {
        const f = [center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]];
        const flen = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);
        f[0] /= flen; f[1] /= flen; f[2] /= flen;
        
        const s = [f[1] * up[2] - f[2] * up[1], f[2] * up[0] - f[0] * up[2], f[0] * up[1] - f[1] * up[0]];
        const slen = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
        s[0] /= slen; s[1] /= slen; s[2] /= slen;
        
        const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
        
        const m = new Float32Array(16);
        m[0] = s[0]; m[1] = u[0]; m[2] = -f[0]; m[3] = 0;
        m[4] = s[1]; m[5] = u[1]; m[6] = -f[1]; m[7] = 0;
        m[8] = s[2]; m[9] = u[2]; m[10] = -f[2]; m[11] = 0;
        m[12] = -s[0] * eye[0] - s[1] * eye[1] - s[2] * eye[2];
        m[13] = -u[0] * eye[0] - u[1] * eye[1] - u[2] * eye[2];
        m[14] = f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2];
        m[15] = 1;
        return new Mat4(m);
    }
}

class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x; this.y = y; this.z = z;
    }
    
    add(v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    
    sub(v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    
    mul(s) {
        return new Vec3(this.x * s, this.y * s, this.z * s);
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    normalize() {
        const len = this.length();
        return len > 0 ? new Vec3(this.x / len, this.y / len, this.z / len) : new Vec3();
    }
    
    toArray() {
        return [this.x, this.y, this.z];
    }
}

// ==================== GEOMETRY UTILITIES ====================

function createCylinder(radius, height, segments) {
    const vertices = [];
    const normals = [];
    const indices = [];
    
    // Top cap
    vertices.push(0, height / 2, 0);
    normals.push(0, 1, 0);
    
    // Bottom cap
    vertices.push(0, -height / 2, 0);
    normals.push(0, -1, 0);
    
    // Side vertices
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        vertices.push(x, height / 2, z);
        vertices.push(x, -height / 2, z);
        
        normals.push(x / radius, 0, z / radius);
        normals.push(x / radius, 0, z / radius);
    }
    
    // Top cap indices
    for (let i = 0; i < segments; i++) {
        indices.push(0, 2 + i * 2, 2 + (i + 1) * 2);
    }
    
    // Bottom cap indices
    for (let i = 0; i < segments; i++) {
        indices.push(1, 3 + (i + 1) * 2, 3 + i * 2);
    }
    
    // Side indices
    for (let i = 0; i < segments; i++) {
        const a = 2 + i * 2;
        const b = 3 + i * 2;
        const c = 2 + (i + 1) * 2;
        const d = 3 + (i + 1) * 2;
        
        indices.push(a, c, b);
        indices.push(b, c, d);
    }
    
    return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), indices: new Uint32Array(indices) };
}

function createPlane(width, height, widthSegments, heightSegments) {
    const vertices = [];
    const normals = [];
    const uv = [];
    const indices = [];
    
    for (let y = 0; y <= heightSegments; y++) {
        for (let x = 0; x <= widthSegments; x++) {
            const px = (x / widthSegments - 0.5) * width;
            const pz = (y / heightSegments - 0.5) * height;
            
            vertices.push(px, 0, pz);
            normals.push(0, 1, 0);
            uv.push(x / widthSegments, y / heightSegments);
        }
    }
    
    for (let y = 0; y < heightSegments; y++) {
        for (let x = 0; x < widthSegments; x++) {
            const a = y * (widthSegments + 1) + x;
            const b = a + 1;
            const c = a + (widthSegments + 1);
            const d = c + 1;
            
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }
    
    return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), uv: new Float32Array(uv), indices: new Uint32Array(indices) };
}

function createCube() {
    const vertices = [];
    const normals = [];
    const indices = [];
    
    const positions = [
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], // front
        [-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1], // back
    ];
    
    const faces = [
        [0, 1, 2, 3, [0, 0, 1]],
        [4, 5, 6, 7, [0, 0, -1]],
        [0, 3, 5, 4, [-1, 0, 0]],
        [1, 7, 6, 2, [1, 0, 0]],
        [0, 4, 7, 1, [0, -1, 0]],
        [3, 2, 6, 5, [0, 1, 0]],
    ];
    
    for (const [a, b, c, d, normal] of faces) {
        const base = vertices.length / 3;
        vertices.push(...positions[a], ...positions[b], ...positions[c], ...positions[d]);
        for (let i = 0; i < 4; i++) normals.push(...normal);
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    
    return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), indices: new Uint32Array(indices) };
}

function createSkybox() {
    const vertices = [];
    const size = 1000;
    const positions = [
        [-size, -size, size], [size, -size, size], [size, size, size], [-size, size, size],
        [-size, -size, -size], [-size, size, -size], [size, size, -size], [size, -size, -size],
    ];
    const faces = [
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 3, 5, 4],
        [1, 7, 6, 2], [0, 4, 7, 1], [3, 2, 6, 5],
    ];
    const indices = [];
    
    for (const face of faces) {
        const base = vertices.length / 3;
        for (const i of face) vertices.push(...positions[i]);
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    
    return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) };
}

// ==================== VAO/VBO UTILITIES ====================

function createVAO(program, data) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    if (data.vertices) {
        const posLoc = gl.getAttribLocation(program, 'position');
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);
    }
    
    if (data.normals) {
        const normalLoc = gl.getAttribLocation(program, 'normal');
        const nbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
        gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc);
    }
    
    if (data.uv) {
        const uvLoc = gl.getAttribLocation(program, 'uv');
        const ubo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, ubo);
        gl.bufferData(gl.ARRAY_BUFFER, data.uv, gl.STATIC_DRAW);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(uvLoc);
    }
    
    if (data.indices) {
        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
    }
    
    gl.bindVertexArray(null);
    return { vao, indexCount: data.indices ? data.indices.length : 0 };
}

// ==================== TEXTURE UTILITIES ====================

function createProceduralTexture(width, height) {
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            // Asphalt pattern
            let value = Math.sin(x * 0.05) * 50 + Math.sin(y * 0.05) * 50 + 80;
            const noise = Math.random() * 40;
            value = Math.min(255, value + noise);
            
            // Grid lines (parking lot)
            if ((Math.floor(x / 40) % 2 === 0 && y % 20 < 2) || 
                (Math.floor(y / 40) % 2 === 0 && x % 20 < 2)) {
                value = Math.max(value, 200);
            }
            
            data[idx] = value;
            data[idx + 1] = value * 0.95;
            data[idx + 2] = value * 0.9;
            data[idx + 3] = 255;
        }
    }
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
    return texture;
}

// ==================== GAME STATE ====================

const gameState = {
    camera: {
        pos: new Vec3(0, CAMERA_HEIGHT, 0),
        yaw: 0,
        pitch: 0,
        fov: Math.PI / 4,
    },
    input: {
        keys: {},
        mouseX: 0,
        mouseY: 0,
        locked: false,
    },
    world: {
        chunks: new Map(),
        poles: [],
    },
    performance: {
        fps: 60,
        lastTime: performance.now(),
        frameCount: 0,
    },
};

// ==================== GEOMETRY CACHE ====================

const geometryCache = {
    cylinder: null,
    plane: null,
    skybox: null,
};

function initGeometries() {
    const cylinderData = createCylinder(POLE_RADIUS, POLE_HEIGHT, 16);
    geometryCache.cylinder = createVAO(lampProgram, cylinderData);
    
    const baseData = createCylinder(BASE_RADIUS, BASE_HEIGHT, 16);
    geometryCache.base = createVAO(lampProgram, baseData);
    
    const planeData = createPlane(CHUNK_SIZE, CHUNK_SIZE, 16, 16);
    geometryCache.plane = createVAO(terrainProgram, planeData);
    
    const skyboxData = createSkybox();
    geometryCache.skybox = createVAO(skyProgram, skyboxData);
}

// ==================== CHUNK GENERATION ====================

function getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
}

function getPolePositionsInChunk(chunkX, chunkZ) {
    const positions = [];
    const startX = chunkX * CHUNK_SIZE - CHUNK_SIZE / 2;
    const startZ = chunkZ * CHUNK_SIZE - CHUNK_SIZE / 2;
    
    for (let i = 0; i < POLES_PER_CHUNK; i++) {
        for (let j = 0; j < POLES_PER_CHUNK; j++) {
            const x = startX + (i + 0.5) * POLE_SPACING;
            const z = startZ + (j + 0.5) * POLE_SPACING;
            positions.push({ x, z, y: POLE_HEIGHT / 2 });
        }
    }
    
    return positions;
}

function createChunk(chunkX, chunkZ) {
    return {
        x: chunkX,
        z: chunkZ,
        poles: getPolePositionsInChunk(chunkX, chunkZ),
        terrain: {
            x: chunkX * CHUNK_SIZE,
            z: chunkZ * CHUNK_SIZE,
        },
    };
}

function updateChunks() {
    const camera = gameState.camera;
    const chunkX = Math.floor(camera.pos.x / CHUNK_SIZE);
    const chunkZ = Math.floor(camera.pos.z / CHUNK_SIZE);
    
    const renderDist = Math.ceil(RENDER_DISTANCE / CHUNK_SIZE);
    
    // Create new chunks
    for (let x = chunkX - renderDist; x <= chunkX + renderDist; x++) {
        for (let z = chunkZ - renderDist; z <= chunkZ + renderDist; z++) {
            const key = getChunkKey(x, z);
            if (!gameState.world.chunks.has(key)) {
                gameState.world.chunks.set(key, createChunk(x, z));
            }
        }
    }
    
    // Remove far chunks
    for (const [key, chunk] of gameState.world.chunks) {
        const dx = chunk.x - chunkX;
        const dz = chunk.z - chunkZ;
        if (Math.sqrt(dx * dx + dz * dz) > renderDist + 2) {
            gameState.world.chunks.delete(key);
        }
    }
}

// ==================== INPUT HANDLING ====================

window.addEventListener('keydown', (e) => {
    gameState.input.keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    gameState.input.keys[e.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (e) => {
    if (gameState.input.locked) {
        gameState.camera.yaw -= e.movementX * MOUSE_SENSITIVITY;
        gameState.camera.pitch -= e.movementY * MOUSE_SENSITIVITY;
        gameState.camera.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, gameState.camera.pitch));
    }
});

canvas.addEventListener('click', () => {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    gameState.input.locked = document.pointerLockElement === canvas;
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.exitPointerLock();
    }
});

// ==================== CAMERA UPDATE ====================

function updateCamera(deltaTime) {
    const camera = gameState.camera;
    const speed = (gameState.input.keys['shift'] ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED) * deltaTime * 1000;
    
    const forward = new Vec3(
        Math.sin(camera.yaw),
        0,
        Math.cos(camera.yaw)
    );
    const right = new Vec3(
        Math.cos(camera.yaw),
        0,
        -Math.sin(camera.yaw)
    );
    
    if (gameState.input.keys['w']) camera.pos = camera.pos.add(forward.mul(speed));
    if (gameState.input.keys['s']) camera.pos = camera.pos.sub(forward.mul(speed));
    if (gameState.input.keys['d']) camera.pos = camera.pos.add(right.mul(speed));
    if (gameState.input.keys['a']) camera.pos = camera.pos.sub(right.mul(speed));
    
    // Keep camera above ground
    camera.pos.y = Math.max(CAMERA_HEIGHT, camera.pos.y);
    
    // Wrap coordinates for infinite world
    const wrapDist = CHUNK_SIZE * 10;
    if (Math.abs(camera.pos.x) > wrapDist) camera.pos.x = ((camera.pos.x % wrapDist) + wrapDist) % wrapDist - wrapDist / 2;
    if (Math.abs(camera.pos.z) > wrapDist) camera.pos.z = ((camera.pos.z % wrapDist) + wrapDist) % wrapDist - wrapDist / 2;
}

function getViewMatrix() {
    const camera = gameState.camera;
    const target = new Vec3(
        camera.pos.x + Math.sin(camera.yaw) * Math.cos(camera.pitch),
        camera.pos.y + Math.sin(camera.pitch),
        camera.pos.z + Math.cos(camera.yaw) * Math.cos(camera.pitch)
    );
    return Mat4.lookAt(camera.pos.toArray(), target.toArray(), [0, 1, 0]);
}

// ==================== COLLISION DETECTION ====================

function checkCollisions(pos) {
    const radius = 0.3;
    
    for (const chunk of gameState.world.chunks.values()) {
        for (const pole of chunk.poles) {
            const dx = pos.x - pole.x;
            const dz = pos.z - pole.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < radius + BASE_RADIUS) {
                const angle = Math.atan2(dz, dx);
                const push = (radius + BASE_RADIUS - dist) * 1.01;
                return new Vec3(
                    pos.x + Math.cos(angle) * push,
                    pos.y,
                    pos.z + Math.sin(angle) * push
                );
            }
        }
    }
    
    return pos;
}

// ==================== RENDERING ====================

function render() {
    const now = performance.now();
    const deltaTime = (now - gameState.performance.lastTime) / 1000;
    gameState.performance.lastTime = now;
    
    // Update
    updateCamera(deltaTime);
    gameState.camera.pos = checkCollisions(gameState.camera.pos);
    updateChunks();
    
    // Setup viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.02, 0.04, 0.12, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    // Matrices
    const aspect = canvas.width / canvas.height;
    const projMatrix = Mat4.perspective(gameState.camera.fov, aspect, 0.1, RENDER_DISTANCE);
    const viewMatrix = getViewMatrix();
    
    // Render skybox
    gl.useProgram(skyProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(skyProgram, 'uProjectionMatrix'), false, projMatrix.data);
    gl.uniformMatrix4fv(gl.getUniformLocation(skyProgram, 'uViewMatrix'), false, viewMatrix.data);
    gl.depthFunc(gl.LEQUAL);
    gl.bindVertexArray(geometryCache.skybox.vao);
    gl.drawElements(gl.TRIANGLES, geometryCache.skybox.indexCount, gl.UNSIGNED_INT, 0);
    gl.depthFunc(gl.LESS);
    
    // Render terrain
    gl.useProgram(terrainProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(terrainProgram, 'uProjectionMatrix'), false, projMatrix.data);
    gl.uniformMatrix4fv(gl.getUniformLocation(terrainProgram, 'uViewMatrix'), false, viewMatrix.data);
    gl.uniform3fv(gl.getUniformLocation(terrainProgram, 'uCameraPos'), gameState.camera.pos.toArray());
    gl.uniform3fv(gl.getUniformLocation(terrainProgram, 'uLightPos'), [100, 100, 100]);
    gl.uniform1i(gl.getUniformLocation(terrainProgram, 'uTexture'), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, asphaltTexture);
    
    for (const chunk of gameState.world.chunks.values()) {
        const modelMatrix = new Mat4();
        modelMatrix.translate(chunk.terrain.x, 0, chunk.terrain.z);
        gl.uniformMatrix4fv(gl.getUniformLocation(terrainProgram, 'uMatrix'), false, modelMatrix.data);
        gl.bindVertexArray(geometryCache.plane.vao);
        gl.drawElements(gl.TRIANGLES, geometryCache.plane.indexCount, gl.UNSIGNED_INT, 0);
    }
    
    // Render lamps
    gl.useProgram(lampProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(lampProgram, 'uProjectionMatrix'), false, projMatrix.data);
    gl.uniformMatrix4fv(gl.getUniformLocation(lampProgram, 'uViewMatrix'), false, viewMatrix.data);
    gl.uniform3fv(gl.getUniformLocation(lampProgram, 'uCameraPos'), gameState.camera.pos.toArray());
    gl.uniform3fv(gl.getUniformLocation(lampProgram, 'uLightPos'), [100, 100, 100]);
    gl.uniform3f(gl.getUniformLocation(lampProgram, 'uColor'), 0.8, 0.8, 0.7);
    
    let poleCount = 0;
    for (const chunk of gameState.world.chunks.values()) {
        for (const pole of chunk.poles) {
            poleCount++;
            
            // Pole
            const poleMatrix = new Mat4();
            poleMatrix.translate(pole.x, pole.y, pole.z);
            gl.uniformMatrix4fv(gl.getUniformLocation(lampProgram, 'uMatrix'), false, poleMatrix.data);
            gl.bindVertexArray(geometryCache.cylinder.vao);
            gl.drawElements(gl.TRIANGLES, geometryCache.cylinder.indexCount, gl.UNSIGNED_INT, 0);
            
            // Base
            const baseMatrix = new Mat4();
            baseMatrix.translate(pole.x, BASE_HEIGHT / 2, pole.z);
            gl.uniformMatrix4fv(gl.getUniformLocation(lampProgram, 'uMatrix'), false, baseMatrix.data);
            gl.uniform3f(gl.getUniformLocation(lampProgram, 'uColor'), 0.3, 0.3, 0.3);
            gl.bindVertexArray(geometryCache.base.vao);
            gl.drawElements(gl.TRIANGLES, geometryCache.base.indexCount, gl.UNSIGNED_INT, 0);
        }
    }
    
    // Update HUD
    gameState.performance.frameCount++;
    if (now - gameState.performance.lastTime > 1000) {
        gameState.performance.fps = gameState.performance.frameCount;
        gameState.performance.frameCount = 0;
    }
    
    document.getElementById('posX').textContent = gameState.camera.pos.x.toFixed(1);
    document.getElementById('posY').textContent = gameState.camera.pos.y.toFixed(1);
    document.getElementById('posZ').textContent = gameState.camera.pos.z.toFixed(1);
    document.getElementById('fps').textContent = gameState.performance.fps;
    document.getElementById('chunks').textContent = gameState.world.chunks.size;
    document.getElementById('entities').textContent = poleCount;
    
    requestAnimationFrame(render);
}

// ==================== INITIALIZATION ====================

const asphaltTexture = createProceduralTexture(512, 512);

function handleStartGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('crosshair').classList.remove('hidden');
    
    // Initial chunk generation
    updateChunks();
    updateChunks();
    
    // Start render loop
    render();
}

document.getElementById('startButton').addEventListener('click', handleStartGame);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

// Initialize
resizeCanvas();
initGeometries();

console.log('🎮 Liminal Backrooms - WebGL Game Ready');
console.log('Controls: WASD to move, Mouse to look, Shift to sprint');
console.log('Click on the canvas to lock cursor, ESC to unlock');