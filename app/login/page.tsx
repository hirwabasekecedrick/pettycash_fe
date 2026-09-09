'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      toast.success("Welcome back!");
      // Redirect based on role or just to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 lg:p-0">
      <div className="w-full grid lg:grid-cols-2 min-h-screen lg:min-h-screen bg-white lg:bg-transparent lg:overflow-hidden">
        {/* Left panel - image / context (shown on desktop) */}
        <div className="hidden lg:flex flex-col items-center justify-center relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white p-12">
          <Image
            src="/vectors/login_vector.png"
            alt="Petty Cash illustration"
            width={480}
            height={480}
            className="object-contain max-w-md w-full"
            priority
          />
          <div className="mt-10 text-center max-w-md">
            <h2 className="text-3xl font-bold tracking-tight">Manage petty cash with ease</h2>
            <p className="mt-4 text-white/80 text-lg">
              Assign funds, track payments and reconcile your organization&apos;s petty cash in one place.
            </p>
          </div>
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/80" />
            <span className="h-2 w-2 rounded-full bg-white/30" />
            <span className="h-2 w-2 rounded-full bg-white/30" />
          </div>
        </div>

        {/* Right panel - login form */}
        <div className="flex flex-col justify-center items-center min-h-screen bg-white p-4 lg:p-8">
          <div className="w-full max-w-md">
            <div className="w-full flex justify-center items-center p-4 lg:hidden">
              <Image src="/vectors/login_vector.png" alt="Logo" width={200} height={200} />
            </div>
            <div className="p-2 text-primary text-left">
              <h1 className="text-3xl font-bold tracking-tight mb-1">Sign In</h1>
              <p className="text-primary/80">Enter your credentials to continue</p>
            </div>

            <div className="p-8 px-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50 focus:bg-white"
                      placeholder="address@gmail.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-gray-50 focus:bg-white"
                      placeholder="********"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="">
                    <p>Keep me signed in</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <Switch />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center py-5.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
                <div className="flex justify-center items-center p-2">
                  <a href="http://example.com" target="_blank" rel="noopener noreferrer">
                    <span>Enroll your organization <span className="font-bold text-primary">Now</span></span>
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}