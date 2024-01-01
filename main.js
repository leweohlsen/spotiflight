import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

import genrePoints from './points.json';

const movementSpeed = 5;

// Set up Three.js scene
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a camera control
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        controls.moveForward(1);
    }
});
scene.add(controls.getObject());

const vertexShader = `
  attribute vec3 color;
  attribute float size;

  varying vec3 vColor;
  varying float vSize;

  void main() {
    vColor = color;
    vSize = size;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = vSize;  // Set point size directly in the vertex shader
  }
`;

const fragmentShader = `
varying vec3 vColor;
varying float vSize;

void main() {
    float pointRadius = vSize / 2.0;
    float pointAlpha = smoothstep(0.0, pointRadius, length(gl_PointCoord - vec2(0.5)));

    // Rest of the existing code...

    if (pointAlpha < 0.01) discard;

    gl_FragColor = vec4(finalColor, pointAlpha);
}
`;

const material = new THREE.ShaderMaterial({
    uniforms: {
        // ... existing uniforms
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    vertexColors: true,
    attributes: {
        color: { type: 'v3', value: [] },
        size: { type: 'f', value: [] },
    },
});

// Pass the size and color attributes to the shader
material.onBeforeCompile = (shader) => {
    shader.uniforms.size = { value: sizes }; // Pass the size uniform to the shader
};

// Create a geometry with randomly distributed points
const numPoints = genrePoints.length;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(numPoints * 3);
const colors = new Float32Array(numPoints * 3);
const sizes = new Float32Array(numPoints);

const spread = 10;

// genrepoint looks like {coordinates:[12.31, 4.10, 1.21], name: "Rock"}

genrePoints.map(p => ({ ...p, size: Math.random() })).forEach((point, i) => {
    const x = point.coordinates[0] * spread;
    const y = point.coordinates[1] * spread;
    const z = point.coordinates[2] * spread;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const color = new THREE.Color(Math.random(), Math.random(), Math.random());

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = point.size * 10;
});

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

// Create points and add to the scene
const pointsMaterial = new THREE.PointsMaterial({ size: 0.4, vertexColors: true });
const points = new THREE.Points(geometry, pointsMaterial);
scene.add(points);

// Create a separate geometry for the glow effect
const glowGeometry = new THREE.BufferGeometry();
glowGeometry.setAttribute('position', geometry.getAttribute('position'));
glowGeometry.setAttribute('color', geometry.getAttribute('color'));

// Create a larger mesh for glowing effect
const glowMaterial = new THREE.PointsMaterial({ size: 1, color: 0x00ffff, sizeAttenuation: false });
const glowPoints = new THREE.Points(glowGeometry, glowMaterial);
scene.add(glowPoints);

// Add glow effect
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2, 1, 0.1);
bloomPass.threshold = 0;
bloomPass.strength = 10;
bloomPass.radius = 1;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

// Render loop
function animate() {
    requestAnimationFrame(animate);

    // Calculate delta time
    const delta = clock.getDelta();

    // Move the camera forward
    const moveDistance = movementSpeed * delta;
    const moveVector = new THREE.Vector3(0, 0, -moveDistance);
    controls.getObject().translateOnAxis(moveVector, 1);

    // Render the original scene
    renderer.render(scene, camera);

    // Render the scene with glow effect
    bloomComposer.render();

    // Find the closest point to the camera
    const cameraPosition = new THREE.Vector3();
    controls.getObject().getWorldPosition(cameraPosition);

    const closestPoint = findClosestPoint(cameraPosition);

    // Log the name of the closest point
    console.log("Closest Point:", closestPoint.name);
}


// Function to find the closest point
function findClosestPoint(cameraPosition) {
    let closestDistance = Infinity;
    let closestPoint = null;

    genrePoints.forEach((point, i) => {
        const pointPosition = new THREE.Vector3(point.coordinates[0] * spread, point.coordinates[1] * spread, point.coordinates[2] * spread);
        const distance = cameraPosition.distanceTo(pointPosition);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = { name: point.name, distance };
        }
    });

    return closestPoint;
}

// Start the game
function startGame() {
    camera.position.z = 30;
    animate();
}

// Event listeners for window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game when everything is loaded
window.onload = startGame;
