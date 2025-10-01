'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Clock, Shield, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/slivoralogonoback.png" 
              alt="Slivora Logo" 
              width={120} 
              height={120}
              className="h-8 w-auto"
            />
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Our commitment to fair and transparent refund practices
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Quick Overview */}
        <Card className="mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quick Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">30-Day Window</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Full refunds within 30 days</p>
              </div>
              <div className="text-center">
                <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">No Questions Asked</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Simple refund process</p>
              </div>
              <div className="text-center">
                <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">Fair Terms</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Transparent conditions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Refund Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">You are eligible for a full refund if:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>You request a refund within 30 days of purchase</li>
                  <li>You have not used more than 50% of your purchased tokens</li>
                  <li>You have not generated more than 3 presentations with the purchased tokens</li>
                  <li>The refund request is not due to violation of our Terms of Service</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Partial refunds may be available if:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>You have used some tokens but within reasonable limits</li>
                  <li>You experienced technical issues that prevented proper use of the service</li>
                  <li>You have a valid reason for requesting a partial refund</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Refund Process */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                How to Request a Refund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Contact Support</h3>
                    <p className="text-muted-foreground">Send an email to support@slivora.com with your account details and reason for refund</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Review Process</h3>
                    <p className="text-muted-foreground">We'll review your request within 2-3 business days and verify your eligibility</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Refund Processing</h3>
                    <p className="text-muted-foreground">If approved, your refund will be processed within 5-10 business days to your original payment method</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Not Refundable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                What's Not Refundable
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Refunds will not be provided for:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Tokens that have been fully consumed</li>
                  <li>Presentations that have been successfully generated and exported</li>
                  <li>Subscription fees for periods that have already been used</li>
                  <li>Accounts that have violated our Terms of Service</li>
                  <li>Refund requests made after 30 days from purchase</li>
                  <li>Free trial periods or promotional credits</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Processing Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Processing Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Refund Review</h3>
                  <p className="text-muted-foreground">2-3 business days</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Processing</h3>
                  <p className="text-muted-foreground">5-10 business days</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Credit Card Refunds</h3>
                  <p className="text-muted-foreground">3-5 business days</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">PayPal Refunds</h3>
                  <p className="text-muted-foreground">1-3 business days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you have questions about our refund policy or need assistance with a refund request, 
                  please don't hesitate to contact us.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Email Support</h3>
                    <p className="text-muted-foreground">support@slivora.com</p>
                    <p className="text-sm text-muted-foreground">Response within 24 hours</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Contact Form</h3>
                    <Link href="/contact">
                      <Button variant="outline" size="sm">
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 dark:text-yellow-300">
                We reserve the right to update this refund policy at any time. Any changes will be posted on this page 
                with an updated "Last modified" date. Continued use of our service after any changes constitutes 
                acceptance of the new policy.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button variant="outline">
              Contact Support
            </Button>
          </Link>
          <Link href="/">
            <Button>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
