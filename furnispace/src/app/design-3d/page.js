'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Design3DPage() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const floorRef = useRef(null);
  const animationFrameId = useRef(null);
  const router = useRouter();
  const scale = 15; // 1ft = 15px
  const wallHeight = 10; // 10ft (150px at new scale)
  const canvasWidth = 800;
  const canvasHeight = 400;
  const floorScaleFactor = 1.5; // Floor is 50% larger

  // Load state from localStorage
  const [roomWidth, setRoomWidth] = useState(() => {
    const saved = localStorage.getItem('design-2d-data');
    return saved ? JSON.parse(saved).roomWidth || 10 : 10;
  });
  const [roomLength, setRoomLength] = useState(() => {
    const saved = localStorage.getItem('design-2d-data');
    return saved ? JSON.parse(saved).roomLength || 12 : 12;
  });
  const [floorColor, setFloorColor] = useState(() => {
    const saved = localStorage.getItem('design-2d-data');
    return saved ? JSON.parse(saved).floorColor || '#d1d5db' : '#d1d5db';
  });
  const [floorTexture, setFloorTexture] = useState(null);
  const [wallColor, setWallColor] = useState('#808080');
  const [wallTexture, setWallTexture] = useState(null);
  const [walls, setWalls] = useState(() => {
    const saved = localStorage.getItem('design-2d-data');
    if (saved) {
      const data = JSON.parse(saved);
      return data.walls || [
        { id: 1, start: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, end: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, length: roomWidth * scale, color: '#808080', texture: null },
        { id: 2, start: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, end: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, length: roomLength * scale, color: '#808080', texture: null },
        { id: 3, start: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, end: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, length: roomWidth * scale, color: '#808080', texture: null },
        { id: 4, start: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, end: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, length: roomLength * scale, color: '#808080', texture: null },
      ];
    }
    return [
      { id: 1, start: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, end: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, length: roomWidth * scale, color: '#808080', texture: null },
      { id: 2, start: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, end: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, length: roomLength * scale, color: '#808080', texture: null },
      { id: 3, start: { x: (canvasWidth + roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, end: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, length: roomWidth * scale, color: '#808080', texture: null },
      { id: 4, start: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight + roomLength * scale) / 2 }, end: { x: (canvasWidth - roomWidth * scale) / 2, y: (canvasHeight - roomLength * scale) / 2 }, length: roomLength * scale, color: '#808080', texture: null },
    ];
  });
  const [furniture, setFurniture] = useState(() => {
    const saved = localStorage.getItem('design-2d-data');
    return saved ? JSON.parse(saved).furniture || [] : [];
  });
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [wallVisibility, setWallVisibility] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [animationTime, setAnimationTime] = useState(0);

  // Available textures
  const textures = [
    { name: 'None', path: null },
    { name: 'Wood', path: '/textures/wood.jpg' },
    { name: 'Marble', path: '/textures/marble.jpg' },
    { name: 'Tile', path: '/textures/tile.jpg' },
  ];

  // Initialize Three.js scene
  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
    camera.position.set(canvasWidth / 2, 400, roomLength * scale * floorScaleFactor + 200);
    camera.lookAt(canvasWidth / 2, 0, roomWidth * scale / 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0xaaaaaa);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(canvasWidth / 2, 0, roomWidth * scale / 2);
    controls.update();
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(canvasWidth / 2, 500, roomLength * scale * floorScaleFactor + 100);
    scene.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(canvasWidth / 2, -500, -(roomLength * scale * floorScaleFactor + 100));
    scene.add(directionalLight2);
    const pointLight = new THREE.PointLight(0xffffff, 0.7, 1000);
    pointLight.position.set(canvasWidth / 2, 300, roomWidth * scale / 2);
    scene.add(pointLight);

    // Floor
    const scaledWidth = roomWidth * scale * floorScaleFactor;
    const scaledLength = roomLength * scale * floorScaleFactor;
    const floorGeometry = new THREE.PlaneGeometry(scaledWidth, scaledLength);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: floorColor, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(canvasWidth / 2, 0, scaledLength / 2);
    floor.userData = { type: 'floor' };
    scene.add(floor);
    floorRef.current = floor;

    // Animation loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      setAnimationTime((prev) => prev + 0.05);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current) rendererRef.current.dispose();
      if (sceneRef.current) sceneRef.current.clear();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Handle canvas click event separately
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      event.preventDefault();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children);

      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData.type === 'wall') {
          const wallId = intersects[i].object.userData.id;
          setSelectedWallId(wallId);
          break;
        }
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', onMouseClick);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', onMouseClick);
      }
    };
  }, []);

  // Update floor and walls
  useEffect(() => {
    if (floorRef.current) {
      floorRef.current.material.color.set(floorColor);
      const scaledWidth = roomWidth * scale * floorScaleFactor;
      const scaledLength = roomLength * scale * floorScaleFactor;
      const newGeometry = new THREE.PlaneGeometry(scaledWidth, scaledLength);
      floorRef.current.geometry.dispose();
      floorRef.current.geometry = newGeometry;
      floorRef.current.position.set(canvasWidth / 2, 0, scaledLength / 2);

      if (floorTexture) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          floorTexture,
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
            floorRef.current.material.map = texture;
            floorRef.current.material.color.set(0xffffff);
            floorRef.current.material.needsUpdate = true;
          },
          undefined,
          (err) => console.error('Error loading texture:', err)
        );
      } else {
        floorRef.current.material.map = null;
        floorRef.current.material.color.set(floorColor);
        floorRef.current.material.needsUpdate = true;
      }
    }

    setWalls((prevWalls) =>
      prevWalls.map((wall) => ({
        ...wall,
        color: wall.texture ? '#ffffff' : wallColor,
      }))
    );
  }, [roomWidth, roomLength, floorColor, floorTexture, wallColor, wallTexture]);

  // Update wall visibility and selection
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const updateWallVisibility = () => {
      const cameraPos = camera.position.clone();
      const target = controls.target.clone();
      const direction = target.sub(cameraPos).normalize();

      let closestWallId = null;
      let maxDot = -Infinity;

      walls.forEach((wall) => {
        const dx = wall.end.x - wall.start.x;
        const dz = -(wall.end.y - wall.start.y);
        const normal = new THREE.Vector3(-dz, 0, dx).normalize();
        const dot = direction.dot(normal);

        if (dot > maxDot) {
          maxDot = dot;
          closestWallId = wall.id;
        }
      });

      setWallVisibility((prev) => {
        const newVisibility = { ...prev };
        let hasChanged = false;
        walls.forEach((wall) => {
          const shouldBeVisible = wall.id !== closestWallId;
          if (newVisibility[wall.id] !== shouldBeVisible) {
            newVisibility[wall.id] = shouldBeVisible;
            hasChanged = true;
          }
        });
        return hasChanged ? newVisibility : prev;
      });
    };

    controls.addEventListener('change', updateWallVisibility);
    updateWallVisibility();

    return () => controls.removeEventListener('change', updateWallVisibility);
  }, [walls]);

  // Render walls and furniture with animation
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    scene.children.forEach((child) => {
      if (child.userData.type === 'wall' || child.userData.type === 'furniture') {
        scene.remove(child);
        child.geometry?.dispose();
        child.material?.dispose();
      }
    });

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    walls.forEach((wall) => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    const wallsCenterX = (minX + maxX) / 2;
    const wallsCenterY = (minY + maxY) / 2;
    const scaledWidth = roomWidth * scale * floorScaleFactor;
    const scaledLength = roomLength * scale * floorScaleFactor;
    const floorCenterX = canvasWidth / 2;
    const floorCenterZ = scaledLength / 2;
    const xOffset = floorCenterX - wallsCenterX;
    const zOffset = floorCenterZ - wallsCenterY;

    walls.forEach((wall) => {
      if (!wallVisibility[wall.id]) return;

      const shape = new THREE.Shape();
      const adjustedStartX = wall.start.x + xOffset - canvasWidth / 2;
      const adjustedStartZ = -(wall.start.y + zOffset - scaledLength / 2);
      const adjustedEndX = wall.end.x + xOffset - canvasWidth / 2;
      const adjustedEndZ = -(wall.end.y + zOffset - scaledLength / 2);

      shape.moveTo(adjustedStartX, adjustedStartZ);
      shape.lineTo(adjustedEndX, adjustedEndZ);

      const extrudeSettings = { depth: wallHeight * scale, bevelEnabled: false };
      const wallGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      const wallMaterial = new THREE.MeshPhongMaterial({
        color: wall.color,
        map: wall.texture ? new THREE.TextureLoader().load(wall.texture) : null,
        side: THREE.DoubleSide,
      });
      if (wall.texture) {
        wallMaterial.color.set(0xffffff);
        wallMaterial.needsUpdate = true;
      }

      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.rotation.x = Math.PI / 2;
      wallMesh.position.set(canvasWidth / 2, 150, scaledLength / 2);
      wallMesh.rotation.z = Math.PI;
      wallMesh.userData = { type: 'wall', id: wall.id };
      scene.add(wallMesh);

      // Animate scale for selected wall
      if (selectedWallId === wall.id) {
        const scaleFactor = 1 + 0.02 * Math.sin(animationTime); // Pulsing effect (1.0 to 1.04)
        wallMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      } else {
        wallMesh.scale.set(1, 1, 1); // Reset scale for non-selected walls
      }
    });

    furniture.forEach((item) => {
      const furnitureWidth = item.width * scale;
      const furnitureLength = item.length * scale;
      const furnitureHeight = 2 * scale;
      const furnitureGeometry = new THREE.BoxGeometry(furnitureWidth, furnitureHeight, furnitureLength);
      const furnitureMaterial = new THREE.MeshPhongMaterial({ color: item.color || '#8b4513' });
      const furnitureMesh = new THREE.Mesh(furnitureGeometry, furnitureMaterial);

      const adjustedFurnitureX = item.x + furnitureWidth / 2 + xOffset;
      const adjustedFurnitureZ = -(item.y + furnitureLength / 2) + zOffset;

      furnitureMesh.position.set(
        adjustedFurnitureX + canvasWidth / 2,
        furnitureHeight / 2,
        adjustedFurnitureZ + scaledLength / 2
      );
      furnitureMesh.userData = { type: 'furniture', id: item.id };
      scene.add(furnitureMesh);
    });
  }, [walls, furniture, wallVisibility, roomWidth, roomLength, selectedWallId, animationTime]);

  // Handle wall color and texture changes
  const handleGlobalWallColorChange = (color) => {
    setWallColor(color);
    setWalls((prevWalls) =>
      prevWalls.map((wall) => ({
        ...wall,
        color: wall.texture ? '#ffffff' : color,
      }))
    );
  };

  const handleWallColorChange = (color) => {
    if (selectedWallId) {
      setWalls((prevWalls) =>
        prevWalls.map((wall) =>
          wall.id === selectedWallId ? { ...wall, color: wall.texture ? '#ffffff' : color } : wall
        )
      );
    }
  };

  const handleGlobalWallTextureChange = (texturePath) => {
    setWallTexture(texturePath);
    setWalls((prevWalls) =>
      prevWalls.map((wall) => ({
        ...wall,
        texture: texturePath,
        color: texturePath ? '#ffffff' : wallColor,
      }))
    );
  };

  const handleWallTextureChange = (texturePath) => {
    if (selectedWallId) {
      setWalls((prevWalls) =>
        prevWalls.map((wall) =>
          wall.id === selectedWallId ? { ...wall, texture: texturePath, color: texturePath ? '#ffffff' : wallColor } : wall
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Furniture Design Studio (3D)</h1>
          <Button onClick={() => router.push('/design-2d')} variant="outline">
            Switch to 2D
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Design Controls</h2>
            <Tabs defaultValue="walls" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="walls">Walls</TabsTrigger>
                <TabsTrigger value="floor">Floor</TabsTrigger>
              </TabsList>
              <TabsContent value="walls">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Wall Controls</h3>
                  <div>
                    <label htmlFor="globalWallColor" className="block text-sm font-medium text-gray-700">
                      Global Wall Color
                    </label>
                    <Input
                      type="color"
                      id="globalWallColor"
                      value={wallColor}
                      onChange={(e) => handleGlobalWallColorChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="globalWallTexture" className="block text-sm font-medium text-gray-700">
                      Global Wall Texture
                    </label>
                    <Select onValueChange={handleGlobalWallTextureChange} value={wallTexture || 'None'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a texture" />
                      </SelectTrigger>
                      <SelectContent>
                        {textures.map((texture) => (
                          <SelectItem key={texture.name} value={texture.path}>
                            {texture.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Click a wall to select it, then change its color or texture.</p>
                    {selectedWallId && (
                      <>
                        <label htmlFor="wallColor" className="block text-sm font-medium text-gray-700">
                          Selected Wall Color
                        </label>
                        <Input
                          type="color"
                          id="wallColor"
                          value={walls.find((w) => w.id === selectedWallId)?.color || '#808080'}
                          onChange={(e) => handleWallColorChange(e.target.value)}
                        />
                        <label htmlFor="wallTexture" className="block text-sm font-medium text-gray-700 mt-2">
                          Selected Wall Texture
                        </label>
                        <Select
                          onValueChange={handleWallTextureChange}
                          value={walls.find((w) => w.id === selectedWallId)?.texture || 'None'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a texture" />
                          </SelectTrigger>
                          <SelectContent>
                            {textures.map((texture) => (
                              <SelectItem key={texture.name} value={texture.path}>
                                {texture.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="floor">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Floor Controls</h3>
                  <div>
                    <label htmlFor="floorColor" className="block text-sm font-medium text-gray-700">
                      Floor Color
                    </label>
                    <Input
                      type="color"
                      id="floorColor"
                      value={floorColor}
                      onChange={(e) => setFloorColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="floorTexture" className="block text-sm font-medium text-gray-700">
                      Floor Texture
                    </label>
                    <Select onValueChange={setFloorTexture} value={floorTexture || 'None'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a texture" />
                      </SelectTrigger>
                      <SelectContent>
                        {textures.map((texture) => (
                          <SelectItem key={texture.name} value={texture.path}>
                            {texture.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">3D Design Canvas</h2>
            <canvas ref={canvasRef} style={{ width: '800px', height: '400px' }} />
          </div>
        </div>
      </main>
    </div>
  );
}