'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProjects } from '@/lib/hooks/useProjects'
import { useTokens } from '@/lib/hooks/useTokens'
import { TokenUsage } from '@/components/TokenUsage'
import { TokenUpgradeModal } from '@/components/TokenUpgradeModal'
import { TokenInsufficientModal } from '@/components/TokenInsufficientModal'
import { NewProjectModal } from '@/components/NewProjectModal'
import { ProjectCreationLoading } from '@/components/ProjectCreationLoading'
import { 
  Plus, 
  FileText, 
  Calendar, 
  MoreHorizontal, 
  Trash2, 
  Eye,
  Loader2,
  LogOut,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreationLoading, setShowCreationLoading] = useState(false)
  const [creatingProject, setCreatingProject] = useState<{
    id: string;
    title: string;
  } | null>(null)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [migrationSQL, setMigrationSQL] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showTokenInsufficientModal, setShowTokenInsufficientModal] = useState(false)
  const [insufficientModalData, setInsufficientModalData] = useState<{
    actionType: string;
    requiredTokens: number;
    availableTokens: number;
  } | null>(null)

  const { user, loading: authLoading, initializing, signOut } = useAuth()
  
  // Load token data first (higher priority)
  const { 
    tokenInfo, 
    usageHistory, 
    usageStats, 
    isLoading: tokensLoading, 
    error: tokensError,
    purchaseTokens,
    updateSubscription,
    checkTokensForAction,
    refreshTokens
  } = useTokens()
  
  // Load projects data (lower priority, but still parallel)
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

  const handleCreateProject = async (projectData: {
    title: string;
    outline_text: string;
    language: string;
    theme: string;
  }) => {
    setLoading(true)

    console.log('Creating project with data:', {
      title: projectData.title,
      outline: projectData.outline_text,
      language: projectData.language,
      theme: projectData.theme,
    })
    console.log('User authentication status:', { user: user?.id, email: user?.email })
    
    // Check if user is authenticated
    if (!user) {
      alert('Please log in to create a project')
      setLoading(false)
      return { error: 'Not authenticated' }
    }

    // Check if user has enough tokens
    const tokenCheck = await checkTokensForAction('create_presentation')
    if (!tokenCheck.hasEnoughTokens) {
      setInsufficientModalData({
        actionType: 'create_presentation',
        requiredTokens: tokenCheck.requiredTokens || 10,
        availableTokens: tokenCheck.availableTokens || 0
      })
      setShowTokenInsufficientModal(true)
      setLoading(false)
      return { error: 'Insufficient tokens' }
    }

    try {
      const { data, error } = await createProjectWithAI({
        title: projectData.title,
        outline_text: projectData.outline_text,
        language: projectData.language,
        theme: projectData.theme,
      })
      
      if (error) {
        console.error('Error creating project:', error)
        setLoading(false)
        return { error: error }
      } else {
        // Refresh token data after successful creation
        refreshTokens()
        
        // Get the project ID from the response
        const projectId = data?.project?.id
        if (projectId) {
          setLoading(false)
          // Show the full-screen loading component
          setCreatingProject({
            id: projectId,
            title: projectData.title
          })
          setShowCreationLoading(true)
          return { projectId }
        } else {
          setLoading(false)
          return { error: 'Project created but no ID returned' }
        }
      }
    } catch (err) {
      console.error('Error creating project:', err)
      setLoading(false)
      return { error: err instanceof Error ? err.message : 'Unknown error' }
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
    // Check tokens before attempting regeneration
    const tokenCheck = await checkTokensForAction('regenerate_slides')
    if (!tokenCheck.hasEnoughTokens) {
      alert(`❌ ${tokenCheck.message}\n\nPlease purchase more tokens or upgrade your plan to continue.`)
      return
    }

    if (confirm('Are you sure you want to regenerate this project? This will create new slides.')) {
      try {
        const { error } = await regenerateProject(id)
        if (error) {
          console.error('Error regenerating project:', error)
          
          // Handle specific error cases
          if (error.includes('Insufficient tokens')) {
            alert(`❌ ${error}\n\nPlease purchase more tokens or upgrade your plan to continue.`)
          } else if (error.includes('Too many requests')) {
            alert(`⏳ ${error}`)
          } else if (error.includes('AI service')) {
            alert(`🤖 ${error}`)
          } else {
            alert(`❌ Error: ${error}`)
          }
        } else {
          // Success - refresh token data
          refreshTokens()
        }
      } catch (err) {
        console.error('Error regenerating project:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        alert(`❌ Error: ${errorMessage}`)
      }
    }
  }

  const handleExportProject = async (id: string) => {
    // Find the project to check its status
    const project = projects.find(p => p.id === id)
    if (!project) {
      alert('Project not found')
      return
    }

    // Check if project is ready for export
    if (project.status !== 'ready') {
      if (project.status === 'generating') {
        alert('Project is still being generated. Please wait for it to complete before exporting.')
      } else if (project.status === 'error') {
        alert('Project generation failed. Please regenerate the project before exporting.')
      } else {
        alert('Project is not ready for export. Please ensure slides have been generated.')
      }
      return
    }

    // Check if project has slide plan
    if (!project.slide_plan) {
      alert('Project has no slides generated. Please regenerate the project first.')
      return
    }

    // Check if user has enough tokens
    const tokenCheck = await checkTokensForAction('export_presentation')
    if (!tokenCheck.hasEnoughTokens) {
      setInsufficientModalData({
        actionType: 'export_presentation',
        requiredTokens: tokenCheck.requiredTokens || 3,
        availableTokens: tokenCheck.availableTokens || 0
      })
      setShowTokenInsufficientModal(true)
      return
    }

    try {
      console.log('Starting export for project:', id)
      const { data, error } = await exportProject(id)
      
      if (error) {
        console.error('Export API returned error:', error)
        alert(`Export failed: ${error}`)
        return
      }
      
      if (data?.url) {
        console.log('Export successful, opening URL:', data.url)
        // Open the download URL in a new tab
        window.open(data.url, '_blank')
        // Refresh token data after successful export
        refreshTokens()
      } else {
        console.error('Export succeeded but no URL returned:', data)
        alert('Export completed but no download URL was provided')
      }
    } catch (err) {
      console.error('Export request failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Export failed: ${errorMessage}`)
    }
  }

  // Token-related handlers
  const handleUpgradePlan = () => {
    setShowUpgradeModal(true)
  }

  const handlePurchaseTokens = () => {
    setShowUpgradeModal(true)
  }

  const handleViewTokenHistory = () => {
    // Could implement a separate modal or navigate to a dedicated page
    console.log('View token history')
  }

  const handleUpgradePlanAction = async (planId: string) => {
    try {
      await updateSubscription(planId as 'free' | 'pro' | 'business' | 'enterprise')
      setShowUpgradeModal(false)
      // Show success message
      alert(`Successfully upgraded to ${planId} plan!`)
    } catch (error) {
      console.error('Error upgrading plan:', error)
      alert(`Error upgrading plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePurchaseTokensAction = async (packageId: string) => {
    try {
      await purchaseTokens(packageId)
      setShowUpgradeModal(false)
      // Show success message
      alert('Tokens purchased successfully!')
    } catch (error) {
      console.error('Error purchasing tokens:', error)
      alert(`Error purchasing tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  const handleCreationComplete = () => {
    setShowCreationLoading(false)
    setCreatingProject(null)
    // Refresh projects to show the new one
    // The useProjects hook will automatically refresh
  }

  const handleCreationError = (error: string) => {
    console.error('Project creation error:', error)
    setShowCreationLoading(false)
    setCreatingProject(null)
    alert(`Project creation failed: ${error}`)
  }


  // Debug logging
  console.log('Dashboard render state:', { 
    user: !!user, 
    userEmail: user?.email,
    authLoading, 
    initializing
  })

  // Show loading only if we don't have a user yet and auth is still loading
  if (!user && (authLoading || initializing)) {
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

  // If auth is done loading but no user, redirect to auth
  if (!user && !authLoading && !initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // User exists, render dashboard
  console.log('Rendering dashboard for user:', user?.email)
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
              width={120} 
              height={120}
              className="h-23 w-23"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="border-2 text-red-600 hover:text-red-700 hover:bg-red-50">
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

        {/* Token Usage Section - Show first, even while loading */}
        <div className="mb-8">
          {tokensError && tokensError.includes('Authentication required') ? (
            <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <p>Please wait while we verify your authentication...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <TokenUsage
              tokenInfo={tokenInfo}
              usageHistory={usageHistory}
              usageStats={usageStats}
              onUpgrade={handleUpgradePlan}
              onPurchaseTokens={handlePurchaseTokens}
              onViewHistory={handleViewTokenHistory}
              isLoading={tokensLoading}
            />
          )}
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
            <p className="text-muted-foreground">
              Create and manage your AI-powered presentations
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>


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
              <Button onClick={() => setShowCreateModal(true)}>
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
                      {project.status === 'ready' && !project.slide_plan && project.slide_count === 0 && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          No slides generated - regenerate to create slides
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
                        <DropdownMenuItem 
                          onClick={() => handleExportProject(project.id)}
                          disabled={!project.slide_plan}
                        >
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
                        disabled={!project.slide_plan}
                        title={!project.slide_plan ? "No slides generated yet" : "Export as PPTX"}
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

      {/* Token Upgrade Modal */}
      <TokenUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={tokenInfo?.subscriptionPlan || 'free'}
        currentTokens={tokenInfo?.totalAvailableTokens || 0}
        onUpgradePlan={handleUpgradePlanAction as (planId: string) => Promise<void>}
        onPurchaseTokens={handlePurchaseTokensAction}
        isLoading={tokensLoading}
      />

      {/* Token Insufficient Modal */}
      {insufficientModalData && (
        <TokenInsufficientModal
          isOpen={showTokenInsufficientModal}
          onClose={() => setShowTokenInsufficientModal(false)}
          actionType={insufficientModalData.actionType as 'create_presentation' | 'export_presentation' | 'add_edit_slide' | 'generate_analytics' | 'regenerate_slides'}
          requiredTokens={insufficientModalData.requiredTokens}
          availableTokens={insufficientModalData.availableTokens}
          currentPlan={tokenInfo?.subscriptionPlan || 'free'}
          onUpgradePlan={handleUpgradePlan}
          onPurchaseTokens={handlePurchaseTokens}
        />
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        loading={loading}
        currentPlan={tokenInfo?.subscriptionPlan || 'free'}
        onUpgradePlan={() => setShowUpgradeModal(true)}
      />

      {/* Project Creation Loading */}
      {showCreationLoading && creatingProject && (
        <ProjectCreationLoading
          projectId={creatingProject.id}
          projectTitle={creatingProject.title}
          onComplete={handleCreationComplete}
          onError={handleCreationError}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/slivoralogonoback.png" 
                alt="Slivora Logo" 
                width={80} 
                height={80}
                className="h-6 w-auto"
              />
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Slivora. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/refund-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
