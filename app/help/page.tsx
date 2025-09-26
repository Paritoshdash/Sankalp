// File: app/help/page.tsx
"use client"

import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

const faqs = [
  {
    question: "What is AthleteX?",
    answer:
      "AthleteX is an AI-powered mobile platform designed to democratize sports talent assessment. We use advanced analytics to identify and nurture athletic potential.",
  },
  {
    question: "How does the AI video analysis work?",
    answer:
      "Our AI analyzes video footage of an athlete's performance to provide detailed feedback on technique, form, and areas for improvement. Simply upload a video, and our system will generate a comprehensive report.",
  },
  {
    question: "Which sports do you support?",
    answer:
      "We are constantly expanding our range of supported sports. Currently, we specialize in various track and field events, archery, and shooting, with more sports being added soon.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We prioritize your privacy and data security. All personal information and performance data are encrypted and stored securely. Please see our Privacy Policy for more details.",
  },
  {
    question: "How can I get started?",
    answer:
      "Getting started is easy! Simply click the 'Register' button on our homepage, create an account, and you can begin your performance analysis journey right away.",
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#2D2A32] text-[#FAFDF6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-[#DDD92A]" />
            <span className="text-2xl font-bold">Help Center</span>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              className="border-[#EAE151] text-[#EAE151] hover:bg-white/10 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-black/20 p-8 rounded-lg border border-white/10">
          <h2 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-center text-[#EEEFA8] mb-8">
            Find answers to common questions about AthleteX.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                <AccordionTrigger className="text-lg text-left hover:no-underline text-[#FAFDF6]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#EEEFA8] text-base">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}