"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, FileText, Rocket, Zap, Star, CheckCircle, Users, Clock, Download, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    setIsDark(next);
  }

  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image 
                src="/slivoralogonoback.png" 
                alt="Slivora Logo" 
                width={120} 
                height={120}
                className="h-23 w-23 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a className="hover:text-foreground" href="#features">Features</a>
            <a className="hover:text-foreground" href="#how">How it works</a>
            <a className="hover:text-foreground" href="#testimonials">Testimonials</a>
            <a className="hover:text-foreground" href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Link href="/auth">
              <Button className="hidden sm:inline-flex">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Presentation Generator
          </div>
          <h1 className="mt-6 text-3xl sm:text-5xl font-semibold tracking-tight">
            Create stunning presentations in minutes, not hours
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground text-lg">
            Stop spending hours on slide design. Our AI creates professional presentations from your ideas in seconds. Perfect for business, education, and creative projects.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/auth">
              <Button size="lg" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Start creating for free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Watch demo
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10x</div>
              <div className="text-sm text-muted-foreground">Faster than manual design</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Presentations created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.9★</div>
              <div className="text-sm text-muted-foreground">User satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Why choose Slivora?</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Powerful AI technology meets intuitive design to create presentations that actually engage your audience.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature 
              icon={<Zap className="h-6 w-6 text-primary" />} 
              title="Lightning Fast" 
              desc="Generate complete presentations in under 30 seconds. No more spending hours on slide design." 
            />
            <Feature 
              icon={<FileText className="h-6 w-6 text-primary" />} 
              title="Smart Content" 
              desc="AI analyzes your topic and creates structured, logical flow with compelling bullet points and insights." 
            />
            <Feature 
              icon={<Star className="h-6 w-6 text-primary" />} 
              title="Professional Design" 
              desc="Beautiful, modern templates that work for any industry. No design skills required." 
            />
            <Feature 
              icon={<Users className="h-6 w-6 text-primary" />} 
              title="Audience-Focused" 
              desc="Tailored content based on your audience type - executives, students, clients, or team members." 
            />
            <Feature 
              icon={<Clock className="h-6 w-6 text-primary" />} 
              title="Time-Saving" 
              desc="Save 5-10 hours per presentation. Focus on your message, not formatting and design." 
            />
            <Feature 
              icon={<Download className="h-6 w-6 text-primary" />} 
              title="Export Anywhere" 
              desc="Download as PowerPoint, PDF, or Google Slides. Works with your existing workflow." 
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Creating professional presentations has never been this simple. Just three steps to get started.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step 
              index={1} 
              title="Describe your idea" 
              desc="Tell us your topic, target audience, and presentation goals. The more details you provide, the better the results." 
            />
            <Step 
              index={2} 
              title="AI generates content" 
              desc="Our AI analyzes your input and creates structured slides with compelling content, proper flow, and professional design." 
            />
            <Step 
              index={3} 
              title="Customize & export" 
              desc="Review, edit, and customize your presentation. Export to PowerPoint, PDF, or Google Slides when you're ready." 
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">What our users say</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professionals who've transformed their presentation workflow.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Testimonial 
              name="Sarah Chen"
              role="Marketing Director"
              company="TechCorp"
              content="Presently saved me 8 hours on my quarterly presentation. The AI understood my audience perfectly and created slides that actually engaged our stakeholders."
              rating={5}
            />
            <Testimonial 
              name="Marcus Johnson"
              role="Sales Manager"
              company="Growth Inc"
              content="I used to dread creating sales decks. Now I can focus on the strategy while Presently handles the design. My close rate improved by 23%."
              rating={5}
            />
            <Testimonial 
              name="Dr. Emily Rodriguez"
              role="Professor"
              company="University of California"
              content="Perfect for academic presentations. The AI creates logical flow and includes proper citations. My students are more engaged than ever."
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <PricingCard 
              name="Free"
              price="$0"
              period="forever"
              description="Perfect for trying out SLIVORA"
              features={[
                "50 tokens per month",
                "Create presentations",
                "Export to PDF",
                "Basic templates",
                "Community support"
              ]}
              buttonText="Get started"
              popular={false}
            />
            <PricingCard 
              name="Pro"
              price="$19"
              period="per month"
              description="For professionals and small teams"
              features={[
                "500 tokens per month",
                "10% token rollover",
                "All export formats",
                "Premium templates",
                "Priority support",
                "Custom branding"
              ]}
              buttonText="Start free trial"
              href="/auth"
              popular={true}
            />
            <PricingCard 
              name="Business"
              price="$49"
              period="per month"
              description="For growing organizations"
              features={[
                "2,500 tokens per month",
                "15% token rollover",
                "Everything in Pro",
                "Team collaboration",
                "Advanced analytics",
                "API access",
                "Dedicated support"
              ]}
              buttonText="Contact sales"
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Slivora.
            </p>
          </div>
          <div className="grid gap-4 max-w-3xl mx-auto">
            <details className="rounded-md border p-6">
              <summary className="cursor-pointer font-medium text-lg">How does the token system work?</summary>
              <p className="mt-3 text-muted-foreground">SLIVORA uses a token-based pricing system. Each action (creating presentations, exporting, etc.) consumes a specific number of tokens. Free users get 50 tokens monthly, while paid plans offer more tokens and rollover benefits.</p>
            </details>
            <details className="rounded-md border p-6">
              <summary className="cursor-pointer font-medium text-lg">How does the AI create presentations?</summary>
              <p className="mt-3 text-muted-foreground">Our AI analyzes your topic, audience, and goals to create structured content with logical flow. It uses advanced language models to generate compelling bullet points, proper transitions, and professional formatting.</p>
            </details>
            <details className="rounded-md border p-6">
              <summary className="cursor-pointer font-medium text-lg">Can I customize the generated presentations?</summary>
              <p className="mt-3 text-muted-foreground">Absolutely! You can edit any text, reorder slides, change templates, add your own content, and customize colors and fonts. The AI gives you a great starting point that you can make your own.</p>
            </details>
            <details className="rounded-md border p-6">
              <summary className="cursor-pointer font-medium text-lg">What file formats can I export to?</summary>
              <p className="mt-3 text-muted-foreground">You can export to PowerPoint (.pptx), PDF, and Google Slides. All formats maintain your design and formatting perfectly. Each export costs 3 tokens.</p>
            </details>
            <details className="rounded-md border p-6">
              <summary className="cursor-pointer font-medium text-lg">Is my data secure?</summary>
              <p className="mt-3 text-muted-foreground">Yes, we take security seriously. All data is encrypted in transit and at rest. We never share your content with third parties, and you can delete your data at any time.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ready to transform your presentations?</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
              Join thousands of professionals who've already made the switch to AI-powered presentations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Start creating for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <Play className="h-4 w-4" />
                Watch demo
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • 3 free presentations • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Link href="/">
                  <Image 
                    src="/slivoralogonoback.png" 
                    alt="Slivora Logo" 
                    width={120} 
                    height={120}
                    className="h-14 w-14 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered presentation generator that creates stunning slides in seconds.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-sm">
                <a className="block text-muted-foreground hover:text-foreground" href="#features">Features</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#pricing">Pricing</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#how">How it works</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#faq">FAQ</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-sm">
                <a className="block text-muted-foreground hover:text-foreground" href="#">About</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#">Blog</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#">Careers</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#">Contact</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-sm">
                <a className="block text-muted-foreground hover:text-foreground" href="#">Help Center</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#">Documentation</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#">Status</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#">Privacy</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} Slivora. All rights reserved.</span>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <a className="hover:text-foreground" href="#">Terms</a>
              <a className="hover:text-foreground" href="#">Privacy</a>
              <a className="hover:text-foreground" href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-primary/10 grid place-items-center">{icon}</div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function Testimonial({ name, role, company, content, rating }: { 
  name: string; 
  role: string; 
  company: string; 
  content: string; 
  rating: number; 
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-4">"{content}"</p>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{role} at {company}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PricingCard({ name, price, period, description, features, buttonText, popular, href }: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  popular: boolean;
  href?: string;
}) {
  return (
    <Card className={popular ? "border-primary shadow-lg" : ""}>
      {popular && (
        <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
          Most Popular
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="mt-4">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
        {href ? (
          <Link href={href} className="block">
            <Button className="w-full" variant={popular ? "default" : "outline"}>
              {buttonText}
            </Button>
          </Link>
        ) : (
          <Button className="w-full" variant={popular ? "default" : "outline"}>
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Step({ index, title, desc }: { index: number; title: string; desc: string }) {
  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
          {index}
        </div>
        <div className="font-medium">{title}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function SunIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2"/><path d="M12 19v2"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M5.6 5.6 7 7"/><path d="M17 17l1.4 1.4"/><path d="M5.6 18.4 7 17"/><path d="M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/></svg>;
}

function MoonIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
