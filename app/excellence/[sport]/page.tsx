"use client"

import { useState, useEffect, useMemo, useCallback } from "react" // Imported useCallback
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Trophy, ArrowLeft, CheckCircle, XCircle, ArrowRight, Languages, Loader2, Clock } from "lucide-react" // Imported Clock icon
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// --- (Interfaces: LanguageText, FAQOption, FAQ, etc. remain unchanged) ---
interface LanguageText {
  en: string; hi: string; or: string; [key: string]: string;
}
interface FAQOption {
  text: LanguageText; points: number;
}
interface FAQ {
  id: string; question: LanguageText; options: FAQOption[];
}
interface InputQuestionNew {
  id: string; question: LanguageText; options: { text: LanguageText; isCorrect: boolean; }[];
}
interface InputQuestionOld {
  id: string; question: LanguageText; options: LanguageText[]; correct_answer_index: number;
}
// --------------------------------------------------------------------------

const sportNames: Record<string, string> = {
  "running-100m": "100m Running", "high-jump": "High Jump", "javelin": "Javelin Throw",
  "long-jump": "Long Jump", "archery": "Archery", "shooting": "Shooting", "shotput": "Shot Put",
};

const sportAPIs: Record<string, string> = {
  "running-100m": "/api/questions/athletics_100m_questions.json", "high-jump": "/api/questions/high_jump_dataset.json",
  "javelin": "/api/questions/athletics_javelin_questions.json", "long-jump": "/api/questions/long_jump_dataset.json",
  "archery": "/api/questions/archery_dataset.json", "shooting": "/api/questions/shooting_dataset.json",
  "shotput": "/api/questions/shot_put_dataset.json",
};

const disclaimerDetails: Record<string, string> = {
  "running-100m": "Questions will cover sprint techniques, start-block rules, and race regulations.",
  "high-jump": "Questions will cover different jump styles (e.g., Fosbury Flop), approach rules, and bar clearance.",
  "javelin": "Questions will cover throwing technique, foul line rules, and safety protocols.",
  "long-jump": "Questions will cover takeoff board rules, jump phases (approach, takeoff, flight, landing), and distance measurement.",
  "shotput": "Questions will cover glide/spin techniques, toe board rules, and valid throw regulations.",
  "archery": "Questions will cover equipment knowledge, scoring zones, and competition rules.",
  "shooting": "Questions will cover firearm safety, stance, breathing control, and different competition formats."
};

