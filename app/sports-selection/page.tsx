"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

const olympicSports = [
  { id: "running-100m", name: "100m Running", description: "Explosive short-distance sprint.", icon: "🏃‍♂️", category: "Athletics" },
  { id: "high-jump", name: "High Jump", description: "Jump over a horizontal bar.", icon: "👟", category: "Athletics" },
  { id: "javelin", name: "Javelin Throw", description: "Throw a spear-like javelin for distance.", icon: "☄️", category: "Athletics" },
  { id: "long-jump", name: "Long Jump", description: "Leap as far as possible from a takeoff point.", icon: "🤸‍♂️", category: "Athletics" },
  { id: "shotput", name: "Shot Put", description: "'Putting' a heavy spherical ball.", icon: "⚫", category: "Athletics" },
  { id: "archery", name: "Archery", description: "Precision sport using a bow and arrows.", icon: "🏹", category: "Precision Sports" },
  { id: "shooting", name: "Shooting", description: "Precision marksmanship in various disciplines.", icon: "🎯", category: "Precision Sports" },
]

const categories = ["All Sports", "Athletics", "Precision Sports"]
const skillLevels = ["Beginner", "Intermediate", "Advanced"]

export default function SportsSelectionPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Sports")
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [existingSelection, setExistingSelection] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkUserAndSelection = () => {
      const currentUserStr = localStorage.getItem("currentUser");
      if (!currentUserStr) {
        window.location.href = "/login";
        return;
      }
      const currentUser = JSON.parse(currentUserStr);
      setUser(currentUser);

      // Check local storage for an existing selection instead of fetching from an API
      const sportSelectionStr = localStorage.getItem('sportSelection');
      if (sportSelectionStr) {
        const selection = JSON.parse(sportSelectionStr);
        // Make sure the saved selection belongs to the currently logged-in user
        if (selection.userId === currentUser.id) {
            setExistingSelection(selection);
        }
      }
      setIsChecking(false);
    };
    checkUserAndSelection();
  }, []);

  const filteredSports =
    selectedCategory === "All Sports"
      ? olympicSports
      : olympicSports.filter((sport) => sport.category === selectedCategory)

  const handleConfirmSelection = (sportId: string, level: string) => {
    if (!user || isLoading) return
    setIsLoading(true)

    const selectedSportData = olympicSports.find((sport) => sport.id === sportId)
    if (!selectedSportData) {
        alert("Error: Sport not found");
        setIsLoading(false);
        return;
    }

    // Simulate saving the data and navigating
    setTimeout(() => {
        const selectionData = {
            userId: user.id,
            sport_name: selectedSportData.name, // Match property name used in 'existingSelection' card
            skill_level: level,
            sport_id: sportId,
        };

        localStorage.setItem('sportSelection', JSON.stringify(selectionData));

        alert(`Selection Saved! You've selected ${selectedSportData.name} (${level}).`);
        
        // Navigate to the next page
        window.location.href = `/excellence/${sportId}`;

    }, 1000);
  }
  
  if (isChecking || !user) {
    return (
      <div className="min-h-screen bg-[#013a63] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DDD92A] mx-auto mb-4"></div>
          <p className="text-[#FAF9F6]">Loading...</p>
        </div>
      </div>
    )
  }

  if (existingSelection) {
    return (
      <div className="min-h-screen bg-[#013a63] flex flex-col items-center justify-center text-center p-4">
        <Card className="max-w-md w-full bg-[#014f86] border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#DDD92A]">Your Sport is Selected</CardTitle>
            <CardDescription className="text-[#EEEFA8]">
              You have chosen your discipline. This choice is final and cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-left p-4 bg-black/20 rounded-lg">
              <p className="text-[#FAF9F6]"><strong>Sport:</strong> {existingSelection.sport_name}</p>
              <p className="text-[#FAF9F6]"><strong>Level:</strong> {existingSelection.skill_level}</p>
            </div>
              <Button 
                onClick={() => { window.location.href = `/excellence/${existingSelection.sport_id}` }}
                className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold"
              >
                Continue to Assessment <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#013a63]">
      <div className="bg-[#013a63]/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center space-x-2 text-[#EAE151] hover:text-[#DDD92A]">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </a>
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-[#DDD92A]" />
              <span className="font-bold text-[#FAF9F6]">Team Sankalp</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-6 mb-12">
           <h1 className="text-4xl sm:text-5xl font-bold text-[#FAF9F6]">
             Choose Your <span className="text-[#DDD92A] block">Discipline</span>
           </h1>
           <p className="text-xl text-[#EEEFA8] max-w-3xl mx-auto">
             Select your primary sport below. This choice is final and will be used for your assessments.
           </p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={ selectedCategory === category ? "bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b]" : "border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10 bg-transparent" }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredSports.map((sport) => (
            <Card
              key={sport.id}
              className={`cursor-pointer transition-all bg-[#014f86] border border-white/10 text-[#FAF9F6] ${ selectedSport === sport.id ? "ring-2 ring-[#DDD92A]" : "hover:border-[#DDD92A]/50" }`}
              onClick={() => setSelectedSport((prev) => (prev === sport.id ? null : sport.id))}
            >
              <CardHeader className="text-center space-y-3">
                <div className="text-4xl mx-auto">{sport.icon}</div>
                <CardTitle>{sport.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSport === sport.id ? (
                  <div className="flex flex-col items-center space-y-3 py-2">
                    <h4 className="font-semibold text-[#EEEFA8]">Select Your Level</h4>
                    <div className="flex flex-col gap-2 w-full">
                      {skillLevels.map((level) => (
                        <Button
                          key={level}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmSelection(sport.id, level);
                          }}
                          className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b]"
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <CardDescription className="h-12 text-[#EEEFA8]/80">{sport.description}</CardDescription>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-white/40">{sport.category}</span>
                  {isLoading && selectedSport === sport.id ? (
                    <Loader2 className="animate-spin h-4 w-4 text-[#DDD92A]" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-[#DDD92A]" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-[#DDD92A] rounded-2xl p-8 text-center text-[#013a63]">
          <h2 className="text-2xl font-bold mb-4">What Happens Next?</h2>
          <div className="grid md:grid-cols-4 gap-6 text-sm">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-[#013a63]/20 rounded-full flex items-center justify-center mx-auto text-lg font-bold">1</div>
              <h3 className="font-semibold">Excellence Assessment</h3>
              <p className="text-[#013a63]/80">Complete sport-specific questions to evaluate your knowledge.</p>
            </div>
             <div className="space-y-2">
               <div className="w-8 h-8 bg-[#013a63]/20 rounded-full flex items-center justify-center mx-auto text-lg font-bold">2</div>
               <h3 className="font-semibold">Showcase Achievements</h3>
               <p className="text-[#013a63]/80">Upload certificates and share your game experience (optional).</p>
             </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-[#013a63]/20 rounded-full flex items-center justify-center mx-auto text-lg font-bold">3</div>
              <h3 className="font-semibold">Fitness Evaluation</h3>
              <p className="text-[#013a63]/80">Provide fitness metrics and complete health questionnaire.</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-[#013a63]/20 rounded-full flex items-center justify-center mx-auto text-lg font-bold">4</div>
              <h3 className="font-semibold">Performance Analysis</h3>
              <p className="text-[#013a63]/80">Upload videos for AI-powered technique and performance analysis.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

