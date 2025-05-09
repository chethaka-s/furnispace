'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MyDesigns() {
  const router = useRouter();
  const [designs, setDesigns] = useState([]);

  useEffect(() => {
    // Load saved designs from localStorage
    const savedDesigns = localStorage.getItem('furnispace_designs');
    if (savedDesigns) {
      setDesigns(JSON.parse(savedDesigns));
    }
  }, []);

  const handleViewDesign = (design) => {
    // Store the selected design data
    localStorage.setItem('current_design', JSON.stringify(design));
    
    // Also store the current state in design-3d-data if it's a 3D design
    if (design.type === '3d' && design.data) {
      localStorage.setItem('design-3d-data', JSON.stringify(design.data));
    }
    
    // Navigate to the appropriate view
    router.push(design.type === '2d' ? '/2dDesign' : '/3dDesign');
  };

  const handleDeleteDesign = (designId) => {
    const updatedDesigns = designs.filter(d => d.id !== designId);
    setDesigns(updatedDesigns);
    localStorage.setItem('furnispace_designs', JSON.stringify(updatedDesigns));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        className="bg-white shadow"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
          <Button
            onClick={() => router.push('/2dDesign')}
            className="bg-blue-900 hover:bg-blue-800"
          >
            Create New Design
          </Button>
        </div>
      </motion.div>

      {/* Designs Grid */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {designs.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl text-gray-600">No saved designs yet</h3>
            <p className="mt-2 text-gray-500">Start creating your first design!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design, index) => (
              <motion.div
                key={design.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{design.name}</h3>
                      <p className="text-sm text-gray-500">Created: {new Date(design.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {design.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="h-40 bg-gray-100 rounded-lg mb-4">
                    {/* Preview image or placeholder */}
                    {design.preview ? (
                      <img 
                        src={design.preview} 
                        alt={design.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Preview
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between gap-4">
                    <Button
                      onClick={() => handleViewDesign(design)}
                      className="flex-1 bg-blue-900 hover:bg-blue-800"
                    >
                      View Design
                    </Button>
                    <Button
                      onClick={() => handleDeleteDesign(design.id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 