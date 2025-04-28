// src/SolarSystemScene.tsx
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import genresData from '../data/positioned_genres_final.json'; // Import preprocessed JSON

interface Genre {
    x: number;
    y: number;
    z: number;
    color: string;
    preview_url: string;
    // JSON 'parent' is always present, null for roots
    parent: string | null;
    mass: number;
}

const SolarSystemScene = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 500, 1000); // 🛠 Move camera way back

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.2; // slower rotation
        controls.maxDistance = 3000;
        controls.minDistance = 50;

        // Helpers
        const axesHelper = new THREE.AxesHelper(500);
        scene.add(axesHelper);
        const gridHelper = new THREE.GridHelper(1000, 20);
        scene.add(gridHelper);

        // Lighting

        // 1. Sun Light (PointLight) — brighter near the center
        const sunLight = new THREE.PointLight(0xffffaa, 1_000_000, 0, 2);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // 2. Ambient light — gentle light everywhere
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // soft white ambient
        scene.add(ambientLight);

        // Make the sun larger
        const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 10,
            roughness: 0.5,
            metalness: 0.1,
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Planets via InstancedMesh for performance
        const genres: Record<string, Genre> = genresData as Record<string, Genre>;
        const entries = Object.entries(genres);
        const count = entries.length;
        const POSITION_SCALE = 3;

        // Create a unit sphere and instanced mesh
        const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
        const sphereMaterial = new THREE.MeshStandardMaterial({ vertexColors: true });
        const planets = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, count);
        scene.add(planets);

        const dummy = new THREE.Object3D();
        entries.forEach(([_, genre], idx) => {
            const size = Math.max(0.5, Math.sqrt(genre.mass || 1));
            dummy.position.set(
                genre.x * POSITION_SCALE,
                genre.y * POSITION_SCALE,
                genre.z * POSITION_SCALE
            );
            dummy.scale.set(size, size, size);
            dummy.updateMatrix();
            planets.setMatrixAt(idx, dummy.matrix);
            planets.setColorAt(idx, new THREE.Color(genre.color));
        });
        planets.instanceMatrix.needsUpdate = true;
        // Update instance colors if available
        if (planets.instanceColor) {
            planets.instanceColor.needsUpdate = true;
        }

        console.log(`✅ Created ${count} planet instances`);

        const animate = () => {
            requestAnimationFrame(animate);

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            mountRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default SolarSystemScene;
