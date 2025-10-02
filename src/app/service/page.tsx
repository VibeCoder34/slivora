"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Wand2, 
  FileText, 
  Download, 
  Settings, 
  History, 
  Plus, 
  Copy,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServicePage() {
  const [prompt, setPrompt] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [audience, setAudience] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [slides, setSlides] = React.useState<Array<{ title: string; bullets: string[] }>>([]);
  const [activeTab, setActiveTab] = React.useState<"create" | "history">("create");

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || !title.trim()) return;
    setIsGenerating(true);
    setSlides([]);

    // Mock generation
    setTimeout(() => {
      const mock = [
        {
          title: "Introduction",
          bullets: ["Problem overview", "Why it matters", "Audience takeaway"],
        },
        {
          title: "Key Insights",
          bullets: ["Data-driven points", "Real examples", "Visual summaries"],
        },
        {
          title: "Action Plan",
          bullets: ["Next steps", "Timeline", "Metrics to track"],
        },
      ];
      setSlides(mock);
      setIsGenerating(false);
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/slivoralogonoback.png" 
              alt="Slivora Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <span className="text-sm sm:text-base font-semibold tracking-tight">Slivora</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">AI Presentation Generator</h1>
          <p className="mt-2 text-muted-foreground">
            Create professional presentations in seconds with AI-powered content generation.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "create" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Create New
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "history" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4 mr-2 inline" />
            My Presentations
          </button>
        </div>

        {activeTab === "create" && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Generation Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Generate Presentation
                  </CardTitle>
                  <CardDescription>
                    Describe your presentation topic and we&apos;ll create professional slides for you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Presentation Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g. Q4 Sales Strategy"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audience">Target Audience</Label>
                        <Input
                          id="audience"
                          placeholder="e.g. Executive team, Students, Clients"
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Presentation Details</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Describe your presentation topic, key points, and desired outcome..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={isGenerating} className="gap-2">
                        <Wand2 className="h-4 w-4" />
                        {isGenerating ? "Generating..." : "Generate Presentation"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setPrompt("");
                        setTitle("");
                        setAudience("");
                      }}>
                        Clear
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Generated Slides Preview */}
              {slides.length > 0 && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Generated Presentation</CardTitle>
                    <CardDescription>
                      Review your AI-generated slides and customize as needed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {slides.map((slide, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">{slide.title}</h3>
                          <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                            {slide.bullets.map((bullet, i) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button className="gap-2">
                        <Download className="h-4 w-4" />
                        Export as PDF
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Slides
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Presentations Created</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Saved</span>
                    <span className="font-semibold">24 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-semibold">5</span>
                  </div>
                </CardContent>
              </Card>

              {/* Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Templates</CardTitle>
                  <CardDescription>Choose a design style</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 border rounded-md hover:bg-muted text-sm">
                      <div className="w-full h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded mb-2"></div>
                      Modern
                    </button>
                    <button className="p-3 border rounded-md hover:bg-muted text-sm">
                      <div className="w-full h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded mb-2"></div>
                      Corporate
                    </button>
                    <button className="p-3 border rounded-md hover:bg-muted text-sm">
                      <div className="w-full h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded mb-2"></div>
                      Creative
                    </button>
                    <button className="p-3 border rounded-md hover:bg-muted text-sm">
                      <div className="w-full h-16 bg-gradient-to-br from-gray-500 to-gray-700 rounded mb-2"></div>
                      Minimal
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Import from PDF
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Copy className="h-4 w-4" />
                    Duplicate Last
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Customize Brand
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Presentations</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Presentation
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Q4 Sales Strategy", date: "2 days ago", slides: 12, status: "Completed" },
                { title: "Product Launch Plan", date: "1 week ago", slides: 8, status: "Draft" },
                { title: "Team Meeting Notes", date: "2 weeks ago", slides: 6, status: "Completed" },
                { title: "Client Proposal", date: "3 weeks ago", slides: 15, status: "Completed" },
                { title: "Training Materials", date: "1 month ago", slides: 20, status: "Completed" },
                { title: "Budget Review", date: "1 month ago", slides: 10, status: "Completed" },
              ].map((presentation, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-sm">{presentation.title}</h3>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Created</span>
                        <span>{presentation.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slides</span>
                        <span>{presentation.slides}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          presentation.status === "Completed" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {presentation.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


