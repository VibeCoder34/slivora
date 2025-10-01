"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, FileText, Rocket, Zap, Star, CheckCircle, Users, Clock, Download, ArrowRight, Play, Type, Layers, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import { SUBSCRIPTION_PLANS, TOKEN_COSTS } from "@/lib/config/pricing";

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
    <div className="font-sans min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image 
                src="/slivoralogonoback.png" 
                alt="Slivora Logo" 
                width={120} 
                height={120}
                className="h-25 w-25 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
            <a className="hover:text-[var(--foreground)] transition-colors" href="#features">Features</a>
            <a className="hover:text-[var(--foreground)] transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-[var(--foreground)] transition-colors" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Link href="/auth/signin">
              <Button variant="outline" size="sm" className="w-20 sm:w-24 text-xs sm:text-sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="w-20 sm:w-24 text-xs sm:text-sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[var(--background)] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Copy */}
            <div className="space-y-6 lg:space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
                  Turn your outline into slides in 1 minute.
                </h1>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
                  Paste a topic or bullets—get a clean, ready-to-present deck. Skip the formatting grind.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/auth/signup">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 button-press"
                  >
                    Create your presentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] hover:bg-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 button-press"
                  >
                    Try free
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                  <span>.pptx export</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                  <span className="hidden sm:inline">{SUBSCRIPTION_PLANS.free.monthlyTokens} tokens/month free</span>
                  <span className="sm:hidden">Free tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                  <span className="hidden sm:inline">Study Notes (Pro+)</span>
                  <span className="sm:hidden">Study Notes</span>
                </div>
              </div>
            </div>

            {/* Right - Interactive Slide Preview */}
            <div className="relative parallax-container">
              <div className="space-y-3 sm:space-y-4">
                {/* Slide 1 */}
                <div className="slide-1 w-full max-w-sm sm:max-w-md aspect-[16/9] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-sm)] transform rotate-[-2deg] slide-preview cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2" 
                     role="img" 
                     aria-label="Preview of AI-generated slides with title and bullet layout">
                  <div className="p-3 sm:p-6 h-full flex flex-col">
                    <div className="h-2 bg-[var(--primary)] rounded mb-3 sm:mb-4"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2 sm:mb-3">Create in Seconds</h3>
                    <div className="flex-1 flex items-center justify-center mb-2 sm:mb-3">
                      <Image 
                        src="/header1.png" 
                        alt="Slide visual 1" 
                        width={120} 
                        height={120}
                        className="rounded-lg object-cover w-32 h-32 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2 text-[var(--muted-foreground)] text-xs sm:text-sm">
                      <div className="h-1 bg-[var(--muted)] rounded w-3/4"></div>
                      <div className="h-1 bg-[var(--muted)] rounded w-1/2"></div>
                      <div className="h-1 bg-[var(--muted)] rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                
                {/* Slide 2 */}
                <div className="slide-2 w-full max-w-sm sm:max-w-md aspect-[16/9] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-sm)] transform rotate-[1deg] translate-y-[-10px] sm:translate-y-[-20px] slide-preview cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2" 
                     role="img" 
                     aria-label="Preview of AI-generated slides with title and bullet layout">
                  <div className="p-3 sm:p-6 h-full flex flex-col">
                    <div className="h-2 bg-[var(--primary)] rounded mb-3 sm:mb-4"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2 sm:mb-3">Smarter Slides, Less Effort</h3>
                    <div className="flex-1 flex items-center justify-center mb-2 sm:mb-3">
                      <Image 
                        src="/header2.png" 
                        alt="Slide visual 2" 
                        width={120} 
                        height={120}
                        className="rounded-lg object-cover w-32 h-32 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2 text-[var(--muted-foreground)] text-xs sm:text-sm">
                      <div className="h-1 bg-[var(--muted)] rounded w-4/5"></div>
                      <div className="h-1 bg-[var(--muted)] rounded w-3/5"></div>
                      <div className="h-1 bg-[var(--muted)] rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                
                {/* Slide 3 */}
                <div className="slide-3 w-full max-w-sm sm:max-w-md aspect-[16/9] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-sm)] transform rotate-[-1deg] translate-y-[-20px] sm:translate-y-[-40px] slide-preview cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2" 
                     role="img" 
                     aria-label="Preview of AI-generated slides with title and bullet layout">
                  <div className="p-3 sm:p-6 h-full flex flex-col">
                    <div className="h-2 bg-[var(--primary)] rounded mb-3 sm:mb-4"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2 sm:mb-3">Ready to Present</h3>
                    <div className="flex-1 flex items-center justify-center mb-2 sm:mb-3">
                      <Image 
                        src="/header3.png" 
                        alt="Slide visual 3" 
                        width={120} 
                        height={120}
                        className="rounded-lg object-cover w-32 h-32 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2 text-[var(--muted-foreground)] text-xs sm:text-sm">
                      <div className="h-1 bg-[var(--muted)] rounded w-3/4"></div>
                      <div className="h-1 bg-[var(--muted)] rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-4">
              How it works
            </h2>
            <p className="text-base sm:text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              No templates. No messing with fonts. Just type and go.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <StepCard 
              step="1"
              icon={<Type className="h-6 w-6" />}
              title="Add your idea"
              description="Type a topic or paste your outline."
            />
            <StepCard 
              step="2"
              icon={<Wand2 className="h-6 w-6" />}
              title="Generate your deck"
              description="Get structured slides with clean bullets and layouts."
            />
            <StepCard 
              step="3"
              icon={<Download className="h-6 w-6" />}
              title="Export & present"
              description=".pptx download for PowerPoint."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-4">
              Why students love it
            </h2>
            <p className="text-base sm:text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Focus on the ideas—leave the formatting to us.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <FeatureCard 
              icon={<Wand2 className="h-6 w-6" />}
              title="AI-Generated Slides"
              description="Clear structure, solid bullets, tidy layouts—instantly."
            />
            <FeatureCard 
              icon={<Download className="h-6 w-6" />}
              title=".pptx Export"
              description="Open in PowerPoint without messy fixes."
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6" />}
              title="Study Notes (Pro)"
              description="Concise summaries and key concepts derived from your deck."
            />
            <FeatureCard 
              icon={<Star className="h-6 w-6" />}
              title="Watermark on Free"
              description="Try it free. Upgrade anytime to remove the watermark."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-4">
              Simple pricing
            </h2>
            <p className="text-base sm:text-lg text-[var(--muted-foreground)]">
              Start free. Upgrade when you need more.
            </p>
          </div>
          
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
              const isContact = 'contactUs' in plan && plan.contactUs === true;
              const displayPrice = isContact
                ? 'Contact us'
                : plan.price === 0
                  ? 'Free'
                  : `$${plan.price}`;
              const period = isContact || plan.price === 0 ? '' : '/ month';
              const buttonText = isContact
                ? 'Contact us'
                : plan.price === 0
                  ? 'Start free'
                  : `Go ${plan.name}`;
              const href = isContact ? '/contact' : plan.price === 0 ? '/auth' : '/checkout';

              return (
                <PricingCard 
                  key={plan.id}
                  name={plan.name}
                  price={displayPrice}
                  period={period}
                  description={plan.features[0]}
                  features={plan.features}
                  buttonText={buttonText}
                  href={href}
                  popular={plan.popular || false}
                />
              );
            })}
          </div>
          
          <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
            Secure payments via LemonSqueezy.
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border)] bg-[var(--muted)]/20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[var(--primary)]">100+</div> {/* TODO: replace with live metric */}
                <div className="text-sm text-[var(--muted-foreground)]">decks generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[var(--primary)]">Used by students</div>
                <div className="text-sm text-[var(--muted-foreground)]">across Europe and the US</div>
              </div>
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Your content is private. We only generate what you ask for.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)]">
              FAQ
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <FAQItem 
              question="What do I get on the Free plan?"
              answer={`You get ${SUBSCRIPTION_PLANS.free.monthlyTokens} tokens per month (about ${Math.floor(SUBSCRIPTION_PLANS.free.monthlyTokens / TOKEN_COSTS.create_presentation.tokens)} presentations), export to .pptx, and access to 2 presentation themes. Free exports include a small watermark.`}
            />
            <FAQItem 
              question="What's included in Pro?"
              answer={`Pro gives you ${SUBSCRIPTION_PLANS.pro.monthlyTokens} tokens per month (about ${Math.floor(SUBSCRIPTION_PLANS.pro.monthlyTokens / TOKEN_COSTS.create_presentation.tokens)} presentations), ${SUBSCRIPTION_PLANS.pro.rolloverPercentage}% token rollover, all presentation themes, watermark-free exports, and Study Notes.`}
            />
            <FAQItem 
              question="How much do different actions cost?"
              answer={`Creating a presentation costs ${TOKEN_COSTS.create_presentation.tokens} tokens, adding/editing slides costs ${TOKEN_COSTS.add_edit_slide.tokens} token each, exporting costs ${TOKEN_COSTS.export_presentation.tokens} tokens, and generating study notes costs ${TOKEN_COSTS.generate_study_notes.tokens} tokens.`}
            />
            <FAQItem 
              question="Can I use the decks for class presentations?"
              answer="Yes. Export to .pptx and present in PowerPoint or any presentation software that supports .pptx files."
            />
            <FAQItem 
              question="How do Study Notes work?"
              answer="After your deck is generated, Pro+ users can export structured notes with key concepts and short summaries for quick revision."
            />
            <FAQItem 
              question="Do you support multiple languages?"
              answer="Yes. You can generate decks in multiple languages. Try Turkish or English."
            />
            <FAQItem 
              question="Can I cancel anytime?"
              answer="Absolutely. Manage your subscription in one click—your plan remains active until the end of the period."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Link href="/">
                  <Image 
                    src="/slivoralogonoback.png" 
                    alt="Slivora Logo" 
                    width={120} 
                    height={120}
                    className="h-25 w-25 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Link>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Slivora helps students turn rough ideas into clean presentations—fast.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-[var(--foreground)]">Contact</h3>
                <div className="space-y-2 text-sm">
                  <a 
                    className="block text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" 
                    href="/contact"
                  >
                    Contact
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-[var(--foreground)]">Legal</h3>
                <div className="space-y-2 text-sm">
                  <a 
                    className="block text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" 
                    href="/legal/terms"
                  >
                    Terms
                  </a>
                  <a 
                    className="block text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" 
                    href="/legal/privacy"
                  >
                    Privacy
                  </a>
                  <a 
                    className="block text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" 
                    href="/refund-policy"
                  >
                    Refund Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
            <span>© {new Date().getFullYear()} Slivora. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Step Card Component for How it Works section
