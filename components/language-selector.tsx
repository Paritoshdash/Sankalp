"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, ChevronDown } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function LanguageSelector() {
  const { currentLanguage, setLanguage, languages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = languages.find((lang) => lang.code === currentLanguage)

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-50 bg-white/80 backdrop-blur-sm"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLang?.nativeName}</span>
        <span className="sm:hidden">{currentLang?.code.toUpperCase()}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 z-50 w-64 max-h-80 overflow-y-auto border-purple-100 shadow-lg">
          <CardContent className="p-2">
            <div className="grid gap-1">
              {languages.map((language) => (
                <Button
                  key={language.code}
                  variant="ghost"
                  onClick={() => {
                    setLanguage(language.code)
                    setIsOpen(false)
                  }}
                  className={`justify-start text-left h-auto p-3 ${
                    currentLanguage === language.code
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "hover:bg-purple-50"
                  }`}
                >
                  <div>
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-sm text-gray-500">{language.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
