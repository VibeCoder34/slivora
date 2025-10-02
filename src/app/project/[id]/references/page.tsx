'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ExternalLink } from 'lucide-react'

type ReferenceItem = { url: string; label?: string }

export default function ReferencesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [references, setReferences] = useState<ReferenceItem[]>([])
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
          .from('projects')
          .select('title, slide_plan')
          .eq('id', projectId)
          .single()
        if (!error && data) {
          setTitle(data.title)
          const refs: ReferenceItem[] = data.slide_plan?.references || []
          setReferences(refs)
        }
      } finally {
        setLoading(false)
      }
    }
    if (projectId) load()
  }, [projectId])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push(`/project/${projectId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <h1 className="text-lg font-semibold">References — {title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Source List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : references.length === 0 ? (
              <div className="text-muted-foreground">No references available for this project.</div>
            ) : (
              <ul className="space-y-3">
                {references.map((ref, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{ref.label || ref.url}</div>
                      <div className="text-sm text-muted-foreground truncate">{ref.url}</div>
                    </div>
                    <a 
                      href={ref.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