function StepCard({ step, icon, title, description }: { 
  step: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <Card className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-sm)] card-hover">
      <CardContent className="p-6 sm:p-8 text-center">
        <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
        <p className="text-[var(--muted-foreground)]">{description}</p>
      </CardContent>
    </Card>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <Card className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-sm)] card-hover">
      <CardContent className="p-6 sm:p-8">
        <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
        <p className="text-[var(--muted-foreground)]">{description}</p>
      </CardContent>
    </Card>
  );
}

// FAQ Item Component with proper accessibility
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <details 
      className="group rounded-lg border border-[var(--border)] bg-[var(--card)]"
      open={isOpen}
    >
      <summary 
        className="flex cursor-pointer items-center justify-between p-6 font-medium text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span>{question}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="px-6 pb-6 text-[var(--muted-foreground)]">
        {answer}
      </div>
    </details>
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
        <p className="text-sm text-muted-foreground mb-4">&ldquo;{content}&rdquo;</p>
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
    <Card className={`relative bg-[var(--card)] border rounded-lg shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200 ${
      popular ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-[var(--border)]"
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
        </div>
      )}
      <CardHeader className="text-center pt-8">
        <CardTitle className="text-2xl font-bold text-[var(--foreground)]">{name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-[var(--foreground)]">{price}</span>
          <span className="text-[var(--muted-foreground)]">{period}</span>
        </div>
        <CardDescription className="mt-2 text-[var(--muted-foreground)]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
              <span className="text-[var(--foreground)]">{feature}</span>
            </li>
          ))}
        </ul>
        {href ? (
          <Link href={href} className="block">
            <Button 
              className={`w-full h-12 font-semibold button-press focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 ${
                popular 
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90" 
                  : "border border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] hover:bg-[var(--accent)]"
              }`}
            >
              {buttonText}
            </Button>
          </Link>
        ) : (
          <Button 
            className={`w-full h-12 font-semibold button-press focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 ${
              popular 
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90" 
                : "border border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] hover:bg-[var(--accent)]"
            }`}
          >
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


function SunIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2"/><path d="M12 19v2"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M5.6 5.6 7 7"/><path d="M17 17l1.4 1.4"/><path d="M5.6 18.4 7 17"/><path d="M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/></svg>;
}

function MoonIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
