// File: app/contact/page.tsx
"use client"

import Link from "next/link"
import { ArrowLeft, Trophy, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#2D2A32] text-[#FAFDF6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-[#DDD92A]" />
            <span className="text-2xl font-bold">Contact Us</span>
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

        {/* MODIFIED LINE: Changed md:grid-cols-2 to lg:grid-cols-2 */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Get in Touch</h2>
            <p className="text-[#EEEFA8]">
              Have a question or feedback? Fill out the form below, and we'll get back to you as soon as
              possible.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#DDD92A]" />
                <span className="text-[#EEEFA8]">info@teamsankalp.in</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#DDD92A]" />
                <span className="text-[#EEEFA8]">+91 7684940568</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-[#DDD92A]" />
                <span className="text-[#EEEFA8]">Gunupur, Odisha</span>
              </div>
            </div>
          </div>

          <Card className="border-white/10 bg-black/20">
            <CardHeader>
              <CardTitle className="text-[#FAFDF6]">Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#EEEFA8]">
                    Name
                  </Label>
                  <Input
                    id="name"
                    className="bg-[#2D2A32] border-white/20 text-white"
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#EEEFA8]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-[#2D2A32] border-white/20 text-white"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[#EEEFA8]">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    className="bg-[#2D2A32] border-white/20 text-white"
                    placeholder="How can we help you?"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32] font-semibold"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}