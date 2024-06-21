import React, { useEffect, useRef, useContext, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { HUDContext } from './HUDContext';
import genres from './genres.json';

const ThreeScene: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const hudContext = useContext(HUDContext);
    const [isSceneClicked, setIsSceneClicked] = useState(false);

    useEffect(() => {
        const spread = 400; // Size of the star field
        const acceleration = 3;
        const friction = 1;
        const gravity = 0.02;

        let velocity = new THREE.Vector3();
        let previousClosestGenre: Genre | undefined = undefined;
        let currentPlayingSong: HTMLAudioElement | undefined = undefined;

        // Set up Three.js scene
        const scene = new THREE.Scene();
        const clock = new THREE.Clock();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        sceneRef.current?.appendChild(renderer.domElement);

        // Add camera controls
        const controls = new PointerLockControls(camera, document.body);
        document.addEventListener('click', () => controls.lock());
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                velocity.z -= acceleration;
            }
        });
        scene.add(controls.getObject());

        // Initialize buffers
        const numPoints = genres.length;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(numPoints * 3);
        const colors = new Float32Array(numPoints * 3);
        const sizes = new Float32Array(numPoints);

        function playSong(url: string) {
            if (!isSceneClicked) return; // Only play if scene is clicked
            const audio = new Audio(url);
            if (currentPlayingSong) currentPlayingSong.pause();
            audio.play();
            return audio;
        }

        // Load the genres.json into respective buffers
        genres.map(p => ({ ...p, size: Math.random() })).forEach((genre, i) => {
            const x = genre.coordinates[0] * spread;
            const y = genre.coordinates[1] * spread;
            const z = genre.coordinates[2] * spread;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const color = new THREE.Color(Math.random(), Math.random(), Math.random());

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = genre.size * 10;
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

        // Create a larger mesh for glowing effect
        const glowMaterial = new THREE.PointsMaterial({ size: 1, color: 0x00ffff, sizeAttenuation: false });
        const glowPoints = new THREE.Points(glowGeometry, glowMaterial);
        scene.add(glowPoints);

        // Add glow effect
        const renderScene = new RenderPass(scene, camera);

        // Configure bloom
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2, 1, 0.1);
        bloomPass.threshold = 0;
        bloomPass.strength = 10;
        bloomPass.radius = 1;

        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        // Render loop
        function animate() {
            requestAnimationFrame(animate);

            // Calculate delta time
            const delta = clock.getDelta();

            // Find the closest point to the camera
            const cameraPosition = new THREE.Vector3();
            controls.getObject().getWorldPosition(cameraPosition);

            const closestGenre = findClosestGenre(cameraPosition);
            if (closestGenre) {
                // Apply gravity towards closest genre
                const directionToGenre = new THREE.Vector3(
                    closestGenre.coordinates[0] * spread - cameraPosition.x,
                    closestGenre.coordinates[1] * spread - cameraPosition.y,
                    closestGenre.coordinates[2] * spread - cameraPosition.z
                ).normalize();

                velocity.add(directionToGenre.multiplyScalar(gravity));

                if (previousClosestGenre !== closestGenre) {
                    // Log the name of the closest point
                    console.log("Closest Genre:", closestGenre.name);
                    hudContext?.setClosestGenre(closestGenre.name);

                    // Play Song preview if the closest genre has changed
                    currentPlayingSong = playSong(closestGenre.preview_url);

                    // Update previous closest genre
                    previousClosestGenre = closestGenre;
                }
            }

            // Move the camera forward based on velocity
            velocity.multiplyScalar(1 - friction * delta);  // Decrease velocity (simulate friction)
            controls.getObject().translateOnAxis(velocity, delta);  // Move camera

            // Render the original scene
            renderer.render(scene, camera);

            // Render the scene with glow effect
            composer.render();
        }

        // Function to find the closest point
        function findClosestGenre(cameraPosition: THREE.Vector3): Genre | null {
            let closestDistance = Infinity;
            let closestGenre = null;

            genres.forEach((genre: Genre) => {
                const pointPosition = new THREE.Vector3(genre.coordinates[0] * spread, genre.coordinates[1] * spread, genre.coordinates[2] * spread);
                const distance = cameraPosition.distanceTo(pointPosition);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestGenre = genre;
                }
            });

            return closestGenre;
        }

        // Start the game
        function startGame() {
            // Start in a random point in space
            camera.position.x = Math.random() * spread;
            camera.position.y = Math.random() * spread;
            camera.position.z = Math.random() * spread;

            // Point the camera towards the center
            camera.lookAt(new THREE.Vector3(0, 0, 0));

            // Start animation loop
            animate();
        }

        function handleResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        }

        // Click handler to gain focus and start audio playback
        const handleSceneClick = () => {
            setIsSceneClicked(true);
        };

        // Attach click event listener to the scene
        sceneRef.current?.addEventListener('click', handleSceneClick);

        // Event listeners for window resize
        window.addEventListener('resize', handleResize);

        startGame();

        // Cleanup on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            sceneRef.current?.removeEventListener('click', handleSceneClick);
            sceneRef.current?.removeChild(renderer.domElement);
        };
    }, [isSceneClicked]); // Add isSceneClicked as a dependency

    return <div ref={sceneRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeScene;
