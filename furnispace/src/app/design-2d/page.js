'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Design2DPage() {
  const [roomWidth, setRoomWidth] = useState(5); // Meters
  const [roomLength, setRoomLength] = useState(7); // Meters
  const [colorScheme, setColorScheme] = useState('Neutral');
  const [furniture, setFurniture] = useState([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null);
  const [walls, setWalls] = useState([]);
  const [mode, setMode] = useState('furniture'); // 'furniture', 'add-walls', 'move-walls', 'delete-walls'
  const [tempWallStart, setTempWallStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedWallId, setSelectedWallId] = useState(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  const scale = 30; // 1m = 30px
  const stepSize = 0.5; // Meters (15px at scale=30)
  const wallThickness = 10; // Pixels
  const metersToFeet = 3.28084; // 1m = 3.28084ft

  const selectedFurniture = furniture.find((item) => item.id === selectedFurnitureId);

  // Convert dimensions to feet for display
  const roomWidthFeet = (roomWidth * metersToFeet).toFixed(1);
  const roomLengthFeet = (roomLength * metersToFeet).toFixed(1);

  // Initialize default room (5m x 7m in pixels)
  useEffect(() => {
    const widthPx = roomWidth * scale;
    const heightPx = roomLength * scale;
    const defaultWalls = [
      { id: 1, start: { x: 0, y: 0 }, end: { x: widthPx, y: 0 }, length: widthPx },
      { id: 2, start: { x: widthPx, y: 0 }, end: { x: widthPx, y: heightPx }, length: heightPx },
      { id: 3, start: { x: widthPx, y: heightPx }, end: { x: 0, y: heightPx }, length: widthPx },
      { id: 4, start: { x: 0, y: heightPx }, end: { x: 0, y: 0 }, length: heightPx },
    ];
    setWalls(defaultWalls);
  }, [roomWidth, roomLength]);

  // Draw canvas: room background, walls, labels, and temporary wall
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw room background
    ctx.fillStyle = colorScheme === 'Neutral' ? '#d1d5db' : colorScheme === 'Warm' ? '#f97316' : '#3b82f6';
    ctx.beginPath();
    walls.forEach((wall, index) => {
      if (index === 0) ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
    });
    ctx.closePath();
    ctx.fill();

    // Draw walls
    walls.forEach((wall) => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.lineWidth = wallThickness;
      ctx.strokeStyle = wall.id === selectedWallId ? 'red' : 'black';
      ctx.stroke();

      // Draw wall length label
      const midX = (wall.start.x + wall.end.x) / 2;
      const midY = (wall.start.y + wall.end.y) / 2;
      const lengthFeet = (wall.length / scale * metersToFeet).toFixed(1);
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText(`${lengthFeet}'`, midX, midY - 10);
    });

    // Draw temporary wall shadow
    if (mode === 'add-walls' && tempWallStart) {
      ctx.beginPath();
      ctx.moveTo(tempWallStart.x, tempWallStart.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.lineWidth = wallThickness;
      ctx.strokeStyle = 'gray';
      ctx.setLineDash([5, 5]); // Dashed line for shadow
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
      const tempLength = Math.sqrt(
        Math.pow(mousePos.x - tempWallStart.x, 2) + Math.pow(mousePos.y - tempWallStart.y, 2)
      );
      const tempLengthFeet = (tempLength / scale * metersToFeet).toFixed(1);
      const tempMidX = (tempWallStart.x + mousePos.x) / 2;
      const tempMidY = (tempWallStart.y + mousePos.y) / 2;
      ctx.fillText(`${tempLengthFeet}'`, tempMidX, tempMidY - 10);
    }
  }, [walls, colorScheme, selectedWallId, tempWallStart, mousePos]);

  // Update mouse position
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Handle arrow movement for furniture
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

    newX = Math.max(0, Math.min(newX, roomWidth * scale - selectedFurniture.width * scale));
    newY = Math.max(0, Math.min(newY, roomLength * scale - selectedFurniture.length * scale));

    setFurniture((prev) =>
      prev.map((item) =>
        item.id === selectedFurnitureId ? { ...item, x: newX, y: newY } : item
      )
    );
  };

  // Handle adding walls
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'add-walls') {
      if (!tempWallStart) {
        setTempWallStart({ x, y });
      } else {
        const newWall = {
          id: Date.now() + Math.random(),
          start: { x: tempWallStart.x, y: tempWallStart.y },
          end: { x, y },
          length: Math.sqrt(
            Math.pow(x - tempWallStart.x, 2) + Math.pow(y - tempWallStart.y, 2)
          ),
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
    const deltaX = e.clientX - rect.left - (draggingWall.start.x + draggingWall.end.x) / 2;
    const deltaY = e.clientY - rect.top - (draggingWall.start.y + draggingWall.end.y) / 2;

    const newStartX = Math.max(0, Math.min(draggingWall.start.x + deltaX, 800));
    const newStartY = Math.max(0, Math.min(draggingWall.start.y + deltaY, 400));
    const newEndX = Math.max(0, Math.min(draggingWall.end.x + deltaX, 800));
    const newEndY = Math.max(0, Math.min(draggingWall.end.y + deltaY, 400));

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
    const newFurniture = {
      type,
      x: 50,
      y: 50,
      width: type === 'Chair' ? 1 : 2,
      length: type === 'Chair' ? 1 : 1.5,
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
    alert('Design saved: ' + JSON.stringify({ roomWidth, roomLength, colorScheme, furniture, walls }));
  };

  const handleDeleteFurniture = () => {
    if (selectedFurniture) {
      setFurniture(furniture.filter((item) => item.id !== selectedFurnitureId));
      setSelectedFurnitureId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Furniture Design Studio (2D)</h1>
          <Button onClick={() => router.push('/design')} variant="outline">
            Switch to 3D
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Design Controls</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="roomWidth" className="block text-sm font-medium text-gray-700">
                  Room Width (m)
                </label>
                <Input
                  type="number"
                  id="roomWidth"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                />
                <p className="text-sm text-gray-500">({roomWidthFeet} ft)</p>
              </div>
              <div>
                <label htmlFor="roomLength" className="block text-sm font-medium text-gray-700">
                  Room Length (m)
                </label>
                <Input
                  type="number"
                  id="roomLength"
                  value={roomLength}
                  onChange={(e) => setRoomLength(e.target.value)}
                  placeholder="e.g., 7"
                  min="1"
                />
                <p className="text-sm text-gray-500">({roomLengthFeet} ft)</p>
              </div>
              <div>
                <label htmlFor="colorScheme" className="block text-sm font-medium text-gray-700">
                  Color Scheme
                </label>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="Cool">Cool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Wall Controls</h3>
                <div className="flex space-x-2">
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
                  <Button
                    onClick={() => setMode('furniture')}
                    variant={mode === 'furniture' ? 'default' : 'outline'}
                  >
                    Furniture Mode
                  </Button>
                </div>
                {mode === 'delete-walls' && (
                  <Button
                    onClick={() => setMode('furniture')}
                    className="w-full mt-2"
                    variant="secondary"
                  >
                    Exit Delete Mode
                  </Button>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Add Furniture</h3>
                <div className="flex space-x-2">
                  <Button onClick={() => handleAddFurniture('Chair')}>Add Chair</Button>
                  <Button onClick={() => handleAddFurniture('Table')}>Add Table</Button>
                </div>
              </div>
              {selectedFurniture && mode === 'furniture' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Customize Furniture</h3>
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="furnitureColor" className="block text-sm font-medium text-gray-700">
                        Color
                      </label>
                      <Select
                        onValueChange={handleColorChange}
                        defaultValue={selectedFurniture.color}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="#8b4513">Brown</SelectItem>
                          <SelectItem value="#000000">Black</SelectItem>
                          <SelectItem value="#ffffff">White</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="furnitureWidth" className="block text-sm font-medium text-gray-700">
                        Width (m)
                      </label>
                      <Input
                        type="number"
                        id="furnitureWidth"
                        defaultValue={selectedFurniture.width}
                        onChange={(e) => handleScaleChange(e.target.value, selectedFurniture.length)}
                        min="0.5"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label htmlFor="furnitureLength" className="block text-sm font-medium text-gray-700">
                        Length (m)
                      </label>
                      <Input
                        type="number"
                        id="furnitureLength"
                        defaultValue={selectedFurniture.length}
                        onChange={(e) => handleScaleChange(selectedFurniture.width, e.target.value)}
                        min="0.5"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Button onClick={handleSave} className="w-full">
                  Save Design
                </Button>
                {mode === 'furniture' && (
                  <Button
                    onClick={handleDeleteFurniture}
                    className="w-full"
                    variant="destructive"
                    disabled={!selectedFurniture}
                  >
                    Delete Selected Furniture
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">2D Design Canvas</h2>
            <div
              className="relative border rounded-md"
              style={{ width: '800px', height: '400px', overflow: 'hidden' }}
              onClick={(e) => {
                if (mode === 'furniture') setSelectedFurnitureId(null);
                if (mode === 'delete-walls' || mode === 'move-walls') setSelectedWallId(null);
                handleCanvasClick(e);
              }}
              onMouseMove={(e) => {
                handleMouseMove(e);
                handleMouseMoveWall(e);
              }}
              onMouseUp={handleMouseUpWall}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="absolute top-0 left-0"
              />
              {furniture.map((item) => (
                <div
                  key={item.id}
                  style={{
                    width: item.width * scale,
                    height: item.length * scale,
                    backgroundColor: item.color,
                    border: item.id === selectedFurnitureId ? '2px solid red' : '1px solid black',
                    position: 'absolute',
                    cursor: mode === 'furniture' ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontSize: '12px',
                    left: item.x,
                    top: item.y,
                  }}
                  onClick={(e) => {
                    if (mode !== 'furniture') return;
                    e.stopPropagation();
                    setSelectedFurnitureId(item.id);
                  }}
                >
                  {item.type}
                  {item.id === selectedFurnitureId && mode === 'furniture' && (
                    <div>
                      {/* Up Arrow */}
                      <button
                        className="absolute bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                        style={{ left: '50%', top: -30, transform: 'translateX(-50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveFurniture('up');
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      {/* Down Arrow */}
                      <button
                        className="absolute bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                        style={{ left: '50%', bottom: -30, transform: 'translateX(-50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveFurniture('down');
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {/* Left Arrow */}
                      <button
                        className="absolute bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                        style={{ top: '50%', left: -30, transform: 'translateY(-50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveFurniture('left');
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {/* Right Arrow */}
                      <button
                        className="absolute bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                        style={{ top: '50%', right: -30, transform: 'translateY(-50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveFurniture('right');
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {walls.map((wall) => (
                <div
                  key={wall.id}
                  style={{
                    position: 'absolute',
                    left: Math.min(wall.start.x, wall.end.x),
                    top: Math.min(wall.start.y, wall.end.y),
                    width: Math.abs(wall.end.x - wall.start.x) || wallThickness,
                    height: Math.abs(wall.end.y - wall.start.y) || wallThickness,
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