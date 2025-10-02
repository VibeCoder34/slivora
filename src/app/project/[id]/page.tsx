'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProjects, Project, Slide } from '@/lib/hooks/useProjects'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Loader2,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  BookOpen
} from 'lucide-react'
import { Lock as LockIcon } from 'lucide-react'
import { useTokens } from '@/lib/hooks/useTokens'

interface AISlide {
  id?: string
  title?: string
  bullets?: string[]
  speakerNotes?: string
  layout?: string
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState<string | null>(null)
  const [slideContent, setSlideContent] = useState('')
  const [saving, setSaving] = useState(false)

  const { } = useAuth()
  const { tokenInfo } = useTokens()
  const { fetchSlides, updateSlide, deleteSlide, createSlide, regenerateProject, exportProject } = useProjects()

  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Loading project data for ID:', projectId)
      
      // Fetch project data from Supabase
      const supabase = createClient()
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      console.log('Project query result:', { projectData, projectError })
      
      if (projectError) {
        console.error('Error loading project:', projectError)
        return
      }

      if (!projectData) {
        console.error('No project data found')
        return
      }

      console.log('Project loaded successfully:', projectData)
      setProject(projectData)
      
      // If project has AI-generated slides, use those
      if (projectData.slide_plan && projectData.slide_plan.slides) {
        const aiSlides = projectData.slide_plan.slides.map((slide: AISlide, index: number) => ({
          id: slide?.id || `slide-${index}`,
          project_id: projectId,
          slide_number: index + 1,
          content: JSON.stringify({
            title: slide?.title || '',
            bullets: slide?.bullets || [],
            speakerNotes: slide?.speakerNotes || '',
            layout: slide?.layout || 'title-bullets'
          }),
          created_at: new Date().toISOString()
        }))
        setSlides(aiSlides)
      } else {
        // Fallback to individual slides table
        const { data: slidesData, error } = await fetchSlides(projectId)
        if (error) {
          console.error('Error loading slides:', error)
        } else {
          setSlides(slidesData)
        }
      }
    } catch (err) {
      console.error('Error loading project:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId, fetchSlides])

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId, loadProjectData])

  const handleEditSlide = (slide: Slide) => {
    setEditingSlide(slide.id)
    setSlideContent(slide.content)
  }

  const handleSaveSlide = async (slideId: string) => {
    try {
      setSaving(true)
      const { error } = await updateSlide(slideId, { content: slideContent })
      
      if (error) {
        console.error('Error saving slide:', error)
        return
      }

      setSlides(prev => 
        prev.map(slide => 
          slide.id === slideId 
            ? { ...slide, content: slideContent }
            : slide
        )
      )
      setEditingSlide(null)
    } catch (err) {
      console.error('Error saving slide:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlide = async (slideId: string) => {
    if (confirm('Are you sure you want to delete this slide?')) {
      try {
        const { error } = await deleteSlide(slideId)
        if (error) {
          console.error('Error deleting slide:', error)
          return
        }

        setSlides(prev => prev.filter(slide => slide.id !== slideId))
      } catch (err) {
        console.error('Error deleting slide:', err)
      }
    }
  }

  const handleAddSlide = async () => {
    try {
      const newSlideNumber = slides.length + 1
      const { data, error } = await createSlide({
        project_id: projectId,
        slide_number: newSlideNumber,
        content: 'New slide content...'
      })

      if (error) {
        console.error('Error creating slide:', error)
        return
      }

      if (data) {
        setSlides(prev => [...prev, data])
      }
    } catch (err) {
      console.error('Error creating slide:', err)
    }
  }

  const handleRegenerateProject = async () => {
    if (confirm('Are you sure you want to regenerate this project? This will create new slides.')) {
      try {
        const { error } = await regenerateProject(projectId)
        if (error) {
          console.error('Error regenerating project:', error)
          alert(`Error: ${error}`)
        } else {
          // Reload project data
          loadProjectData()
        }
      } catch (err) {
        console.error('Error regenerating project:', err)
        alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  const handleExportProject = async () => {
    try {
      const { data, error } = await exportProject(projectId)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-lg font-semibold truncate">{project.title}</h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {project.slides_count || slides.length} slides • Created {new Date(project.created_at).toLocaleDateString()}
              </p>
              {project.status === 'error' && project.generate_error && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{project.generate_error}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {project.status === 'ready' && (
              <>
                <Button variant="outline" size="sm" onClick={() => router.push(`/project/${projectId}/references`)} className="hidden sm:flex">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">References</span>
                </Button>
                {tokenInfo?.subscriptionPlan === 'pro' || tokenInfo?.subscriptionPlan === 'business' || tokenInfo?.subscriptionPlan === 'enterprise' ? (
                  <Button variant="outline" size="sm" onClick={() => window.open(`/api/projects/${projectId}/study-notes`, '_blank')} className="hidden sm:flex">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Download Study Notes</span>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => router.push('/service')} className="hidden sm:flex">
                    <LockIcon className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Study Notes (Pro)</span>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleRegenerateProject}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Regenerate</span>
                </Button>
                <Button size="sm" onClick={handleExportProject}>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export PPTX</span>
                </Button>
              </>
            )}
            {project.status === 'error' && (
              <Button size="sm" onClick={handleRegenerateProject}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Retry Generation</span>
              </Button>
            )}
            {project.status === 'generating' && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Generating slides...</span>
                <span className="sm:hidden">Generating...</span>
              </div>
            )}
            {project.status === 'draft' && (
              <Button size="sm" onClick={handleAddSlide}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Slide</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {slides.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No slides yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first slide to get started with this presentation
              </p>
              <Button onClick={handleAddSlide}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Slide
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {slides.map((slide) => (
              <Card key={slide.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {slide.slide_number}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Slide {slide.slide_number}</CardTitle>
                        <CardDescription>
                          Created {new Date(slide.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingSlide === slide.id ? (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveSlide(slide.id)}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingSlide(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditSlide(slide)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingSlide === slide.id ? (
                    <textarea
                      className="w-full min-h-[200px] p-4 border rounded-md resize-none"
                      value={slideContent}
                      onChange={(e) => setSlideContent(e.target.value)}
                      placeholder="Enter slide content..."
                    />
                  ) : (
                    <div className="prose max-w-none">
                      {(() => {
                        try {
                          const slideData = JSON.parse(slide.content)
                          return (
                            <div className="space-y-4">
                              <h3 className="text-xl font-semibold">{slideData.title}</h3>
                              {slideData.bullets && slideData.bullets.length > 0 && (
                                <ul className="list-disc list-inside space-y-1">
                                  {slideData.bullets.map((bullet: string, index: number) => (
                                    <li key={index}>{bullet}</li>
                                  ))}
                                </ul>
                              )}
                              {slideData.speakerNotes && (
                                <div className="text-sm text-gray-600 italic">
                                  <strong>Speaker Notes:</strong> {slideData.speakerNotes}
                                </div>
                              )}
                            </div>
                          )
                        } catch {
                          // Fallback for plain text content
                          return <p className="whitespace-pre-wrap">{slide.content}</p>
                        }
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
