'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Design2DPage() {
  const [roomWidth, setRoomWidth] = useState(5);
  const [roomLength, setRoomLength] = useState(7);
  const [colorScheme, setColorScheme] = useState('Neutral');
  const [furniture, setFurniture] = useState([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  const scale = 30;
  const stepSize = 0.5; // Meters (15px at scale=30)

  // Get selected furniture based on id
  const selectedFurniture = furniture.find((item) => item.id === selectedFurnitureId);

  // Draw room canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorScheme === 'Neutral' ? '#d1d5db' : colorScheme === 'Warm' ? '#f97316' : '#3b82f6';
    ctx.fillRect(0, 0, roomWidth * scale, roomLength * scale);
  }, [roomWidth, roomLength, colorScheme]);

  // Handle arrow movement
  const handleMove = (direction) => {
    if (!selectedFurniture) return;

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

    // Clamp to canvas boundaries
    newX = Math.max(0, Math.min(newX, roomWidth * scale - selectedFurniture.width * scale));
    newY = Math.max(0, Math.min(newY, roomLength * scale - selectedFurniture.length * scale));

    // Update furniture state
    setFurniture((prev) =>
      prev.map((item) =>
        item.id === selectedFurnitureId ? { ...item, x: newX, y: newY } : item
      )
    );
  };

  const handleAddFurniture = (type) => {
    const newFurniture = {
      type,
      x: 50,
      y: 50,
      width: type === 'Chair' ? 1 : 2,
      length: type === 'Chair' ? 1 : 1.5,
      color: '#8b4513',
      id: Date.now() + Math.random(), // Unique id
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
    alert('Design saved: ' + JSON.stringify({ roomWidth, roomLength, colorScheme, furniture }));
  };

  const handleDelete = () => {
    if (selectedFurniture) {
      setFurniture(furniture.filter((item) => item.id !== selectedFurnitureId));
      setSelectedFurnitureId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">FurniSpace</h1>
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
                <h3 className="text-sm font-medium text-gray-700">Add Furniture</h3>
                <div className="flex space-x-2">
                  <Button onClick={() => handleAddFurniture('Chair')}>Add Chair</Button>
                  <Button onClick={() => handleAddFurniture('Table')}>Add Table</Button>
                </div>
              </div>
              {selectedFurniture && (
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
                <Button onClick={handleDelete} className="w-full" variant="destructive" disabled={!selectedFurniture}>
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">2D Design Canvas</h2>
            <div
              className="relative w-[500px] h-[300px] border rounded-md"
              style={{ position: 'relative', overflow: 'hidden' }}
              onClick={() => setSelectedFurnitureId(null)}
            >
              <canvas
                ref={canvasRef}
                width={500}
                height={300}
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
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontSize: '12px',
                    left: item.x,
                    top: item.y,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFurnitureId(item.id);
                  }}
                >
                  {item.type}
                  {item.id === selectedFurnitureId && (
                    <div>
                      {/* Up Arrow */}
                      <button
                        className="absolute bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                        style={{ left: '50%', top: -30, transform: 'translateX(-50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove('up');
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
                          handleMove('down');
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
                          handleMove('left');
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
                          handleMove('right');
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}