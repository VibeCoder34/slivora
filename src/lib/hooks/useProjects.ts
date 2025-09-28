'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export interface Project {
  id: string
  user_id: string
  title: string
  outline_text: string
  language: string
  theme: string
  slide_count: number
  status: 'draft' | 'generating' | 'ready' | 'error'
  slide_plan: any | null
  slides_count: number
  last_generated_at: string | null
  generate_error: string | null
  pptx_url: string | null
  export_count: number
  created_at: string
}

export interface Slide {
  id: string
  project_id: string
  slide_number: number
  content: string
  created_at: string
}

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch all projects for the current user
  const fetchProjects = async () => {
    try {
      console.log('useProjects: Starting to fetch projects')
      setLoading(true)
      setError(null)

      // If no userId provided, skip fetch
      if (!userId) {
        console.log('useProjects: No userId provided, skipping fetch')
        setProjects([])
        setLoading(false)
        return
      }

      // First, check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('useProjects: User authentication error:', userError)
        // Don't throw error, just set empty projects
        setProjects([])
        setLoading(false)
        return
      }
      
      if (!user) {
        console.log('useProjects: No authenticated user, skipping fetch')
        setProjects([])
        setLoading(false)
        return
      }

      console.log('useProjects: User authenticated:', user.id)

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('useProjects: Database response:', { data: data?.length, error })
      if (error) throw error

      setProjects(data || [])
      console.log('useProjects: Projects set successfully')
    } catch (err) {
      console.error('useProjects: Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      console.log('useProjects: Setting loading to false')
      setLoading(false)
    }
  }

  // Create a new project with AI generation
  const createProjectWithAI = async (projectData: {
    title: string
    outline_text: string
    language?: string
  }) => {
    try {
      setError(null)

      const requestBody = {
        title: projectData.title,
        outline: projectData.outline_text, // Map outline_text to outline for API
        language: projectData.language || 'en',
      }
      
      console.log('Sending request body:', requestBody)
      console.log('Original projectData:', projectData)
      console.log('Field lengths:', {
        title: projectData.title?.length,
        outline_text: projectData.outline_text?.length,
        language: (projectData.language || 'en')?.length
      })
      console.log('outline_text value:', projectData.outline_text)
      
      const response = await fetch('/api/projects/create-and-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      let result;
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        console.error('Response status:', response.status)
        console.error('Response text:', await response.text())
        throw new Error('Invalid response from server')
      }

      console.log('API Response:', { status: response.status, result })

      if (!response.ok) {
        console.error('API Error:', result)
        console.error('Response status:', response.status)
        console.error('Validation issues:', result?.issues)
        const errorMessage = result?.error || result?.issues?.join(', ') || 'Failed to create project'
        throw new Error(errorMessage)
      }

      // Update local state with the new project
      setProjects(prev => [result.project, ...prev])
      return { data: result, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Create a new project (legacy method for backward compatibility)
  const createProject = async (projectData: {
    title: string
    outline_text: string
    language?: string
    theme?: string
  }) => {
    try {
      setError(null)

      // Ensure user is authenticated and get their ID for RLS
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          ...projectData,
          language: projectData.language || 'en',
          theme: projectData.theme || 'default',
          slide_count: 0,
          status: 'draft',
          slides_count: 0,
          export_count: 0,
        })
        .select()
        .single()

      if (error) throw error

      setProjects(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Update a project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      setError(null)

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setProjects(prev => 
        prev.map(project => project.id === id ? data : project)
      )
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Delete a project
  const deleteProject = async (id: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProjects(prev => prev.filter(project => project.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Fetch slides for a specific project
  const fetchSlides = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('project_id', projectId)
        .order('slide_number', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: [], error: errorMessage }
    }
  }

  // Create a new slide
  const createSlide = async (slideData: {
    project_id: string
    slide_number: number
    content: string
  }) => {
    try {
      const { data, error } = await supabase
        .from('slides')
        .insert(slideData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }

  // Update a slide
  const updateSlide = async (id: string, updates: Partial<Slide>) => {
    try {
      const { data, error } = await supabase
        .from('slides')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }

  // Delete a slide
  const deleteSlide = async (id: string) => {
    try {
      const { error } = await supabase
        .from('slides')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { error: errorMessage }
    }
  }

  // Regenerate slides for a project
  const regenerateProject = async (projectId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to regenerate project')
      }

      // Update local state with the updated project
      setProjects(prev => 
        prev.map(project => project.id === projectId ? result.project : project)
      )
      return { data: result, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Export project as PowerPoint
  const exportProject = async (projectId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to export project')
      }

      // Update local state with the updated project (export_count)
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, export_count: (project.export_count || 0) + 1, pptx_url: result.url }
            : project
        )
      )
      return { data: result, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Bulk create slides for a project
  const createSlides = async (projectId: string, slides: { slide_number: number; content: string }[]) => {
    try {
      const { data, error } = await supabase
        .from('slides')
        .insert(slides.map(slide => ({ ...slide, project_id: projectId })))
        .select()

      if (error) throw error

      // Update project slide count
      await supabase
        .from('projects')
        .update({ slide_count: slides.length })
        .eq('id', projectId)

      return { data: data || [], error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: [], error: errorMessage }
    }
  }

  useEffect(() => {
    console.log('useProjects: useEffect triggered, calling fetchProjects')
    fetchProjects()
  }, [userId])

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    createProjectWithAI,
    updateProject,
    deleteProject,
    regenerateProject,
    exportProject,
    fetchSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    createSlides,
  }
}
