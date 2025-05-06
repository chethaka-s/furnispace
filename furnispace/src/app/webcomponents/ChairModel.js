'use client';
import { useRef, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';

export default function ChairModel() {
  const meshRef = useRef(null);

  // Load materials and model
  const materials = useLoader(MTLLoader, '/3dModels/Chair/Chair.mtl');
  const obj = useLoader(OBJLoader, '/3dModels/Chair/Chair.obj', (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  // Scale and position model
  useEffect(() => {
    if (obj) {
      obj.scale.set(0.05, 0.05, 0.05); // Adjust scale as needed
      obj.position.set(0, 0, 0); // Center in room
      obj.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [obj]);

  // Rotate model for demo
  useEffect(() => {
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.01;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return <primitive ref={meshRef} object={obj} />;
}