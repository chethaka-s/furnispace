'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Design2DPage() {
  const [roomWidth, setRoomWidth] = useState(10); // Feet
  const [roomLength, setRoomLength] = useState(12); // Feet
  const [floorColor, setFloorColor] = useState('#d1d5db'); // Default: Neutral
  const [furniture, setFurniture] = useState([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null);
  const [walls, setWalls] = useState([]);
  const [mode, setMode] = useState('add-walls'); // 'add-walls', 'move-walls', 'delete-walls'
  const [tempWallStart, setTempWallStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1); // Zoom level for canvas
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // Pan offset for dragging
  const [isPanning, setIsPanning] = useState(false); // Track if panning is active
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 }); // Track last mouse position for panning
  const canvasRef = useRef(null);
  const router = useRouter();
  const scale = 15; // 1ft = 15px
  const stepSize = 0.4; // Feet
  const wallThickness = 4; // Pixels
  const canvasWidth = 800;
  const canvasHeight = 400;

  const selectedFurniture = furniture.find((item) => item.id === selectedFurnitureId);

  // Initialize default room, centered on the canvas
  useEffect(() => {
    const widthPx = roomWidth * scale;
    const heightPx = roomLength * scale;
    const xOffset = (canvasWidth - widthPx) / 2;
    const yOffset = (canvasHeight - heightPx) / 2;
    const defaultWalls = [
      { id: 1, start: { x: xOffset, y: yOffset }, end: { x: xOffset + widthPx, y: yOffset }, length: widthPx, color: '#808080' },
      { id: 2, start: { x: xOffset + widthPx, y: yOffset }, end: { x: xOffset + widthPx, y: yOffset + heightPx }, length: heightPx, color: '#808080' },
      { id: 3, start: { x: xOffset + widthPx, y: yOffset + heightPx }, end: { x: xOffset, y: yOffset + heightPx }, length: widthPx, color: '#808080' },
      { id: 4, start: { x: xOffset, y: yOffset + heightPx }, end: { x: xOffset, y: yOffset }, length: heightPx, color: '#808080' },
    ];
    setWalls(defaultWalls);
  }, [roomWidth, roomLength]);

  // Modify the save to localStorage to include wall configuration
  useEffect(() => {
    const designData = {
      roomWidth,
      roomLength,
      floorColor,
      walls,
    };
    localStorage.setItem('design-2d-data', JSON.stringify(designData));
    // Also save walls separately for 3D view
    localStorage.setItem('wall-config', JSON.stringify(walls));
  }, [roomWidth, roomLength, floorColor, walls]);

  // Calculate bounding box of walls for furniture constraints
  const getWallBounds = () => {
    if (walls.length === 0) return { minX: 0, maxX: canvasWidth, minY: 0, maxY: canvasHeight };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    walls.forEach((wall) => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });
    return { minX, maxX, minY, maxY };
  };

  // Draw canvas: room background, walls, labels, and temporary wall
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(panOffset.x, panOffset.y);

    // Draw room background by tracing wall endpoints
    if (walls.length > 0) {
      ctx.fillStyle = floorColor;
      ctx.beginPath();
      let currentPoint = walls[0].start;
      ctx.moveTo(currentPoint.x, currentPoint.y);
      walls.forEach((wall) => {
        ctx.lineTo(wall.end.x, wall.end.y);
      });
      ctx.lineTo(walls[0].start.x, walls[0].start.y);
      ctx.closePath();
      ctx.fill();
    }

    // Draw walls
    walls.forEach((wall) => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.lineWidth = wallThickness / zoomLevel;
      ctx.fillStyle = wall.color || '#808080';
      ctx.strokeStyle = wall.id === selectedWallId ? 'red' : '#4B4B4B';
      ctx.stroke();
      ctx.fill();

      // Draw wall length label
      const midX = (wall.start.x + wall.end.x) / 2;
      const midY = (wall.start.y + wall.end.y) / 2;
      const lengthFeet = (wall.length / scale).toFixed(1);
      ctx.font = `${12 / zoomLevel}px Arial`;
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText(`${lengthFeet}'`, midX, midY - 10 / zoomLevel);
    });

    // Draw temporary wall shadow with snapping
    if (mode === 'add-walls' && tempWallStart) {
      let endX = (mousePos.x / zoomLevel) - panOffset.x;
      let endY = (mousePos.y / zoomLevel) - panOffset.y;

      const dx = endX - tempWallStart.x;
      const dy = endY - tempWallStart.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const length = Math.sqrt(dx * dx + dy * dy);
      let snappedAngle = angle;

      if (Math.abs(angle) < 15 || Math.abs(angle) > 165) {
        snappedAngle = dx >= 0 ? 0 : 180;
      } else if (Math.abs(angle - 90) < 15) {
        snappedAngle = 90;
      } else if (Math.abs(angle + 90) < 15) {
        snappedAngle = -90;
      }

      if (snappedAngle !== angle) {
        const snappedAngleRad = snappedAngle * (Math.PI / 180);
        endX = tempWallStart.x + length * Math.cos(snappedAngleRad);
        endY = tempWallStart.y + length * Math.sin(snappedAngleRad);
      }

      ctx.beginPath();
      ctx.moveTo(tempWallStart.x, tempWallStart.y);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = wallThickness / zoomLevel;
      ctx.strokeStyle = '#87CEEB';
      ctx.stroke();
      const tempLength = Math.sqrt(
        Math.pow(endX - tempWallStart.x, 2) + Math.pow(endY - tempWallStart.y, 2)
      );
      const tempLengthFeet = (tempLength / scale).toFixed(1);
      const tempMidX = (tempWallStart.x + endX) / 2;
      const tempMidY = (tempWallStart.y + endY) / 2;
      ctx.fillText(`${tempLengthFeet}'`, tempMidX, tempMidY - 10 / zoomLevel);
    }

    // Draw furniture
    furniture.forEach((item) => {
      ctx.save();
      ctx.translate((item.x + panOffset.x) * zoomLevel, (item.y + panOffset.y) * zoomLevel);
      ctx.fillStyle = item.color || '#8b4513';
      ctx.fillRect(0, 0, item.width * scale * zoomLevel, item.length * scale * zoomLevel);
      ctx.strokeStyle = item.id === selectedFurnitureId ? 'red' : 'black';
      ctx.lineWidth = 1 / zoomLevel;
      ctx.strokeRect(0, 0, item.width * scale * zoomLevel, item.length * scale * zoomLevel);
      ctx.fillStyle = '#000';
      ctx.font = `${12 / zoomLevel}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(item.type, (item.width * scale * zoomLevel) / 2, (item.length * scale * zoomLevel) / 2);
      ctx.restore();
    });

    ctx.restore();
  }, [walls, floorColor, selectedWallId, tempWallStart, mousePos, zoomLevel, panOffset, furniture]);

  // Update mouse position
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (isPanning) {
      const dx = (x - lastMousePos.x) / zoomLevel;
      const dy = (y - lastMousePos.y) / zoomLevel;
      setPanOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setLastMousePos({ x, y });
    }
  };

  // Handle arrow movement for furniture with wall boundary constraints
  const handleMoveFurniture = (direction) => {
    if (mode !== 'furniture' || !selectedFurniture) return;

    let newX = selectedFurniture.x;
    let newY = selectedFurniture.y;

    switch (direction) {
      case 'up':
        newY -= stepSize * scale;
        break;
      case 'down':
        newY += stepSize * scale;
        break;
      case 'left':
        newX -= stepSize * scale;
        break;
      case 'right':
        newX += stepSize * scale;
        break;
      default:
        return;
    }

    const bounds = getWallBounds();
    const furnitureWidthPx = selectedFurniture.width * scale;
    const furnitureHeightPx = selectedFurniture.length * scale;

    newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - furnitureWidthPx));
    newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - furnitureHeightPx));

    setFurniture((prev) =>
      prev.map((item) =>
        item.id === selectedFurnitureId ? { ...item, x: newX, y: newY } : item
      )
    );
  };

  // Handle mouse down for panning
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'furniture' && !selectedFurnitureId && !walls.some(wall => 
      x >= Math.min(wall.start.x, wall.end.x) * zoomLevel + panOffset.x * zoomLevel &&
      x <= (Math.max(wall.start.x, wall.end.x) * zoomLevel + panOffset.x * zoomLevel) &&
      y >= Math.min(wall.start.y, wall.end.y) * zoomLevel + panOffset.y * zoomLevel &&
      y <= (Math.max(wall.start.y, wall.end.y) * zoomLevel + panOffset.y * zoomLevel)
    )) {
      setIsPanning(true);
      setLastMousePos({ x, y });
    }
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle adding walls
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoomLevel - panOffset.x;
    let y = (e.clientY - rect.top) / zoomLevel - panOffset.y;

    if (mode === 'add-walls') {
      if (!tempWallStart) {
        setTempWallStart({ x, y });
      } else {
        const dx = x - tempWallStart.x;
        const dy = y - tempWallStart.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const length = Math.sqrt(dx * dx + dy * dy);
        let snappedAngle = angle;

        if (Math.abs(angle) < 15 || Math.abs(angle) > 165) {
          snappedAngle = dx >= 0 ? 0 : 180;
        } else if (Math.abs(angle - 90) < 15) {
          snappedAngle = 90;
        } else if (Math.abs(angle + 90) < 15) {
          snappedAngle = -90;
        }

        if (snappedAngle !== angle) {
          const snappedAngleRad = snappedAngle * (Math.PI / 180);
          x = tempWallStart.x + length * Math.cos(snappedAngleRad);
          y = tempWallStart.y + length * Math.sin(snappedAngleRad);
        }

        const newWall = {
          id: Date.now() + Math.random(),
          start: { x: tempWallStart.x, y: tempWallStart.y },
          end: { x, y },
          length: Math.sqrt(
            Math.pow(x - tempWallStart.x, 2) + Math.pow(y - tempWallStart.y, 2)
          ),
          color: '#808080',
        };
        setWalls([...walls, newWall]);
        setTempWallStart(null);
      }
    }
  };

  // Handle moving walls
  const [draggingWall, setDraggingWall] = useState(null);
  const handleMouseDownWall = (wall, e) => {
    if (mode === 'move-walls') {
      e.stopPropagation();
      setSelectedWallId(wall.id);
      setDraggingWall(wall);
    } else if (mode === 'delete-walls') {
      e.stopPropagation();
      setWalls(walls.filter((w) => w.id !== wall.id));
      setSelectedWallId(null);
    }
  };

  const handleMouseMoveWall = (e) => {
    if (mode !== 'move-walls' || !draggingWall) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - rect.left) / zoomLevel - panOffset.x) - (draggingWall.start.x + draggingWall.end.x) / 2;
    const deltaY = ((e.clientY - rect.top) / zoomLevel - panOffset.y) - (draggingWall.start.y + draggingWall.end.y) / 2;

    const newStartX = Math.max(0, Math.min(draggingWall.start.x + deltaX, canvasWidth / zoomLevel));
    const newStartY = Math.max(0, Math.min(draggingWall.start.y + deltaY, canvasHeight / zoomLevel));
    const newEndX = Math.max(0, Math.min(draggingWall.end.x + deltaX, canvasWidth / zoomLevel));
    const newEndY = Math.max(0, Math.min(draggingWall.end.y + deltaY, canvasHeight / zoomLevel));

    setWalls((prev) =>
      prev.map((w) => {
        if (w.id === draggingWall.id) {
          return {
            ...w,
            start: { x: newStartX, y: newStartY },
            end: { x: newEndX, y: newEndY },
            length: Math.sqrt(
              Math.pow(newEndX - newStartX, 2) + Math.pow(newEndY - newStartY, 2)
            ),
          };
        }
        return w;
      })
    );
  };

  const handleMouseUpWall = () => {
    setDraggingWall(null);
  };

  const handleAddFurniture = (type) => {
    const dimensions = {
      Chair: { width: 3.3, length: 3.3 },
      Table: { width: 6.6, length: 4.9 },
      Sofa: { width: 6.6, length: 3.3 },
      Bed: { width: 6.6, length: 4.9 },
      Lamp: { width: 1.6, length: 1.6 },
    };
    const { width, length } = dimensions[type];
    const newFurniture = {
      type,
      x: canvasWidth / 2 / zoomLevel - panOffset.x - width * scale / 2,
      y: canvasHeight / 2 / zoomLevel - panOffset.y - length * scale / 2,
      width,
      length,
      color: '#8b4513',
      id: Date.now() + Math.random(),
    };
    setFurniture([...furniture, newFurniture]);
  };

  const handleColorChange = (color) => {
    if (selectedFurniture) {
      setFurniture((prev) =>
        prev.map((item) =>
          item.id === selectedFurnitureId ? { ...item, color } : item
        )
      );
    }
  };

  const handleScaleChange = (width, length) => {
    if (selectedFurniture) {
      setFurniture((prev) =>
        prev.map((item) =>
          item.id === selectedFurnitureId
            ? { ...item, width: parseFloat(width), length: parseFloat(length) }
            : item
        )
      );
    }
  };

  const handleSave = () => {
    alert('Design saved: ' + JSON.stringify({ roomWidth, roomLength, floorColor, furniture, walls }));
  };

  const handleSwitchTo3D = () => {
    // Save current 2D layout to 3D storage
    const design3DData = {
      roomWidth,
      roomLength,
      floorColor,
      walls,
      furniture: [], // Start with empty furniture in 3D
      wallVisibility: { 1: true, 2: true, 3: true, 4: true }
    };
    localStorage.setItem('design-3d-data', JSON.stringify(design3DData));
    router.push('/3dDesign');
  };

  const handleDeleteFurniture = () => {
    if (selectedFurniture) {
      setFurniture(furniture.filter((item) => item.id !== selectedFurnitureId));
      setSelectedFurnitureId(null);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleSaveDesign = () => {
    // Get canvas preview
    const canvas = canvasRef.current;
    const preview = canvas.toDataURL('image/jpeg', 0.5);

    // Create design object
    const design = {
      id: Date.now().toString(),
      name: `Room Design ${new Date().toLocaleDateString()}`,
      type: '2d',
      createdAt: new Date().toISOString(),
      preview: preview,
      data: {
        roomWidth,
        roomLength,
        floorColor,
        walls,
        furniture
      }
    };

    // Get existing designs
    const existingDesigns = JSON.parse(localStorage.getItem('furnispace_designs') || '[]');
    
    // Add new design
    const updatedDesigns = [...existingDesigns, design];
    
    // Save to localStorage
    localStorage.setItem('furnispace_designs', JSON.stringify(updatedDesigns));

    // Show success message
    alert('Design saved successfully!');
  };

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
            <Button onClick={handleSave} className="bg-blue-900 hover:bg-blue-800">
              Save Design
            </Button>
            <Button onClick={handleSwitchTo3D} variant="outline">
              Switch to 3D
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Design Controls</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="roomWidth" className="block text-sm font-medium text-gray-700">
                  Room Width (ft)
                </label>
                <Input
                  type="number"
                  id="roomWidth"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(parseFloat(e.target.value) || 10)}
                  placeholder="e.g., 16.4"
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="roomLength" className="block text-sm font-medium text-gray-700">
                  Room Length (ft)
                </label>
                <Input
                  type="number"
                  id="roomLength"
                  value={roomLength}
                  onChange={(e) => setRoomLength(parseFloat(e.target.value) || 12)}
                  placeholder="e.g., 23.0"
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="floorColor" className="block text-sm font-medium text-gray-700">
                  Floor Color
                </label>
                <Select value={floorColor} onValueChange={setFloorColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#d1d5db">Neutral</SelectItem>
                    <SelectItem value="#f97316">Warm</SelectItem>
                    <SelectItem value="#3b82f6">Cool</SelectItem>
                    <SelectItem value="#22c55e">Green</SelectItem>
                    <SelectItem value="#1e40af">Blue</SelectItem>
                    <SelectItem value="#f5f5dc">Beige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Wall Controls</h3>
                <div className="flex space-x-2 flex-col">
                  <Button
                    onClick={() => setMode('add-walls')}
                    variant={mode === 'add-walls' ? 'default' : 'outline'}
                  >
                    Add Walls
                  </Button>
                  <Button
                    onClick={() => setMode('move-walls')}
                    variant={mode === 'move-walls' ? 'default' : 'outline'}
                  >
                    Move Walls
                  </Button>
                  <Button
                    onClick={() => setMode('delete-walls')}
                    variant={mode === 'delete-walls' ? 'default' : 'outline'}
                  >
                    Delete Walls
                  </Button>
                </div>
                {mode === 'delete-walls' && (
                  <Button
                    onClick={() => setMode('add-walls')}
                    className="w-full mt-2"
                    variant="secondary"
                  >
                    Exit Delete Mode
                  </Button>
                )}
              </div>
              <div className="pt-4">
                <Button onClick={() => router.push('/design-3d')} className="w-full">
                  Continue to 3D View
                </Button>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Wall Layout Canvas</h2>
              <div className="flex space-x-2">
                <Button onClick={handleZoomIn} variant="outline">
                  Zoom In
                </Button>
                <Button onClick={handleZoomOut} variant="outline">
                  Zoom Out
                </Button>
              </div>
            </div>
            <div
              className="relative border rounded-md"
              style={{ width: '770px', height: '400px', overflow: 'hidden' }}
              onMouseDown={handleMouseDown}
              onMouseMove={(e) => {
                handleMouseMove(e);
                handleMouseMoveWall(e);
              }}
              onMouseUp={(e) => {
                handleMouseUp();
                handleMouseUpWall();
              }}
              onClick={handleCanvasClick}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="absolute top-0 left-0"
              />
              {walls.map((wall) => (
                <div
                  key={wall.id}
                  style={{
                    position: 'absolute',
                    left: (Math.min(wall.start.x, wall.end.x) + panOffset.x) * zoomLevel,
                    top: (Math.min(wall.start.y, wall.end.y) + panOffset.y) * zoomLevel,
                    width: (Math.abs(wall.end.x - wall.start.x) || wallThickness) * zoomLevel,
                    height: (Math.abs(wall.end.y - wall.start.y) || wallThickness) * zoomLevel,
                    cursor: mode === 'move-walls' || mode === 'delete-walls' ? 'pointer' : 'default',
                  }}
                  onMouseDown={(e) => handleMouseDownWall(wall, e)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}