const availableLanguages = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'हिंदी' }, { code: 'or', name: 'ଓଡ଼ିଆ' }
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function ExcellencePage() {
  const params = useParams();
  const router = useRouter();
  const sport = params.sport as string;
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [timer, setTimer] = useState(15);
  const [scoreSaved, setScoreSaved] = useState(false);

  const { maxScore, passingScore, eligibilityPercentage } = useMemo(() => {
    const max = faqs.length * 10;
    const passing = Math.ceil(max * 0.4);
    const eligibility = max > 0 ? Math.round((score / max) * 100) : 0;
    return { maxScore: max, passingScore: passing, eligibilityPercentage: eligibility };
  }, [faqs.length, score]);

  // ** MODIFICATION: handleNext is now memoized with useCallback **
  const handleNext = useCallback(() => {
    if (currentQuestion < faqs.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  }, [currentQuestion, faqs.length]);

  useEffect(() => {
    const loadQuestions = async () => {
      // ... (existing data fetching logic is unchanged)
       setIsLoading(true);
      const apiUrl = sportAPIs[sport];
      if (!apiUrl) {
        console.warn(`No API for sport: ${sport}.`);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Failed to fetch questions for ${sport}`);
        const data: (InputQuestionOld | InputQuestionNew)[] = await response.json();
        
        const transformedFaqs: FAQ[] = data.map((q) => {
          const firstOption = q.options[0];
          let processedOptions: FAQOption[];

          if (firstOption && 'isCorrect' in firstOption && 'text' in firstOption) {
            processedOptions = (q.options as InputQuestionNew['options']).filter(opt => opt && opt.text).map(opt => ({ text: opt.text, points: opt.isCorrect ? 10 : 0 }));
          } else {
            const oldQ = q as InputQuestionOld;
            processedOptions = (oldQ.options as LanguageText[]).filter(opt => opt).map((opt, index) => ({ text: opt, points: index === oldQ.correct_answer_index ? 10 : 0 }));
          }
          return { id: q.id, question: q.question, options: processedOptions };
        });

        setFaqs(shuffleArray(transformedFaqs).slice(0, 10));
      } catch (error) {
        console.error("Error loading questions:", error);
        setFaqs([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (sport) loadQuestions();
  }, [sport]);

  // ** NEW: useEffect to handle the countdown timer **
  useEffect(() => {
    // Don't run the timer if the quiz isn't active
    if (isLoading || showDisclaimer || showResults) {
      return;
    }

    // When timer hits 0, move to the next question
    if (timer === 0) {
      handleNext();
      return;
    }

    // Set up an interval to decrement the timer every second
    const intervalId = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);

    // Cleanup function to clear the interval when the component re-renders or unmounts
    return () => clearInterval(intervalId);
  }, [timer, isLoading, showDisclaimer, showResults, handleNext]);

  // ** NEW: useEffect to reset the timer when the question changes **
  useEffect(() => {
    setTimer(15);
  }, [currentQuestion]);


  useEffect(() => {
    let totalScore = 0;
    Object.entries(answers).forEach(([questionId, selectedOptionTextEn]) => {
      const question = faqs.find((faq) => faq.id === questionId);
      if (question) {
        const option = question.options.find((opt) => opt.text.en === selectedOptionTextEn);
        if (option) totalScore += option.points;
      }
    });
    setScore(totalScore);
  }, [answers, faqs]);

  // Save excellence score to database when results are shown
  useEffect(() => {
    if (!showResults || scoreSaved) return;
    const saveScore = async () => {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        await fetch('/api/user/save-excellence-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, excellenceScore: normalizedScore }),
        });
        setScoreSaved(true);
      } catch {
        // Non-blocking: score save failure doesn't break the UI
      }
    };
    saveScore();
  }, [showResults, scoreSaved, score, maxScore]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const isCurrentAnswered = faqs.length > 0 && answers[faqs[currentQuestion]?.id];
  const passed = score >= passingScore;

  if (isLoading) {
    // ... (Loading spinner UI is unchanged)
     return (
      <div className="min-h-screen bg-[#013a63] flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-[#DDD92A] mx-auto" />
            <p className="mt-4 text-[#EEEFA8]">Loading Assessment...</p>
        </div>
      </div>
    );
  }

  if (showDisclaimer) {
    // ... (Disclaimer AlertDialog is unchanged)
    return (
      <AlertDialog open={showDisclaimer} onOpenChange={() => setShowDisclaimer(false)}>
        <AlertDialogContent className="bg-[#014f86] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-[#DDD92A]">Assessment Disclaimer</AlertDialogTitle>
            <AlertDialogDescription className="text-[#EEEFA8]">
              Please read the instructions for the <strong>{sportNames[sport]}</strong> assessment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 text-white/90 py-4">
              <p><strong>1. Time Limit:</strong> You will have <strong>15 seconds</strong> to answer each question.</p>
              <p><strong>2. Scoring:</strong> Each of the {faqs.length} questions carries 10 points. Unanswered questions receive 0 points.</p>
              <p><strong>3. Qualification Mark:</strong> A score of 40% ({passingScore} points) or higher is required to pass.</p>
              <p><strong>4. Question Content:</strong> {disclaimerDetails[sport] || "Questions will be based on general rules, techniques, and regulations."}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowDisclaimer(false)}
              className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold"
            >
              I Understand, Start Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (showResults) {
    // ... (Results page UI is unchanged)
     return (
        <div className="min-h-screen bg-[#013a63] py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Trophy className="h-8 w-8 text-[#DDD92A]" />
                        <span className="text-2xl font-bold text-[#FAF9F6]">Excellence Assessment Results</span>
                    </div>
                    <p className="text-[#EEEFA8]">Your performance in {sportNames[sport] || sport} evaluation</p>
                </div>

                <Card className="border-white/10 bg-[#014f86] shadow-lg">
                    <CardHeader className="text-center space-y-4 p-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
                            {passed ? <CheckCircle className="h-12 w-12 text-green-400" /> : <XCircle className="h-12 w-12 text-red-400" />}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-[#FAF9F6]">{eligibilityPercentage}%</h2>
                            <p className="text-lg text-[#EEEFA8]">Eligibility Score</p>
                            <Badge variant={passed ? "default" : "destructive"} className={passed ? "bg-green-500 text-black font-semibold" : "bg-red-500 text-white"}>
                                {passed ? "PASSED" : "FAILED"}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-[#EEEFA8]">
                                <span>Your Score: {score}/{maxScore}</span>
                                <span>Required: {passingScore}/{maxScore} (40%)</span>
                            </div>
                            <Progress value={eligibilityPercentage} className={`h-3 [&>div]:${passed ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>

                        {passed ? (
                            <div className="bg-black/20 border border-green-500/30 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-[#FAF9F6]">Congratulations!</h3>
                                <p className="text-white/80">You have met the minimum excellence threshold for {sportNames[sport]}.</p>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-red-300">Excellence Threshold Not Met</h3>
                                <p className="text-red-400">You do not meet the minimum requirement. You cannot proceed at this time.</p>
                            </div>
                        )}
                        
                        <div className="mt-6">
                            {passed ? (
                                <div className="w-full text-center bg-black/20 p-6 rounded-lg border border-white/10 space-y-4">
                                    <h3 className="text-lg font-semibold text-[#FAF9F6]">Do you have achievements to showcase?</h3>
                                    <p className="text-sm text-[#EEEFA8]">Adding certificates can strengthen your profile.</p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                                        <Button onClick={() => router.push('/achievements')} className="flex-1 w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold">Yes, Add Achievements<ArrowRight className="h-4 w-4 ml-2" /></Button>
                                        <Button onClick={() => router.push('/fitness-details')} variant="outline" className="flex-1 w-full bg-transparent border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10">No, Continue to Fitness Details</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button onClick={() => router.push('/')} variant="outline" className="w-full bg-transparent border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10"><ArrowLeft className="h-4 w-4 mr-2" />Get Some Knowlegde and Try Again</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#013a63] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
            <Link href="/sports-selection" className="flex items-center space-x-2 text-[#EAE151] hover:text-[#DDD92A]">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Sports</span>
            </Link>
            <div className="w-40">
                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-[#014f86] border-white/10 text-[#FAF9F6]">
                        <Languages className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#014f86] border-white/10 text-[#FAF9F6]">
                        {availableLanguages.map(lang => (
                            <SelectItem key={lang.code} value={lang.code} className="focus:bg-black/20">{lang.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="mb-8 space-y-4">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-[#FAF9F6]">{sportNames[sport]} Excellence Assessment</h1>
                <p className="text-[#EEEFA8]">Answer {faqs.length} questions to evaluate your knowledge.</p>
            </div>
            <div className="space-y-2">
                {/* ** MODIFICATION: Timer display added ** */}
                <div className="flex justify-between items-center text-sm text-[#EEEFA8]">
                    <span>Question {currentQuestion + 1} of {faqs.length}</span>
                    <div className={`flex items-center font-bold text-lg px-3 py-1 rounded-full ${timer <= 5 ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-[#DDD92A] bg-black/20'}`}>
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{timer}</span>
                    </div>
                </div>
                <Progress value={((currentQuestion + 1) / faqs.length) * 100} className="h-2 bg-black/20 [&>div]:bg-[#DDD92A]" />
            </div>
        </div>
        <Card className="border-white/10 bg-[#014f86] shadow-lg mb-8">
            <CardHeader>
                <CardTitle className="text-xl text-[#FAF9F6]">{faqs[currentQuestion]?.question[language] || faqs[currentQuestion]?.question.en}</CardTitle>
                <CardDescription className="text-[#EEEFA8]">Select the correct answer based on your knowledge.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup value={answers[faqs[currentQuestion]?.id] || ""} onValueChange={(value) => handleAnswerChange(faqs[currentQuestion]?.id, value)} className="text-white/90">
                    {faqs[currentQuestion]?.options.map((option, index) => (
                        <Label
                            htmlFor={`${faqs[currentQuestion]?.id}-${index}`}
                            key={`${faqs[currentQuestion]?.id}-${index}`}
                            className="flex items-center space-x-3 p-4 rounded-lg hover:bg-black/20 border border-transparent hover:border-white/10 cursor-pointer has-[data-state=checked]:border-[#DDD92A] has-[data-state=checked]:bg-[#DDD92A]/10"
                        >
                            <RadioGroupItem value={option.text.en} id={`${faqs[currentQuestion]?.id}-${index}`} className="border-white/20 data-[state=checked]:border-[#DDD92A] data-[state=checked]:text-[#DDD92A]" />
                            <span>{option.text[language] || option.text.en}</span>
                        </Label>
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>
        <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0} className="border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10 bg-transparent disabled:opacity-50">
                <ArrowLeft className="h-4 w-4 mr-2" />Previous
            </Button>
            <Button onClick={handleNext} disabled={!isCurrentAnswered} className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed">
                {currentQuestion === faqs.length - 1 ? "View Results" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
      </div>
    </div>
  )
}