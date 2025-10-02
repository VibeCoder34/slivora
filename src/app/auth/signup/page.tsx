'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/useAuth'
import { Loader2, Eye, EyeOff, ArrowLeft, Sparkles, CheckCircle, LogIn } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // const [localLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signUp, loading: authLoading, initializing, supabaseError } = useAuth()
  const router = useRouter()

  // Show error if Supabase is not configured
  if (supabaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-red-600">!</span>
            </div>
            <CardTitle className="text-red-600">Configuration Error</CardTitle>
            <CardDescription>
              Authentication service is not properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {supabaseError}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading spinner while initializing
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-primary">AI</span>
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4 mx-auto"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="h-10 bg-muted animate-pulse rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      console.log('Attempting sign up...')
      const { error } = await signUp(email, password, name)
      if (error) {
        console.log('Sign up error:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } else {
        console.log('Sign up successful, redirecting to dashboard...')
        // Small delay to ensure state is updated
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      }
    } catch {
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-[var(--border)] shadow-[var(--shadow-lg)] bg-[var(--card)]">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-start mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="mx-auto h-24 w-24 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6">
            <Image 
              src="/slivoralogonoback.png" 
              alt="Slivora Logo" 
              width={80} 
              height={80}
              className="h-20 w-20"
            />
          </div>
          
          <CardTitle className="text-2xl font-bold text-[var(--foreground)]">
            Create your account
          </CardTitle>
          <CardDescription className="text-[var(--muted-foreground)]">
            Get started with AI-powered presentations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-[var(--foreground)]">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 border-[var(--border)] focus:border-[var(--ring)] focus:ring-[var(--ring)]/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 border-[var(--border)] focus:border-[var(--ring)] focus:ring-[var(--ring)]/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 border-[var(--border)] focus:border-[var(--ring)] focus:ring-[var(--ring)]/20 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            {message && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                {message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-10 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2" 
              disabled={authLoading || initializing}
            >
              {(authLoading || initializing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--card)] px-4 text-[var(--muted-foreground)] font-medium">
                  What you get
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <CheckCircle className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                <span>.pptx export ready</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <CheckCircle className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                <span>AI-powered slide generation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <CheckCircle className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                <span>Multiple presentation themes</span>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="text-sm text-[var(--muted-foreground)]">
                Already have an account?
              </div>
              <Link href="/auth/signin" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] hover:bg-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
                >
                  Sign In
                  <LogIn className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
