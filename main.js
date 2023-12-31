import * as THREE from 'three';

// Global variables
let spaceship;
let movementLine;
let camera;

const acceleration = 0.01;
const rotateSpeed = 0.1;

function createSceneAndCamera() {
    const scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Assign value to the global camera variable
    camera.position.z = -5;
    return { scene, camera };
}

function createRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    return renderer;
}

// Custom shader material
const vertexShader = `
    varying vec3 vNormal;

    void main() {
        vNormal = normalMatrix * normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec3 vNormal;

    void main() {
        vec3 lightDirection = normalize(vec3(0.5, 0.5, -1.0)); // Adjust the light direction as needed
        float brightness = max(dot(vNormal, lightDirection), 0.1);

        gl_FragColor = vec4(vec3(0.0, 1.0, 0.0) * brightness, 1.0); // Green color, adjust as needed
    }
`;

function addSpaceshipToScene(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 3);
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });

    spaceship = new THREE.Mesh(geometry, material);
    spaceship.speed = 0;

    // Debug helpers
    const boxHelper = new THREE.BoxHelper(spaceship, 0xffff00); // yellow bounding box
    const axesHelper = new THREE.AxesHelper(2); // size = 2

    // Add the helpers to the spaceship
    spaceship.add(boxHelper);
    spaceship.add(axesHelper);

    scene.add(spaceship);
}

function addLightsToScene(scene) {
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 0, -10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);
}

const loader = new THREE.TextureLoader();
const textureFlare0 = loader.load("path_to_your_texture_image");

function addStarToScene(scene, x, y, z) {
    // Generate a random size for the star within the range of 0.1 to 1.5
    const minSize = 0.1;
    const maxSize = 3.5;
    const size = Math.random() * (maxSize - minSize) + minSize;

    // Create a custom shader material for the star
    const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color1: { value: new THREE.Color(Math.random(), Math.random(), Math.random()) },
            color2: { value: new THREE.Color(0, 0, 0) }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color1;
            uniform vec3 color2;

            varying vec2 vUv;

            void main() {
                float r = length(vUv - vec2(0.5));
                vec3 color = mix(color1, color2, smoothstep(0.0, 1.0, r));
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    // Create a star mesh with a sphere geometry
    const starGeometry = new THREE.SphereGeometry(size, 24, 24);
    const star = new THREE.Mesh(starGeometry, starMaterial);

    // Set the position of the star
    star.position.set(x, y, z);

    // Brightness is proportional to the size of the star
    const brightness = size * 10;

    // Create a point light at the position of the star to simulate a glow effect
    const starLight = new THREE.PointLight(0xffffe5, brightness, size * 10); 
    starLight.position.set(x, y, z);
    
    // Add lens flare
    var flareColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    var lensFlare = new THREE.LensFlare(textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor);

    starLight.add(lensFlare);

    // Add the star and its light to the scene
    scene.add(star);
    scene.add(starLight);
}

function updateCamera() {
    // Calculate the offset from the spaceship
    const offset = new THREE.Vector3(0, 2, -5);

    // Apply the offset in the spaceship's local space
    offset.applyMatrix4(spaceship.matrixWorld);

    // Make the camera look at the spaceship's position
    camera.position.lerp(offset, 0.1);
    
    // Update the camera's rotation to match the spaceship's rotation
    camera.quaternion.copy(spaceship.quaternion);

    camera.lookAt(spaceship.position);
}

// Global variables for rotation target
let targetRotation = new THREE.Quaternion();

function handleKeydown(event) {
    // Create a temporary quaternion for this rotation
    let tempQuaternion = new THREE.Quaternion();
    
    switch (event.key) {
        case 'ArrowUp':
            tempQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -rotateSpeed);
            break;
        case 'ArrowDown':
            tempQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotateSpeed);
            break;
        case 'ArrowLeft':
            tempQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed);
            break;
        case 'ArrowRight':
            tempQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -rotateSpeed);
            break;
        case ' ':
            spaceship.speed += acceleration;
            return; // No rotation to perform, so we return early
    }
    
    // Multiply the current target rotation with this new rotation
    targetRotation.multiplyQuaternions(tempQuaternion, targetRotation);
}

function animate(renderer, scene, camera) {
    // Remove the previous movement line
    if (movementLine) {
        spaceship.remove(movementLine);
    }

    // Calculate the direction of movement
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(spaceship.quaternion);

    // Multiply the direction by the spaceship's speed
    direction.multiplyScalar(spaceship.speed);

    // Add the calculated movement to the spaceship's current position
    spaceship.position.add(direction);

    // Interpolate the spaceship's rotation towards the target rotation
    spaceship.quaternion.slerp(targetRotation, 0.07); // Adjust the second parameter to control speed of interpolation

    // Let the camera follow the spaceship
    updateCamera();

    renderer.render(scene, camera);
    requestAnimationFrame(() => animate(renderer, scene, camera));
}

// Initialization
const { scene } = createSceneAndCamera();
const renderer = createRenderer();

addSpaceshipToScene(scene);
addLightsToScene(scene);

// Add stars to the scene
// Add 100 stars to the scene with random positions and brightness
for (let i = 0; i < 200; i++) {
    // Generate random positions within the range of -50 to 50 for each axis
    const x = Math.random() * 100 - 50;
    const y = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;

    addStarToScene(scene, x, y, z);
}

document.addEventListener('keydown', handleKeydown, false);

// Start animation loop
animate(renderer, scene, camera);
