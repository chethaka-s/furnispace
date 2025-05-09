'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post('/api/auth/signup', {
        name,
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        toast.success('Account created successfully!');
        router.push('/2dDesign');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Background Image */}
        <div className="hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
            alt="Furniture showroom"
            className="w-full max-w-[500px] h-[600px] object-cover rounded-xl shadow-2xl"
          />
        </div>

        {/* Signup Section */}
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          {/* Logo */}
          <img
            src="https://res.cloudinary.com/dbjicmnmj/image/upload/v1746598034/logo2_wl2var.png"
            alt="Furnispace Logo"
            className="w-64 mb-6"
          />

          {/* Signup Form Container */}
          <div className="w-full text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
              Create Account
            </h2>

            <form onSubmit={handleSignup} className="space-y-6">
              <Input
                type="text"
                placeholder="Full Name"
                className="h-12 w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                type="email"
                placeholder="Email Address"
                className="h-12 w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                type="password"
                placeholder="Password"
                className="h-12 w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                type="password"
                placeholder="Confirm Password"
                className="h-12 w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="mt-4 text-center">
                <Link 
                  href="/login" 
                  className="text-blue-900 hover:text-blue-700 text-sm font-medium"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 