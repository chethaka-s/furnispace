'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ChairModel from '../webcomponents/ChairModel';

export default function DesignPage() {
  const [roomWidth, setRoomWidth] = useState(5);
  const [roomLength, setRoomLength] = useState(7);
  const [colorScheme, setColorScheme] = useState('Neutral');
  const router = useRouter();

  const handleSave = () => {
    alert(`Room saved: ${roomWidth}m x ${roomLength}m, Color: ${colorScheme}`);
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
            <h2 className="text-lg font-semibold mb-4">Room Settings</h2>
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
              <Button onClick={handleSave} className="w-full">
                Save Room
              </Button>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">3D Design Canvas</h2>
            <div className="h-[500px] border rounded-md">
              <Canvas camera={{ position: [0, 2, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[roomWidth, roomLength]} />
                  <meshStandardMaterial color={colorScheme === 'Neutral' ? 'gray' : colorScheme === 'Warm' ? 'orange' : 'blue'} />
                </mesh>
                <ChairModel />
                <OrbitControls />
              </Canvas>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}