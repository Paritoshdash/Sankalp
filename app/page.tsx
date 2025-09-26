"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Target, Users, Award } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#11486b]">
      {/* Navigation */}
      <nav className="bg-[#11486b]/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-[#ffa425]" />
              <span className="text-xl font-bold text-[#FAF9F6]">Team Sankalp</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-[#ffa425] text-[#ffa425] hover:bg-white/10 bg-transparent"
                >
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#ffa425] hover:bg-[#da6328] text-[#11486b] font-semibold">
                  {t("nav.register")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#FAF9F6] leading-tight">
                  {t("home.title")}
                  <span className="text-[#ffa425] block">{t("home.titleHighlight")}</span>
                </h1>
                <p className="text-xl text-[#FAF9F6] leading-relaxed max-w-2xl">{t("home.tagline")}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-[#ffa425] hover:bg-[#da6328] text-[#11486b] px-10 py-4 text-lg font-semibold"
                  >
                    {t("home.getStarted")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-black/20 border border-white/10 p-8 flex items-center justify-center">
                <img
                  src="/olympic-athlete-in-action--dynamic-sports-pose--pr.jpg"
                  alt="Athlete in action"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-[#478356] rounded-lg shadow-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-[#ffa425]" />
                  <span className="text-sm font-medium text-[#FAF9F6]">Performance Tracking</span>
                </div> 
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#478356] rounded-lg shadow-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-[#ffa425]" />
                  <span className="text-sm font-medium text-[#FAF9F6]">Excellence Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#FAF9F6]">{t("home.featuresTitle")}</h2>
            <p className="text-xl text-[#ffa425] max-w-3xl mx-auto">{t("home.featuresSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-white/10 bg-[#11486b] hover:border-[#ffa425]/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center mx-auto">
                  <Trophy className="h-6 w-6 text-[#ffa425]" />
                </div>
                <h3 className="text-lg font-semibold text-[#FAF9F6]">{t("home.sportSelection")}</h3>
                <p className="text-[#ffa425] text-sm">{t("home.sportSelectionDesc")}</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#11486b] hover:border-[#ffa425]/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center mx-auto">
                  <Target className="h-6 w-6 text-[#ffa425]" />
                </div>
                <h3 className="text-lg font-semibold text-[#FAF9F6]">{t("home.excellenceTesting")}</h3>
                <p className="text-[#ffa425] text-sm">{t("home.excellenceTestingDesc")}</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#11486b] hover:border-[#ffa425]/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-[#ffa425]" />
                </div>
                <h3 className="text-lg font-semibold text-[#FAF9F6]">{t("home.fitnessAnalysis")}</h3>
                <p className="text-[#ffa425] text-sm">{t("home.fitnessAnalysisDesc")}</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#11486b] hover:border-[#ffa425]/50 transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center mx-auto">
                  <Award className="h-6 w-6 text-[#ffa425]" />
                </div>
                <h3 className="text-lg font-semibold text-[#FAF9F6]">{t("home.aiVideoAnalysis")}</h3>
                <p className="text-[#ffa425] text-sm">{t("home.aiVideoAnalysisDesc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#11486b] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-[#ffa425]" />
                <span className="text-lg font-bold text-[#FAF9F6]">Team Sankalp</span>
              </div>
              <p className="text-[#FAF9F6]/70 text-sm">
                Empowering athletes through advanced performance analysis and talent identification.
              </p>
            </div>

            

            <div>
              <h4 className="font-semibold text-[#FAF9F6] mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-[#FAF9F6]/70">
                <li>
                  <Link href="/help" className="hover:text-[#ffa425]">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#ffa425]">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#ffa425]">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#FAF9F6] mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-[#FAF9F6]/70">
                <li>Email: info@teamsankalp.in</li>
                <li>Phone: +91 7684940568</li>
                <li>Address: Gunupur, Odisha</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-[#FAF9F6]/70">
            <p>&copy; 2025 Team Sankalp. All rights reserved. Athlete Performance Analysis System.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}