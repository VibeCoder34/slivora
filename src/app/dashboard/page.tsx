'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProjects } from '@/lib/hooks/useProjects'
import { 
  Plus, 
  FileText, 
  Calendar, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Loader2,
  LogOut,
  Download,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    outline_text: '',
    language: 'en',
    theme: 'default'
  })
  const [loading, setLoading] = useState(false)
  const [generatedComment, setGeneratedComment] = useState<string | null>(null)
  const [generatingComment, setGeneratingComment] = useState(false)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [migrationSQL, setMigrationSQL] = useState('')

  const { user, loading: authLoading, initializing, signOut } = useAuth()
  const { projects, loading: projectsLoading, error: projectsError, createProjectWithAI, deleteProject, regenerateProject, exportProject } = useProjects(user?.id)
  const router = useRouter()

  // Simple auth state logging
  useEffect(() => {
    console.log('Auth states changed:', { user: !!user, authLoading, initializing })
  }, [user, authLoading, initializing])

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !initializing && !user) {
      console.log('Redirecting to auth - no user found')
      router.push('/auth')
    }
  }, [user, authLoading, initializing, router])

  // Check if migration is needed (only after user is loaded)
  useEffect(() => {
    if (!user) return

    // Delay migration check to not block initial render
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/migrate')
        if (response.ok) {
          const data = await response.json()
          if (data.migrationNeeded) {
            setMigrationNeeded(true)
            setMigrationSQL(data.migrationSQL)
          }
        }
      } catch (err) {
        console.error('Failed to check migration status:', err)
      }
    }, 1000) // 1 second delay

    return () => clearTimeout(timeoutId)
  }, [user])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log('Creating project with data:', {
      title: newProject.title,
      outline: newProject.outline_text,
      language: newProject.language,
    })
    console.log('User authentication status:', { user: user?.id, email: user?.email })
    console.log('Form validation - all fields filled:', {
      title: !!newProject.title,
      outline: !!newProject.outline_text,
      language: !!newProject.language
    })
    
    // Check if user is authenticated
    if (!user) {
      alert('Please log in to create a project')
      setLoading(false)
      return
    }

    // Validate form data before sending
    if (!newProject.title || !newProject.outline_text) {
      alert('Please fill in both title and outline fields')
      setLoading(false)
      return
    }

    try {
      const { error } = await createProjectWithAI({
        title: newProject.title,
        outline_text: newProject.outline_text,
        language: newProject.language,
      })
      if (error) {
        console.error('Error creating project:', error)
        alert(`Error: ${error}`)
      } else {
        setNewProject({ title: '', outline_text: '', language: 'en', theme: 'default' })
        setShowCreateForm(false)
      }
    } catch (err) {
      console.error('Error creating project:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id)
      } catch (err) {
        console.error('Error deleting project:', err)
      }
    }
  }

  const handleRegenerateProject = async (id: string) => {
    if (confirm('Are you sure you want to regenerate this project? This will create new slides.')) {
      try {
        const { error } = await regenerateProject(id)
        if (error) {
          console.error('Error regenerating project:', error)
          alert(`Error: ${error}`)
        }
      } catch (err) {
        console.error('Error regenerating project:', err)
        alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  const handleExportProject = async (id: string) => {
    try {
      const { data, error } = await exportProject(id)
      if (error) {
        console.error('Error exporting project:', error)
        alert(`Error: ${error}`)
      } else if (data?.url) {
        // Open the download URL in a new tab
        window.open(data.url, '_blank')
      }
    } catch (err) {
      console.error('Error exporting project:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const handleGenerateComment = async () => {
    if (!newProject.title || !newProject.outline_text) {
      alert('Please fill in both title and outline before generating a comment')
      return
    }

    setGeneratingComment(true)
    setGeneratedComment(null)

    try {
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newProject.title,
          language: newProject.language,
          outline: newProject.outline_text,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate comment')
      }

      setGeneratedComment(data.comment)
    } catch (err) {
      console.error('Error generating comment:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setGeneratingComment(false)
    }
  }

  // Debug logging
  console.log('Dashboard render state:', { 
    user: !!user, 
    userEmail: user?.email,
    authLoading, 
    initializing
  })

  // Show loading only if we don't have a user yet
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>Debug: authLoading={authLoading.toString()}, initializing={initializing.toString()}</p>
            <p>User: {user ? 'exists' : 'null'}</p>
          </div>
        </div>
      </div>
    )
  }

  // User exists, render dashboard
  console.log('Rendering dashboard for user:', user.email)
  console.log('Projects state:', { 
    loading: projectsLoading, 
    error: projectsError, 
    count: projects?.length || 0 
  })

  console.log('About to render main dashboard content')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/slivoralogonoback.png" 
              alt="Slivora Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <span className="text-sm sm:text-base font-semibold tracking-tight">Slivora</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Migration Warning */}
        {migrationNeeded && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Database Migration Required
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                Your database needs to be updated to support the full AI presentation features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Please run the following SQL in your Supabase SQL Editor:
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {migrationSQL}
                  </pre>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  After running the migration, refresh this page to continue.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
            <p className="text-muted-foreground">
              Create and manage your AI-powered presentations
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Describe your presentation idea and let AI create the content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Q4 Sales Presentation"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      placeholder="en"
                      value={newProject.language}
                      onChange={(e) => setNewProject({ ...newProject, language: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="outline">Presentation Outline</Label>
                  <Textarea
                    id="outline"
                    placeholder="Describe your presentation topic, key points, target audience, and any specific requirements..."
                    value={newProject.outline_text}
                    onChange={(e) => setNewProject({ ...newProject, outline_text: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                {/* AI Comment Generation Section */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">AI Topic Comment</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get an AI-generated comment about your topic to help refine your presentation
                  </p>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateComment}
                    disabled={generatingComment || !newProject.title || !newProject.outline_text}
                    className="w-full"
                  >
                    {generatingComment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Comment...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Generate AI Comment
                      </>
                    )}
                  </Button>

                  {generatedComment && (
                    <div className="mt-3 p-3 bg-background rounded-md border">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">AI Comment:</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {generatedComment}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      setGeneratedComment(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Projects Error */}
        {projectsError && (
          <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>Error loading projects: {projectsError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Loading */}
        {projectsLoading && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Loading projects...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {!projectsError && !projectsLoading && projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first AI-powered presentation to get started
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : !projectsError && !projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <StatusBadge status={project.status} />
                      </div>
                      <CardDescription className="line-clamp-2">
                        {project.outline_text}
                      </CardDescription>
                      {project.status === 'error' && project.generate_error && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {project.generate_error}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/project/${project.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {project.status === 'ready' && (
                          <>
                            <DropdownMenuItem onClick={() => handleRegenerateProject(project.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportProject(project.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Export PPTX
                            </DropdownMenuItem>
                          </>
                        )}
                        {project.status === 'error' && (
                          <DropdownMenuItem onClick={() => handleRegenerateProject(project.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Generation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {project.slides_count || project.slide_count} slides
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {project.status === 'generating' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating slides...
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => router.push(`/project/${project.id}`)}
                      disabled={project.status === 'generating'}
                    >
                      {project.status === 'generating' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Open Project'
                      )}
                    </Button>
                    
                    {project.status === 'ready' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportProject(project.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
