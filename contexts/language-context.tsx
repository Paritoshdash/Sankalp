"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = {
  code: string
  name: string
  nativeName: string
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
]

type LanguageContextType = {
  currentLanguage: string
  setLanguage: (code: string) => void
  languages: Language[]
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage")
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  const setLanguage = (code: string) => {
    setCurrentLanguage(code)
    localStorage.setItem("selectedLanguage", code)
  }

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations["en"][key] || key
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, languages, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// Translation object
const translations: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    "nav.login": "Login",
    "nav.register": "Register",

    // Home Page
    "home.title": "Athlete Performance",
    "home.titleHighlight": "Analysis System",
    "home.tagline":
      "Giving exposure to hidden talents from the unnoticed sector for representing their game in independent India.",
    "home.getStarted": "Get Started",
    "home.learnMore": "Learn More",
    "home.athletesAnalyzed": "Athletes Analyzed",
    "home.olympicSports": "Olympic Sports",
    "home.accuracyRate": "Accuracy Rate",
    "home.featuresTitle": "Comprehensive Athlete Analysis",
    "home.featuresSubtitle":
      "Our advanced system combines AI-powered video analysis with comprehensive performance metrics to identify and nurture hidden sporting talents.",
    "home.sportSelection": "Sport Selection",
    "home.sportSelectionDesc":
      "Choose from 15+ individual Olympic sports with specialized analysis for each discipline.",
    "home.excellenceTesting": "Excellence Testing",
    "home.excellenceTestingDesc":
      "Sport-specific questionnaires and performance benchmarks to assess athlete potential.",
    "home.fitnessAnalysis": "Fitness Analysis",
    "home.fitnessAnalysisDesc":
      "Comprehensive fitness metrics and health assessments for optimal performance evaluation.",
    "home.aiVideoAnalysis": "AI Video Analysis",
    "home.aiVideoAnalysisDesc": "Advanced MediaPipe and OpenCV technology for precise movement and technique analysis.",
    "home.ctaTitle": "Ready to Discover Your Athletic Potential?",
    "home.ctaSubtitle":
      "Join thousands of athletes who have already started their journey with our comprehensive performance analysis system.",
    "home.startAnalysis": "Start Your Analysis Today",

    // Registration
    "register.title": "Create Your Account",
    "register.subtitle": "Join the Athlete Performance Analysis System",
    "register.firstName": "First Name",
    "register.lastName": "Last Name",
    "register.email": "Gmail (Optional)",
    "register.aadhaar": "Aadhaar Number",
    "register.phone": "Phone Number",
    "register.password": "Password",
    "register.state": "State",
    "register.district": "District",
    "register.city": "Village/City",
    "register.pincode": "Pin Code",
    "register.submit": "Register",
    "register.hasAccount": "Already have an account?",
    "register.loginHere": "Login here",

    // Login
    "login.title": "Welcome Back",
    "login.subtitle": "Sign in to your account",
    "login.identifier": "First Name or Aadhaar Number",
    "login.password": "Password",
    "login.submit": "Login",
    "login.noAccount": "Don't have an account?",
    "login.registerHere": "Register here",

    // Sports Selection
    "sports.title": "Choose Your Sport",
    "sports.subtitle": "Select the Olympic sport you want to be analyzed for",

    // Excellence Section
    "excellence.title": "Excellence Assessment",
    "excellence.subtitle": "Answer these questions to evaluate your knowledge and experience",
    "excellence.question": "Question",
    "excellence.next": "Next Question",
    "excellence.submit": "Submit Assessment",
    "excellence.passed": "Congratulations! You passed the excellence threshold.",
    "excellence.failed": "You do not meet the minimum excellence threshold (40%). You cannot proceed further.",
    "excellence.retry": "Retry Assessment",
    "excellence.continue": "Continue to Fitness Details",

    // Fitness Details
    "fitness.title": "Fitness Details",
    "fitness.subtitle": "Provide your fitness metrics and health information",
    "fitness.height": "Height (cm)",
    "fitness.weight": "Weight (kg)",
    "fitness.shuttleRun": "Shuttle Run (seconds)",
    "fitness.enduranceRun": "Endurance Run (meters)",
    "fitness.verticalJump": "Vertical Jump (cm)",
    "fitness.healthQuestionnaire": "Health Questionnaire",
    "fitness.submit": "Submit Fitness Details",
    "fitness.continue": "Continue to Video Analysis",
  },

  hi: {
    // Navigation
    "nav.login": "लॉगिन",
    "nav.register": "पंजीकरण",

    // Home Page
    "home.title": "एथलीट प्रदर्शन",
    "home.titleHighlight": "विश्लेषण प्रणाली",
    "home.tagline": "स्वतंत्र भारत में अपने खेल का प्रतिनिधित्व करने के लिए अनदेखे क्षेत्र की छुपी प्रतिभाओं को एक्सपोज़र देना।",
    "home.getStarted": "शुरू करें",
    "home.learnMore": "और जानें",
    "home.athletesAnalyzed": "एथलीटों का विश्लेषण",
    "home.olympicSports": "ओलंपिक खेल",
    "home.accuracyRate": "सटीकता दर",
    "home.featuresTitle": "व्यापक एथलीट विश्लेषण",
    "home.featuresSubtitle":
      "हमारी उन्नत प्रणाली छुपी खेल प्रतिभाओं की पहचान और पोषण के लिए AI-संचालित वीडियो विश्लेषण को व्यापक प्रदर्शन मेट्रिक्स के साथ जोड़ती है।",
    "home.sportSelection": "खेल चयन",
    "home.sportSelectionDesc": "प्रत्येक अनुशासन के लिए विशेष विश्लेषण के साथ 15+ व्यक्तिगत ओलंपिक खेलों में से चुनें।",
    "home.excellenceTesting": "उत्कृष्टता परीक्षण",
    "home.excellenceTestingDesc": "एथलीट क्षमता का आकलन करने के लिए खेल-विशिष्ट प्रश्नावली और प्रदर्शन बेंचमार्क।",
    "home.fitnessAnalysis": "फिटनेस विश्लेषण",
    "home.fitnessAnalysisDesc": "इष्टतम प्रदर्शन मूल्यांकन के लिए व्यापक फिटनेस मेट्रिक्स और स्वास्थ्य आकलन।",
    "home.aiVideoAnalysis": "AI वीडियो विश्लेषण",
    "home.aiVideoAnalysisDesc": "सटीक गति और तकनीक विश्लेषण के लिए उन्नत MediaPipe और OpenCV तकनीक।",
    "home.ctaTitle": "अपनी एथलेटिक क्षमता खोजने के लिए तैयार हैं?",
    "home.ctaSubtitle": "हजारों एथलीटों में शामिल हों जिन्होंने हमारी व्यापक प्रदर्शन विश्लेषण प्रणाली के साथ अपनी यात्रा शुरू की है।",
    "home.startAnalysis": "आज ही अपना विश्लेषण शुरू करें",

    // Registration
    "register.title": "अपना खाता बनाएं",
    "register.subtitle": "एथलीट प्रदर्शन विश्लेषण प्रणाली में शामिल हों",
    "register.firstName": "पहला नाम",
    "register.lastName": "अंतिम नाम",
    "register.email": "जीमेल (वैकल्पिक)",
    "register.aadhaar": "आधार संख्या",
    "register.phone": "फोन नंबर",
    "register.password": "पासवर्ड",
    "register.state": "राज्य",
    "register.district": "जिला",
    "register.city": "गांव/शहर",
    "register.pincode": "पिन कोड",
    "register.submit": "पंजीकरण करें",
    "register.hasAccount": "पहले से खाता है?",
    "register.loginHere": "यहाँ लॉगिन करें",

    // Login
    "login.title": "वापस स्वागत है",
    "login.subtitle": "अपने खाते में साइन इन करें",
    "login.identifier": "पहला नाम या आधार संख्या",
    "login.password": "पासवर्ड",
    "login.submit": "लॉगिन",
    "login.noAccount": "खाता नहीं है?",
    "login.registerHere": "यहाँ पंजीकरण करें",
  },
  // Add more languages as needed
}
