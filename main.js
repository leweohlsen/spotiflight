import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

// Set up Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a camera control
const controls = new OrbitControls(camera, renderer.domElement);

// Create shader material
const vertexShader = `
  varying vec3 vColor;
  void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
varying vec3 vColor;
uniform vec3 randomCoords;  // Uniform for random coordinates

void main() {
    // Calculate lighting based on the distance from the camera
    vec3 lightDir = normalize(cameraPosition - gl_FragCoord.xyz);
    float diffuse = max(dot(normalize(vColor), lightDir), 0.2); // Adjust the 0.2 factor to control the intensity

    // Emit a random color using the uniform randomCoords
    vec3 randomColor = vec3(fract(sin(dot(gl_FragCoord.xyz + randomCoords, vec3(12.9898, 78.233, 45.543))) * 43758.5453));

    // Final color with lighting and random color
    vec3 finalColor = vColor * diffuse + randomColor;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

const material = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    vertexColors: true, // Enable vertex colors
});

// Create a geometry with randomly distributed points
const numPoints = 400;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(numPoints * 3);
const colors = new Float32Array(numPoints * 3);

for (let i = 0; i < numPoints; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = Math.random();
    colors[i * 3 + 1] = Math.random();
    colors[i * 3 + 2] = Math.random();
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Create points and add to the scene
const pointsMaterial = new THREE.PointsMaterial({ size: 0.2, vertexColors: true });
const points = new THREE.Points(geometry, pointsMaterial);
scene.add(points);

// Create a separate geometry for the glow effect
const glowGeometry = new THREE.BufferGeometry();
glowGeometry.setAttribute('position', geometry.getAttribute('position'));
glowGeometry.setAttribute('color', geometry.getAttribute('color'));

// Create a larger mesh for glowing effect
const glowMaterial = new THREE.PointsMaterial({ size: 0.4, color: 0xffffff, sizeAttenuation: false });
const glowPoints = new THREE.Points(glowGeometry, glowMaterial);
scene.add(glowPoints);

// Add glow effect
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2, 1, 0.1); // Increased strength
bloomPass.threshold = 0;
bloomPass.strength = 10;
bloomPass.radius = 1;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

// Render loop
function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Render the original scene
    renderer.render(scene, camera);

    // Render the scene with glow effect
    bloomComposer.render();
}

// Start the game
function startGame() {
    camera.position.z = 30; // Set initial camera position
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
