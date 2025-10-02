'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export default function DebugAuthPage() {
  const { user, loading, signIn, signUp, clearAuthData } = useAuth()
  const [session, setSession] = useState<{user?: {id?: string, email?: string}} | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [testName, setTestName] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    }

    // Check session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      addLog(`Session check: ${session ? 'Found' : 'None'}, Error: ${error?.message || 'None'}`)
      setSession(session)
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth event: ${event}, Session: ${session ? 'Found' : 'None'}`)
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleTestSignUp = async () => {
    const email = testEmail || `test-${Date.now()}@example.com`
    const password = testPassword || 'testpassword123'
    const name = testName || 'Test User'

    setLogs(prev => [...prev, `Testing sign up with ${email}`])
    const { data, error } = await signUp(email, password, name)
    
    if (error) {
      setLogs(prev => [...prev, `Sign up error: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } else {
      setLogs(prev => [...prev, `Sign up success: ${data?.user?.id}`])
    }
  }

  const handleTestSignIn = async () => {
    const email = testEmail || `test-${Date.now()}@example.com`
    const password = testPassword || 'testpassword123'

    setLogs(prev => [...prev, `Testing sign in with ${email}`])
    const { data, error } = await signIn(email, password)
    
    if (error) {
      setLogs(prev => [...prev, `Sign in error: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } else {
      setLogs(prev => [...prev, `Sign in success: ${data?.user?.id}`])
    }
  }

  const handleSignOut = async () => {
    setLogs(prev => [...prev, 'Signing out...'])
    await supabase.auth.signOut()
  }

  const handleClearAuthData = async () => {
    setLogs(prev => [...prev, 'Clearing all auth data...'])
    await clearAuthData()
    setLogs(prev => [...prev, 'Auth data cleared'])
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        
        {/* Current State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Auth Hook State</h3>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>User: {user ? `${user.email} (${user.id})` : 'None'}</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Session State</h3>
            <p>Session: {session ? 'Found' : 'None'}</p>
            <p>User ID: {session?.user?.id || 'None'}</p>
            <p>Email: {session?.user?.email || 'None'}</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-semibold">Test Authentication</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="Email (optional)"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password (optional)"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleTestSignUp}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Sign Up
            </button>
            <button
              onClick={handleTestSignIn}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Sign In
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            <button
              onClick={handleClearAuthData}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Clear Auth Data
            </button>
            <button
              onClick={() => {
                setLogs(prev => [...prev, 'Checking auth state...'])
                console.log('Auth state:', { user, loading, session })
                setLogs(prev => [...prev, 'Auth state logged to console'])
              }}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Debug State
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Debug Logs</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>

        {/* Environment Check */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <div className="space-y-1 text-sm">
            <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
            <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

