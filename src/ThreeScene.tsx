import React, { useEffect, useRef, useContext } from 'react';

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

    useEffect(() => {
        const acceleration = 3;
        const friction = 1

        let velocity = new THREE.Vector3()
        let previousClosestGenre: Genre | undefined = undefined;
        let currentPlayingSong: HTMLAudioElement | undefined = undefined;

        // Set up Three.js scene
        const scene = new THREE.Scene();
        const clock = new THREE.Clock();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        sceneRef.current?.appendChild(renderer.domElement);

        // Add a camera control
        const controls = new PointerLockControls(camera, document.body);
        document.addEventListener('click', () => controls.lock());
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                velocity.z -= acceleration;
            }
        });
        scene.add(controls.getObject());

        // Create a geometry with randomly distributed points
        const numPoints = genres.length;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(numPoints * 3);
        const colors = new Float32Array(numPoints * 3);
        const sizes = new Float32Array(numPoints);

        const spread = 400;

        function playSong(url: string) {
            const audio = new Audio(url);
            if (currentPlayingSong) currentPlayingSong.pause();
            audio.play();
            return audio;
        }

        // genrepoint looks like {coordinates:[12.31, 4.10, 1.21], name: "Rock"}
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
        glowGeometry.setAttribute('color', geometry.getAttribute('color'));

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

            // Move the camera forward based on velocity
            velocity.multiplyScalar(1 - friction * delta);  // Decrease velocity (simulate friction)
            controls.getObject().translateOnAxis(velocity, delta);  // Move camera

            // Render the original scene
            renderer.render(scene, camera);

            // Render the scene with glow effect
            composer.render();

            // Find the closest point to the camera
            const cameraPosition = new THREE.Vector3();
            controls.getObject().getWorldPosition(cameraPosition);

            const closestGenre = findClosestGenre(cameraPosition);
            if (closestGenre && previousClosestGenre != closestGenre) {
                // Log the name of the closest point
                console.log("Closest Genre:", closestGenre.name);
                hudContext?.setClosestGenre(closestGenre.name);
                // Play Song preview
                currentPlayingSong = playSong(closestGenre.preview_url)
                // Set previous closest Genre
                previousClosestGenre = closestGenre
            }
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
            camera.position.z = 30;
            animate();
        }

        function handleResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };

        // Event listeners for window resize
        window.addEventListener('resize', handleResize);

        startGame()

        // Cleanup on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            sceneRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={sceneRef} />;
};

export default ThreeScene;
