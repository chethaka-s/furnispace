'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
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
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const selectedObjectRef = useRef(null);
  const router = useRouter();
  const scale = 15; // 1ft = 15px
  const wallHeight = 10; // 10ft (150px)
  const canvasWidth = 800;
  const canvasHeight = 400;
  const floorScaleFactor = 1.5;
  const loadedModelsRef = useRef(new Map());
  const transformControlsRef = useRef(null);
  const [isArrangementMode, setIsArrangementMode] = useState(false);

  // Add a function to safely access localStorage
  const getLocalStorageItem = (key, defaultValue) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    }
    return defaultValue;
  };

  // Modify the state initializations that use localStorage
  const [roomWidth, setRoomWidth] = useState(() => getLocalStorageItem('design-3d-data', {}).roomWidth || 10);
  const [roomLength, setRoomLength] = useState(() => getLocalStorageItem('design-3d-data', {}).roomLength || 12);
  const [floorColor, setFloorColor] = useState(() => getLocalStorageItem('design-3d-data', {}).floorColor || '#d1d5db');
  const [floorTexture, setFloorTexture] = useState(() => getLocalStorageItem('design-3d-data', {}).floorTexture || null);
  const [wallColor, setWallColor] = useState(() => getLocalStorageItem('design-3d-data', {}).wallColor || '#808080');
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [wallVisibility, setWallVisibility] = useState(() => getLocalStorageItem('design-3d-data', {}).wallVisibility || { 1: true, 2: true, 3: true, 4: true });
  const [animationTime, setAnimationTime] = useState(0);
  const [furnitureScale, setFurnitureScale] = useState(1);
  const [furnitureRotation, setFurnitureRotation] = useState(0);
  const [transformMode, setTransformMode] = useState('translate'); // 'translate', 'rotate', 'scale'

  // Modify the walls state initialization
  const [walls, setWalls] = useState(() => {
    const savedData = getLocalStorageItem('design-3d-data', {});
    if (savedData.walls && savedData.walls.length > 0) {
      return savedData.walls;
    }

    // Fallback to default walls
    const widthPx = roomWidth * scale;
    const heightPx = roomLength * scale;
    const xOffset = (canvasWidth - widthPx) / 2;
    const yOffset = (canvasHeight - heightPx) / 2;
    return [
      { id: 1, start: { x: xOffset, y: yOffset }, end: { x: xOffset + widthPx, y: yOffset }, length: widthPx, color: wallColor },
      { id: 2, start: { x: xOffset + widthPx, y: yOffset }, end: { x: xOffset + widthPx, y: yOffset + heightPx }, length: heightPx, color: wallColor },
      { id: 3, start: { x: xOffset + widthPx, y: yOffset + heightPx }, end: { x: xOffset, y: yOffset + heightPx }, length: widthPx, color: wallColor },
      { id: 4, start: { x: xOffset, y: yOffset + heightPx }, end: { x: xOffset, y: yOffset }, length: heightPx, color: wallColor },
    ];
  });

  // Add effect to update room dimensions based on wall configuration
  useEffect(() => {
    if (walls.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      walls.forEach((wall) => {
        minX = Math.min(minX, wall.start.x, wall.end.x);
        maxX = Math.max(maxX, wall.start.x, wall.end.x);
        minY = Math.min(minY, wall.start.y, wall.end.y);
        maxY = Math.max(maxY, wall.start.y, wall.end.y);
      });

      const width = (maxX - minX) / scale;
      const length = (maxY - minY) / scale;
      setRoomWidth(width);
      setRoomLength(length);
    }
  }, [walls]);

  // Add a cleanup function to remove all furniture
  const cleanupAllFurniture = () => {
    if (sceneRef.current) {
      const furnitureObjects = sceneRef.current.children.filter(
        child => child.userData.type === 'furniture'
      );
      
      furnitureObjects.forEach(obj => {
        sceneRef.current.remove(obj);
        obj.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      });
    }
    loadedModelsRef.current.clear();
  };

  // Modify the furniture state initialization
  const [furniture, setFurniture] = useState(() => {
    const savedData = getLocalStorageItem('design-3d-data', {});
    // Only load furniture if it's explicitly included and not empty
    if (savedData.furniture && savedData.furniture.length > 0) {
      return savedData.furniture.map(item => ({
        ...item,
        selected: false // Reset selection state on load
      }));
    }
    return []; // Start with empty furniture by default
  });

  // Update the furniture models array to remove coffee table completely
  const furnitureModels = [
    { name: 'Chair', thumbnail: '/thumb/chair.jpg', path: '/models/Chair/Chair.obj', defaultScale: 25.0 },
    { name: 'Bookshelf', thumbnail: '/thumb/bookshelf.jpg', path: '/models/Bookshelf.obj', defaultScale: 30 },
    { name: 'Dining Table', thumbnail: '/thumb/diningtable.jpg', path: '/models/Dining Table/DiningTable.obj', defaultScale: 0.55 },
    { name: 'Sofa', thumbnail: '/thumb/sofa.jpg', path: '/models/sofa.obj', defaultScale: 0.2 },
    { name: 'Bed', thumbnail: '/thumb/bed.jpg', path: '/models/bed.obj', defaultScale: 0.3 },
    {name: 'BeanBag', thumbnail: '/thumb/beanbag.jpg', path: '/models/BeanBagChair.obj', defaultScale: 0.3},
     {name: 'TvStand', thumbnail: '/thumb/tvstand.jpg', path: '/models/TvStand.obj', defaultScale: 0.3},
     {name: 'ArmChair', thumbnail: '/thumb/armchair.jpg', path: '/models/ArmChair.obj', defaultScale: 0.3},
     {name: 'Wardrobe', thumbnail: '/thumb/wardrobe.jpg', path: '/models/Wardrobe.obj', defaultScale: 7},
     {name: 'CofeeTable', thumbnail: '/thumb/cofeetable.jpg', path: '/models/CofeeTable.obj', defaultScale: 0.3},
     {name: 'DressingTable', thumbnail: '/thumb/dressingtable.jpg', path: '/models/DressingTable.obj', defaultScale: 35},
    
    // Add new furniture items here following the same pattern:
    // { 
    //   name: 'Furniture Name', 
    //   thumbnail: '/thumb/furniture-thumbnail.jpg',  // Add thumbnail image in public/thumb/
    //   path: '/models/furniture-model.obj',         // Add 3D model in public/models/
    //   defaultScale: 1.0                           // Adjust scale as needed
    // },
  ];

  // Textures
  const textures = [
    { name: 'None', path: null },
    { name: 'Wood', path: '/textures/wood.jpg' },
    { name: 'Marble', path: '/textures/marble.jpg' },
    { name: 'Stone', path: '/textures/stone.jpg' },
  ];

  // Modify the localStorage save effect to check for window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const designData = {
        roomWidth,
        roomLength,
        floorColor,
        floorTexture,
        wallColor,
        walls,
        furniture,
        wallVisibility,
      };
      localStorage.setItem('design-3d-data', JSON.stringify(designData));
    }
  }, [roomWidth, roomLength, floorColor, floorTexture, wallColor, walls, furniture, wallVisibility]);

  // Add effect to handle initial loading and cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clean up any existing furniture first
      cleanupAllFurniture();
      
      // Get the saved data
      const savedData = getLocalStorageItem('design-3d-data', {});
      
      // If we're coming from 2D view (no furniture data), ensure state is clean
      if (!savedData.furniture || savedData.furniture.length === 0) {
        setFurniture([]);
        savedData.furniture = [];
        localStorage.setItem('design-3d-data', JSON.stringify(savedData));
      }
    }
  }, []);

  // Update the furniture loading effect
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const loader = new OBJLoader();

    // Keep track of processed furniture IDs
    const processedIds = new Set();

    // Remove furniture that's no longer in state
    scene.children
      .filter(child => 
        child.userData.type === 'furniture' && 
        !furniture.find(f => f.id === child.userData.id)
      )
      .forEach(child => {
        scene.remove(child);
        child.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => material.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
        loadedModelsRef.current.delete(child.userData.id);
      });

    // Process each furniture item
    furniture.forEach(item => {
      if (!item.modelPath || processedIds.has(item.id)) return;

      processedIds.add(item.id);
      
      // Check if object already exists in scene
      let existingObject = scene.children.find(
        child => child.userData.type === 'furniture' && child.userData.id === item.id
      );

      if (existingObject) {
        // Update existing object
        existingObject.position.set(item.x || 0, item.y || 0, item.z || 0);
        existingObject.rotation.y = item.rotation || 0;
        const scale = item.scale || item.defaultScale || 0.1;
        existingObject.scale.set(scale, scale, scale);

        // Update materials
        existingObject.traverse((child) => {
          if (child.isMesh) {
            if (item.selected) {
              const pulseScale = 1 + 0.2 * Math.sin(animationTime * 2);
              const pulseColor = child.userData.originalColor.clone();
              pulseColor.multiplyScalar(pulseScale);
              child.material.color.copy(pulseColor);
            } else {
              child.material.color.copy(child.userData.originalColor);
            }
            child.material.needsUpdate = true;
          }
        });
      } else if (!loadedModelsRef.current.has(item.id)) {
        // Only load if not already loaded
        loader.load(
          item.modelPath,
          (obj) => {
            if (!sceneRef.current || loadedModelsRef.current.has(item.id)) return;

            const scale = item.scale || item.defaultScale || 0.1;
            obj.scale.set(scale, scale, scale);
            obj.position.set(item.x || 0, item.y || 0, item.z || 0);
            obj.rotation.y = item.rotation || 0;
            obj.userData = { type: 'furniture', id: item.id };

            obj.traverse((child) => {
              if (child.isMesh) {
                child.material = new THREE.MeshPhongMaterial({
                  color: item.color || '#8b4513',
                  side: THREE.DoubleSide,
                  depthTest: true,
                  depthWrite: true,
                });
                child.userData.originalColor = new THREE.Color(item.color || '#8b4513');
              }
            });

            scene.add(obj);
            loadedModelsRef.current.set(item.id, obj);
          },
          undefined,
          (err) => console.error(`Error loading OBJ ${item.modelPath}:`, err)
        );
      }
    });
  }, [furniture, animationTime]);

  // Modify the Three.js initialization useEffect
  useEffect(() => {
    if (!canvasRef.current) return;

    // Clear any existing renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    // Clear any existing scene
    if (sceneRef.current) {
      sceneRef.current.clear();
    }

    try {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
      camera.position.set(canvasWidth / 2, 400, roomLength * scale * floorScaleFactor + 200);
      camera.lookAt(canvasWidth / 2, 0, roomWidth * scale / 2);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        powerPreference: "default",
        preserveDrawingBuffer: true
      });
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
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
        
        animationFrameId.current = requestAnimationFrame(animate);
        setAnimationTime((prev) => prev + 0.05);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };
      animate();

      // Cleanup function
      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }

        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current = null;
        }

        if (sceneRef.current) {
          sceneRef.current.traverse((object) => {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
          sceneRef.current.clear();
        }

        // Clear all refs
        sceneRef.current = null;
        cameraRef.current = null;
        controlsRef.current = null;
        floorRef.current = null;
        selectedObjectRef.current = null;
        loadedModelsRef.current.clear();
      };
    } catch (error) {
      console.error('Error initializing WebGL:', error);
    }
  }, []);

  // Mouse move handler for dragging furniture
  const onMouseMove = (event) => {
    if (!selectedObjectRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera({ x, y }, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(floorRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      selectedObjectRef.current.position.x = point.x;
      selectedObjectRef.current.position.z = point.z;

      // Update furniture state with new position
      setFurniture((prev) =>
        prev.map((item) =>
          item.id === selectedObjectRef.current.userData.id
            ? { ...item, x: point.x, z: point.z }
            : item
        )
      );
    }
  };

  // Modify the click handling useEffect
  useEffect(() => {
    const onMouseDown = (event) => {
      event.preventDefault();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      // Get all meshes that can be intersected
      const meshes = [];
      sceneRef.current.traverse((object) => {
        if (object.isMesh) {
          if (object.parent?.userData.type === 'furniture' || (!isArrangementMode && object.userData.type === 'wall')) {
            meshes.push(object);
          }
        }
      });

      const intersects = raycasterRef.current.intersectObjects(meshes);

      let foundObject = false;
      if (intersects.length > 0) {
        const intersectedObj = intersects[0].object;
        const furnitureParent = intersectedObj.parent?.userData.type === 'furniture' ? intersectedObj.parent : null;

        if (isArrangementMode && furnitureParent) {
          // In arrangement mode, only select furniture
          selectedObjectRef.current = furnitureParent;
          setFurniture((prev) =>
            prev.map((item) => ({
              ...item,
              selected: item.id === furnitureParent.userData.id
            }))
          );
          foundObject = true;
        } else if (!isArrangementMode) {
          // In normal mode, can select both walls and furniture
          if (furnitureParent) {
            selectedObjectRef.current = furnitureParent;
            setFurniture((prev) =>
              prev.map((item) => ({
                ...item,
                selected: item.id === furnitureParent.userData.id
              }))
            );
            foundObject = true;
          } else if (intersectedObj.userData.type === 'wall') {
            setSelectedWallId(intersectedObj.userData.id);
            foundObject = true;
          }
        }
      }

      if (!foundObject) {
        // Deselect everything if nothing was clicked
        selectedObjectRef.current = null;
        if (!isArrangementMode) {
          setSelectedWallId(null);
        }
        setFurniture((prev) =>
          prev.map((item) => ({ ...item, selected: false }))
        );
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousedown', onMouseDown);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', onMouseDown);
      }
    };
  }, [furniture, isArrangementMode]);

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
        textureLoader.load(floorTexture, (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(4, 4);
          floorRef.current.material.map = texture;
          floorRef.current.material.color.set(0xffffff);
          floorRef.current.material.needsUpdate = true;
        });
      } else {
        floorRef.current.material.map = null;
        floorRef.current.material.color.set(floorColor);
        floorRef.current.material.needsUpdate = true;
      }
    }

    // Update wall colors in the scene
    const scene = sceneRef.current;
    if (scene) {
      scene.children.forEach((child) => {
        if (child.userData.type === 'wall') {
          const wall = walls.find(w => w.id === child.userData.id);
          if (wall) {
            child.material.color.set(wall.color);
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [roomWidth, roomLength, floorColor, floorTexture, wallColor, walls]);

  // Update wall visibility
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || walls.length === 0) return;

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
          const shouldBeVisible = closestWallId ? wall.id !== closestWallId : true;
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

  // Modify the furniture rendering useEffect
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Clean up any furniture objects that shouldn't be in the scene
    const furnitureToRemove = scene.children.filter(
      child => child.userData.type === 'furniture' && !furniture.find(f => f.id === child.userData.id)
    );

    furnitureToRemove.forEach(obj => {
      scene.remove(obj);
      obj.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      loadedModelsRef.current.delete(obj.userData.id);
    });

    // Update existing furniture
    furniture.forEach((item) => {
      const existingObject = scene.children.find(
        child => child.userData.type === 'furniture' && child.userData.id === item.id
      );

      if (existingObject) {
        // Update transform
        existingObject.position.set(item.x || canvasWidth / 2, item.y || 0, item.z || roomLength * scale * floorScaleFactor / 2);
        existingObject.rotation.y = item.rotation || 0;
        existingObject.scale.set(item.scale || 0.1, item.scale || 0.1, item.scale || 0.1);

        // Update materials and selection state
        existingObject.traverse((child) => {
          if (child.isMesh) {
            if (item.selected) {
              const pulseScale = 1 + 0.2 * Math.sin(animationTime * 2);
              const pulseColor = child.userData.originalColor.clone();
              pulseColor.multiplyScalar(pulseScale);
              child.material.color.copy(pulseColor);
            } else {
              child.material.color.copy(child.userData.originalColor);
            }
            child.material.needsUpdate = true;
          }
        });

        // Update selection reference
        if (item.selected) {
          selectedObjectRef.current = existingObject;
        } else if (selectedObjectRef.current === existingObject) {
          selectedObjectRef.current = null;
        }
      }
    });
  }, [furniture, animationTime]);

  // Update the wall color handlers
  const handleGlobalWallColorChange = (color) => {
    setWallColor(color);
    setWalls((prevWalls) =>
      prevWalls.map((wall) => ({
        ...wall,
        color: color,
      }))
    );
  };

  const handleWallColorChange = (color) => {
    if (selectedWallId) {
      setWalls((prevWalls) =>
        prevWalls.map((wall) =>
          wall.id === selectedWallId ? { ...wall, color } : wall
        )
      );
    }
  };

  // Update the wall material handling in useEffect
  useEffect(() => {
    // Update wall colors in the scene
    const scene = sceneRef.current;
    if (scene) {
      scene.children.forEach((child) => {
        if (child.userData.type === 'wall') {
          const wall = walls.find(w => w.id === child.userData.id);
          if (wall) {
            child.material.color.set(wall.color);
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [walls]);

  // Handle wall and furniture controls
  const handleAddFurniture = (model) => {
    const newId = Date.now() + Math.random();
    const newFurniture = {
      id: newId,
      type: model.name,
      modelPath: model.path,
      x: canvasWidth / 2,
      y: 0,
      z: roomLength * scale * floorScaleFactor / 2,
      scale: model.defaultScale || 0.1,
      rotation: 0,
      color: '#8b4513',
      selected: true,
    };

    // First deselect any currently selected furniture
    setFurniture((prev) => {
      const updatedFurniture = prev.map(item => ({ ...item, selected: false }));
      return [...updatedFurniture, newFurniture];
    });

    // Update localStorage
    if (typeof window !== 'undefined') {
      const savedData = JSON.parse(localStorage.getItem('design-3d-data') || '{}');
      savedData.furniture = savedData.furniture || [];
      savedData.furniture = [...savedData.furniture.map(item => ({ ...item, selected: false })), newFurniture];
      localStorage.setItem('design-3d-data', JSON.stringify(savedData));
    }
  };

  const handleFurnitureScaleChange = (scale) => {
    if (!selectedObjectRef.current) return;
    
    const newScale = parseFloat(scale);
    if (isNaN(newScale)) return;
    
    selectedObjectRef.current.scale.set(newScale, newScale, newScale);
    setFurnitureScale(newScale);
    
    // Update furniture state
    setFurniture((prev) =>
      prev.map((item) =>
        item.id === selectedObjectRef.current.userData.id
          ? { ...item, scale: newScale }
          : item
      )
    );
  };

  const handleFurnitureRotationChange = (rotation) => {
    if (!selectedObjectRef.current) return;
    
    const newRotation = (parseFloat(rotation) * Math.PI) / 180; // Convert degrees to radians
    if (isNaN(newRotation)) return;
    
    selectedObjectRef.current.rotation.y = newRotation;
    setFurnitureRotation(rotation);
    
    // Update furniture state
    setFurniture((prev) =>
      prev.map((item) =>
        item.id === selectedObjectRef.current.userData.id
          ? { ...item, rotation: newRotation }
          : item
      )
    );
  };

  const handleFurnitureColorChange = (color) => {
    if (!selectedObjectRef.current) return;
    
    const selectedId = selectedObjectRef.current.userData.id;
    
    // Update the 3D object
    selectedObjectRef.current.traverse((child) => {
      if (child.isMesh) {
        if (!child.material) {
          child.material = new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: true,
          });
        } else {
          child.material.color.set(color);
        }
        child.userData.originalColor = new THREE.Color(color);
        child.material.needsUpdate = true;
      }
    });
    
    // Update furniture state
    setFurniture((prev) =>
      prev.map((item) =>
        item.id === selectedId
          ? { ...item, color: color }
          : item
      )
    );

    // Update localStorage
    if (typeof window !== 'undefined') {
      const savedData = JSON.parse(localStorage.getItem('design-3d-data') || '{}');
      if (savedData.furniture) {
        savedData.furniture = savedData.furniture.map(item =>
          item.id === selectedId ? { ...item, color: color } : item
        );
        localStorage.setItem('design-3d-data', JSON.stringify(savedData));
      }
    }
  };

  const handleSaveDesign = async () => {
    // Take a screenshot of the current view
    const canvas = rendererRef.current.domElement;
    const preview = canvas.toDataURL('image/jpeg', 0.5);

    // Create design object with complete state
    const design = {
      id: Date.now().toString(),
      name: `3D Room Design ${new Date().toLocaleDateString()}`,
      type: '3d',
      createdAt: new Date().toISOString(),
      preview: preview,
      data: {
        roomWidth,
        roomLength,
        floorColor,
        floorTexture,
        wallColor,
        walls: walls.map(wall => ({
          ...wall,
          color: wall.color || wallColor // Ensure each wall has a color
        })),
        furniture: furniture.map(item => ({
          ...item,
          modelPath: item.modelPath || furnitureModels.find(m => m.name === item.type)?.path,
          defaultScale: item.defaultScale || furnitureModels.find(m => m.name === item.type)?.defaultScale
        })),
        wallVisibility
      }
    };

    // Get existing designs
    const existingDesigns = JSON.parse(localStorage.getItem('furnispace_designs') || '[]');
    
    // Add new design
    const updatedDesigns = [...existingDesigns, design];
    
    // Save to localStorage
    localStorage.setItem('furnispace_designs', JSON.stringify(updatedDesigns));

    // Also save current state to design-3d-data
    localStorage.setItem('design-3d-data', JSON.stringify(design.data));

    // Show success message
    alert('Design saved successfully!');
  };

  // Add cleanup to loadedModelsRef when component unmounts
  useEffect(() => {
    return () => {
      // Clear any loaded models
      loadedModelsRef.current.forEach((model) => {
        model.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      });
      loadedModelsRef.current.clear();
    };
  }, []);

  // Modify the keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedObjectRef.current) return;

      // Prevent default behavior for arrow keys to stop scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const moveStep = e.shiftKey ? 1 : 10;
      const rotateStep = e.shiftKey ? Math.PI / 36 : Math.PI / 18;
      const scaleStep = e.shiftKey ? 0.05 : 0.1;

      // Create a temporary object to store updates
      const updates = {};

      switch (e.key) {
        case 'ArrowLeft':
          selectedObjectRef.current.position.x -= moveStep;
          updates.x = selectedObjectRef.current.position.x;
          break;
        case 'ArrowRight':
          selectedObjectRef.current.position.x += moveStep;
          updates.x = selectedObjectRef.current.position.x;
          break;
        case 'ArrowUp':
          selectedObjectRef.current.position.z -= moveStep;
          updates.z = selectedObjectRef.current.position.z;
          break;
        case 'ArrowDown':
          selectedObjectRef.current.position.z += moveStep;
          updates.z = selectedObjectRef.current.position.z;
          break;
        case 'r':
          selectedObjectRef.current.rotation.y += rotateStep;
          updates.rotation = selectedObjectRef.current.rotation.y;
          setFurnitureRotation((prev) => prev + (e.shiftKey ? 5 : 10));
          break;
        case 'R':
          selectedObjectRef.current.rotation.y -= rotateStep;
          updates.rotation = selectedObjectRef.current.rotation.y;
          setFurnitureRotation((prev) => prev - (e.shiftKey ? 5 : 10));
          break;
        case '+':
        case '=':
          const newScaleUp = Math.min((selectedObjectRef.current.scale.x || 1) + scaleStep, 5.0);
          selectedObjectRef.current.scale.set(newScaleUp, newScaleUp, newScaleUp);
          updates.scale = newScaleUp;
          setFurnitureScale(newScaleUp);
          break;
        case '-':
        case '_':
          const newScaleDown = Math.max((selectedObjectRef.current.scale.x || 1) - scaleStep, 0.1);
          selectedObjectRef.current.scale.set(newScaleDown, newScaleDown, newScaleDown);
          updates.scale = newScaleDown;
          setFurnitureScale(newScaleDown);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault(); // Prevent browser back navigation
          handleClearSelectedFurniture();
          break;
        case 'Escape':
          // Deselect furniture
          selectedObjectRef.current = null;
          setFurniture((prev) =>
            prev.map((item) => ({ ...item, selected: false }))
          );
          break;
      }

      // Only update furniture state if there are changes
      if (Object.keys(updates).length > 0) {
        // Update furniture state in a single batch
        setFurniture((prev) =>
          prev.map((item) =>
            item.id === selectedObjectRef.current.userData.id
              ? { ...item, ...updates }
              : item
          )
        );

        // Update localStorage in a debounced manner
        if (typeof window !== 'undefined') {
          const savedData = JSON.parse(localStorage.getItem('design-3d-data') || '{}');
          if (savedData.furniture) {
            savedData.furniture = savedData.furniture.map(item =>
              item.id === selectedObjectRef.current.userData.id
                ? { ...item, ...updates }
                : item
            );
            localStorage.setItem('design-3d-data', JSON.stringify(savedData));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add function to clear only selected furniture
  const handleClearSelectedFurniture = () => {
    if (!selectedObjectRef.current) return;

    const selectedId = selectedObjectRef.current.userData.id;
    
    // Remove the selected furniture from the scene
    const scene = sceneRef.current;
    if (scene) {
      const furnitureObject = scene.children.find(
        child => child.userData.type === 'furniture' && child.userData.id === selectedId
      );
      if (furnitureObject) {
        scene.remove(furnitureObject);
        furnitureObject.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => material.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
      }
    }
    
    // Update furniture state
    setFurniture(prev => prev.filter(item => item.id !== selectedId));
    selectedObjectRef.current = null;

    // Update localStorage
    if (typeof window !== 'undefined') {
      const savedData = JSON.parse(localStorage.getItem('design-3d-data') || '{}');
      savedData.furniture = savedData.furniture.filter(item => item.id !== selectedId);
      localStorage.setItem('design-3d-data', JSON.stringify(savedData));
    }
  };

  // Add function to clear all furniture
  const handleClearAllFurniture = () => {
    // Remove all furniture from the scene
    const scene = sceneRef.current;
    if (scene) {
      const furnitureObjects = scene.children.filter(
        child => child.userData.type === 'furniture'
      );
      
      furnitureObjects.forEach(obj => {
        scene.remove(obj);
        obj.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      });
    }
    
    // Clear furniture state
    setFurniture([]);
    selectedObjectRef.current = null;

    // Update localStorage
    if (typeof window !== 'undefined') {
      const savedData = JSON.parse(localStorage.getItem('design-3d-data') || '{}');
      savedData.furniture = [];
      localStorage.setItem('design-3d-data', JSON.stringify(savedData));
    }
  };

  // Add helper function to update furniture state
  const updateFurnitureState = (updates) => {
    if (!selectedObjectRef.current) return;
    
    setFurniture((prev) =>
      prev.map((item) =>
        item.id === selectedObjectRef.current.userData.id
          ? { ...item, ...updates }
          : item
      )
    );
  };

  // Update TransformControls initialization
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current) return;

    if (!transformControlsRef.current) {
      transformControlsRef.current = new TransformControls(cameraRef.current, canvasRef.current);
      transformControlsRef.current.addEventListener('dragging-changed', (event) => {
        controlsRef.current.enabled = !event.value;
      });

      transformControlsRef.current.addEventListener('objectChange', () => {
        if (selectedObjectRef.current) {
          const obj = selectedObjectRef.current;
          setFurniture((prev) =>
            prev.map((item) =>
              item.id === obj.userData.id
                ? {
                    ...item,
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z,
                    rotation: obj.rotation.y,
                    scale: obj.scale.x,
                  }
                : item
            )
          );
        }
      });

      sceneRef.current.add(transformControlsRef.current);
    }

    return () => {
      if (transformControlsRef.current) {
        transformControlsRef.current.dispose();
        if (sceneRef.current) {
          sceneRef.current.remove(transformControlsRef.current);
        }
        transformControlsRef.current = null;
      }
    };
  }, []);

  // Update transform controls when selecting furniture
  useEffect(() => {
    if (!transformControlsRef.current) return;

    if (selectedObjectRef.current) {
      transformControlsRef.current.attach(selectedObjectRef.current);
      transformControlsRef.current.setMode('translate'); // Start with translation mode
    } else {
      transformControlsRef.current.detach();
    }
  }, [selectedObjectRef.current]);

  // Update transform mode
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Update the furniture customization UI
  const renderFurnitureControls = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Add Furniture</h3>
          <div className="flex space-x-2">
            <Button
              onClick={handleClearAllFurniture}
              variant="destructive"
              className="text-sm"
            >
              Clear All
            </Button>
            <Button
              onClick={() => {
                setIsArrangementMode(!isArrangementMode);
                selectedObjectRef.current = null;
                setSelectedWallId(null);
                setFurniture((prev) =>
                  prev.map((item) => ({ ...item, selected: false }))
                );
              }}
              variant={isArrangementMode ? "default" : "outline"}
              className="text-sm"
            >
              {isArrangementMode ? "Exit Arrangement" : "Enter Arrangement"}
            </Button>
          </div>
        </div>
        {isArrangementMode && (
          <div className="bg-blue-50 p-2 rounded-md">
            <p className="text-sm text-blue-700">
              Arrangement Mode: Click furniture to select. Use keyboard controls to modify.
            </p>
            <div className="mt-2 text-sm text-blue-600">
              <p className="font-medium">Keyboard Controls:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Arrow Keys: Move furniture</li>
                <li>R/r: Rotate clockwise/counter-clockwise</li>
                <li>+/-: Scale up/down</li>
                <li>Hold Shift: Fine control</li>
                <li>Delete: Remove selected furniture</li>
                <li>ESC: Deselect furniture</li>
              </ul>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          {furnitureModels.map((model) => (
            <button
              key={model.name}
              onClick={() => handleAddFurniture(model)}
              className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <img 
                src={model.thumbnail} 
                alt={model.name} 
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="absolute bottom-2 left-2 text-white text-sm font-medium">
                  {model.name}
                </span>
              </div>
            </button>
          ))}
        </div>
        {selectedObjectRef.current && renderSelectedFurnitureControls()}
      </div>
    );
  };

  // Move the furniture customization controls to a separate function
  const renderSelectedFurnitureControls = () => {
    const selectedFurniture = furniture.find(item => item.selected);
    if (!selectedFurniture) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Customize Furniture</h3>
        <div className="space-y-2">
          <div>
            <label htmlFor="furnitureColor" className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <Input
              type="color"
              id="furnitureColor"
              value={selectedFurniture.color || '#8b4513'}
              onChange={(e) => handleFurnitureColorChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Transform Controls
            </label>
            <div className="flex space-x-2">
              <Button
                onClick={() => setTransformMode('translate')}
                variant={transformMode === 'translate' ? 'default' : 'outline'}
                className="flex-1"
              >
                Move
              </Button>
              <Button
                onClick={() => setTransformMode('rotate')}
                variant={transformMode === 'rotate' ? 'default' : 'outline'}
                className="flex-1"
              >
                Rotate
              </Button>
              <Button
                onClick={() => setTransformMode('scale')}
                variant={transformMode === 'scale' ? 'default' : 'outline'}
                className="flex-1"
              >
                Scale
              </Button>
            </div>
          </div>
          <div className="pt-2 space-y-2">
            <Button
              onClick={handleClearSelectedFurniture}
              className="w-full"
              variant="destructive"
            >
              Delete Furniture
            </Button>
            <Button
              onClick={() => {
                selectedObjectRef.current = null;
                setFurniture((prev) =>
                  prev.map((item) => ({ ...item, selected: false }))
                );
              }}
              className="w-full"
              variant="outline"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Modify the wall rendering in useEffect
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove existing walls
    scene.children.forEach((child) => {
      if (child.userData.type === 'wall') {
        scene.remove(child);
        child.geometry?.dispose();
        child.material?.dispose();
      }
    });

    // Calculate room center for offset
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

    // Render walls
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
        side: THREE.DoubleSide,
      });

      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.rotation.x = Math.PI / 2;
      wallMesh.position.set(canvasWidth / 2, 150, scaledLength / 2);
      wallMesh.rotation.z = Math.PI;
      wallMesh.userData = { type: 'wall', id: wall.id };
      scene.add(wallMesh);

      if (selectedWallId === wall.id) {
        const scaleFactor = 1 + 0.02 * Math.sin(animationTime);
        wallMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      } else {
        wallMesh.scale.set(1, 1, 1);
      }
    });
  }, [walls, wallVisibility, roomWidth, roomLength, selectedWallId, animationTime]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dbjicmnmj/image/upload/v1746723751/logo_cut_nayfsi.png" 
              alt="Furnispace Logo" 
              className="h-15 w-auto"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => router.push('/myDesigns')} variant="outline">
              My Designs
            </Button>
            <Button onClick={handleSaveDesign} className="bg-blue-900 hover:bg-blue-800">
              Save Design
            </Button>
            <Button onClick={() => router.push('/2dDesign')} variant="outline">
              Switch to 2D
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Design Controls</h2>
            <Tabs defaultValue="walls" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="walls">Walls</TabsTrigger>
                <TabsTrigger value="floor">Floor</TabsTrigger>
                <TabsTrigger value="furniture">Furniture</TabsTrigger>
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
                    <p className="text-sm text-gray-600">Click a wall to select it, then change its color.</p>
                    {selectedWallId && (
                      <>
                        <label htmlFor="wallColor" className="block text-sm font-medium text-gray-700">
                          Selected Wall Color
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            type="color"
                            id="wallColor"
                            value={walls.find((w) => w.id === selectedWallId)?.color || '#808080'}
                            onChange={(e) => handleWallColorChange(e.target.value)}
                            className="flex-grow"
                          />
                          <Button
                            onClick={() => setSelectedWallId(null)}
                            variant="outline"
                          >
                            Done
                          </Button>
                        </div>
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
              <TabsContent value="furniture">
                {renderFurnitureControls()}
              </TabsContent>
            </Tabs>
            <Button onClick={handleSaveDesign} className="w-full mt-4">
              Save Design
            </Button>
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