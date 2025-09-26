// File: app/privacy/page.tsx
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#2D2A32] text-[#FAFDF6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-[#DDD92A]" />
            <span className="text-2xl font-bold">Privacy Policy</span>
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

        <div className="prose prose-invert prose-lg max-w-none bg-black/20 p-8 rounded-lg border border-white/10">
          <p className="text-sm text-[#EEEFA8]">Last updated: September 17, 2025</p>
          <p>
            Team Sankalp ("us", "we", or "our") operates the AthleteX platform. This page informs you of
            our policies regarding the collection, use, and disclosure of personal data when you use
            our Service and the choices you have associated with that data.
          </p>

          <h2 className="text-[#DDD92A]">Information Collection and Use</h2>
          <p>
            We collect several different types of information for various purposes to provide and
            improve our Service to you. This may include personal identification information (Name,
            email address, phone number) and performance data (videos, fitness metrics, etc.).
          </p>

          <h2 className="text-[#DDD92A]">How We Use Your Information</h2>
          <p>
            The data we collect is used to provide and maintain the service, notify you about changes,
            provide customer support, and perform analysis to improve the platform's accuracy and
            features.
          </p>

          <h2 className="text-[#DDD92A]">Data Security</h2>
          <p>
            The security of your data is important to us. We use state-of-the-art encryption and
            security measures to protect your information, but remember that no method of transmission
            over the Internet or method of electronic storage is 100% secure.
          </p>

          <h2 className="text-[#DDD92A]">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at
            info@teamsankalp.in.
          </p>
        </div>
      </div>
    </div>
  )
}