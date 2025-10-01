"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        // Reset form
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        console.error('Error submitting form:', data.error);
        alert('Failed to submit form. Please try again or email us directly at info@slivora.com');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again or email us directly at info@slivora.com');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">← Back to home</Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold">Contact us</h1>
          <p className="mt-3 text-[var(--muted-foreground)]">We&apos;d love to hear from you. Send us a message and we&apos;ll respond soon.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[var(--card)] border border-[var(--border)]">
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
              <CardDescription>Fill out the form and we&apos;ll get back to you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-[var(--muted-foreground)]" htmlFor="name">Name</label>
                  <Input id="name" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block mb-2 text-sm text-[var(--muted-foreground)]" htmlFor="email">Email</label>
                  <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block mb-2 text-sm text-[var(--muted-foreground)]" htmlFor="subject">Subject</label>
                  <Input id="subject" placeholder="How can we help?" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div>
                  <label className="block mb-2 text-sm text-[var(--muted-foreground)]" htmlFor="message">Message</label>
                  <Textarea id="message" required rows={6} placeholder="Your message" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-12" disabled={submitting}>{submitting ? "Sending..." : "Send message"}</Button>
                {submitted && (
                  <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                    Thanks! Your message has been sent successfully. We&apos;ll get back to you soon.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="bg-[var(--card)] border border-[var(--border)]">
            <CardHeader>
              <CardTitle>Other ways to reach us</CardTitle>
              <CardDescription>Prefer not to use the form? No problem.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-medium">Email</div>
                  <a href="mailto:hello@slivora.app" className="text-[var(--primary)] hover:underline">info@slivora.com</a>
                </div>
                <div>
                  <div className="font-medium">Docs</div>
                  <a href="/service" className="text-[var(--primary)] hover:underline">Service</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


