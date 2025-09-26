"use client"

import type React from "react"
import { useState, useEffect } from "react" // Added useEffect
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Trophy, ArrowLeft, ArrowRight, Info, AlertTriangle, CheckCircle, XCircle, Ruler, Weight, TrendingUp } from "lucide-react"
import Link from "next/link"

// Combined interface for all form data
interface CombinedFormData {
  height: string
  weight: string
  heightUnit: "cm" | "ft"
  weightUnit: "kg" | "lbs"
  age: string
  gender: string
  experience: string
  chronicDisease: string
  chronicDiseaseDetails: string
  injury: string
  injuryDetails: string
  substances: string
  stress: string
  medications: string
  medicationDetails: string
  criminalRecord: string
  criminalRecordDetails: string
  underInvestigation: string
  disciplinaryAction: string
  disciplinaryActionDetails: string
}

export default function FitnessDetailsPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CombinedFormData>({
    height: "",
    weight: "",
    heightUnit: "cm",
    weightUnit: "kg",
    age: "",
    gender: "",
    experience: "",
    chronicDisease: "",
    chronicDiseaseDetails: "",
    injury: "",
    injuryDetails: "",
    substances: "",
    stress: "",
    medications: "",
    medicationDetails: "",
    criminalRecord: "",
    criminalRecordDetails: "",
    underInvestigation: "",
    disciplinaryAction: "",
    disciplinaryActionDetails: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockingReasons, setBlockingReasons] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false); // Add loading state for submission
  const [currentUser, setCurrentUser] = useState<any>(null);


useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      router.push('/login');
    }
  }, [router]);


  // Combined validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const reasons: string[] = []

    // --- Validation from first component ---
    if (!formData.height.trim()) {
      newErrors.height = "Height is required"
    } else if (isNaN(Number(formData.height)) || Number(formData.height) <= 0) {
      newErrors.height = "Please enter a valid height"
    }

    if (!formData.weight.trim()) {
      newErrors.weight = "Weight is required"
    } else if (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      newErrors.weight = "Please enter a valid weight"
    }

    if (!formData.age.trim()) {
      newErrors.age = "Age is required"
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 10 || Number(formData.age) > 80) {
      newErrors.age = "Please enter a valid age between 10-80"
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required"
    }
    
    // --- Validation from second component ---
    // Health questions
    if (!formData.chronicDisease) {
        newErrors.chronicDisease = "Please answer this question";
    } else if (formData.chronicDisease === "yes") {
        if (!formData.chronicDiseaseDetails.trim()) newErrors.chronicDiseaseDetails = "Please specify your condition";
        reasons.push("Chronic disease condition requires medical clearance");
    }
    if (!formData.injury) {
        newErrors.injury = "Please answer this question";
    } else if ((formData.injury === "yes-recent" || formData.injury === "yes-past") && !formData.injuryDetails.trim()) {
        newErrors.injuryDetails = "Please specify your injury";
    } else if (formData.injury === "yes-recent") {
        reasons.push("Recent major injury requires medical clearance");
    }
    if (!formData.substances) {
        newErrors.substances = "Please answer this question";
    } else if (formData.substances === "yes-regularly") {
        reasons.push("Regular substance use is not compatible with athletic performance programs");
    }
    if (!formData.stress) {
        newErrors.stress = "Please answer this question";
    } else if (formData.stress === "often") {
        reasons.push("Frequent stress/anxiety may require professional support before athletic training");
    }
    if (!formData.medications) {
        newErrors.medications = "Please answer this question";
    } else if ((formData.medications === "yes-daily" || formData.medications === "yes-occasionally") && !formData.medicationDetails.trim()) {
        newErrors.medicationDetails = "Please specify your medications";
    } else if (formData.medications === "yes-daily") {
        reasons.push("Daily medications require medical review for athletic participation");
    }

    // Police record
    if (!formData.criminalRecord) newErrors.criminalRecord = "Please answer this question";
    else if (formData.criminalRecord === 'yes' && !formData.criminalRecordDetails.trim()) {
        newErrors.criminalRecordDetails = "Please provide details";
    } else if (formData.criminalRecord === 'yes') {
        reasons.push("Criminal record requires administrative review");
    }
    if (!formData.underInvestigation) newErrors.underInvestigation = "Please answer this question";
    else if (formData.underInvestigation === 'yes') {
        reasons.push("Ongoing investigation requires administrative review");
    }
    if (!formData.disciplinaryAction) newErrors.disciplinaryAction = "Please answer this question";
    else if (formData.disciplinaryAction === 'yes' && !formData.disciplinaryActionDetails.trim()) {
        newErrors.disciplinaryActionDetails = "Please provide details";
    } else if (formData.disciplinaryAction === 'yes') {
        reasons.push("Disciplinary action requires administrative review");
    }
    
    return { errors: newErrors, blockingReasons: reasons };
  }

  const handleInputChange = (field: keyof CombinedFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: allErrors, blockingReasons: reasons } = validateForm();
    setErrors(allErrors);

    if (Object.keys(allErrors).length === 0) {
      setIsLoading(true); // Start loading

      try {
        const response = await fetch('/api/user/fitness-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, formData: formData })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Failed to save data.');
        }

        // If API call is successful, then show results
        setBlockingReasons(reasons);
        setIsBlocked(reasons.length > 0);
        setShowResults(true);

      } catch (error: any) {
        console.error("Submission Error:", error.message);
        // Add a toast message for the user here if you have one
      } finally {
        setIsLoading(false); // Stop loading
      }
    }
  };

  // BMI calculation with unit conversion
  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      let heightInM = Number(formData.height)
      let weightInKg = Number(formData.weight)

      if (formData.heightUnit === "ft") {
        heightInM = heightInM * 0.3048 // Convert feet to meters
      } else {
        heightInM = heightInM / 100 // Convert cm to meters
      }

      if (formData.weightUnit === "lbs") {
        weightInKg = weightInKg * 0.453592 // Convert lbs to kg
      }

      if(heightInM > 0) {
        const bmi = weightInKg / (heightInM * heightInM)
        return bmi.toFixed(1)
      }
    }
    return null
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-yellow-400" }
    if (bmi < 25) return { category: "Normal", color: "text-green-400" }
    if (bmi < 30) return { category: "Overweight", color: "text-orange-400" }
    return { category: "Obese", color: "text-red-400" }
  }

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(Number(bmi)) : null;

  const inputStyles = "bg-black/20 border-white/20 text-[#FAF9F6] focus:ring-[#DDD92A] focus:border-[#DDD92A]";
  const selectTriggerStyles = `${inputStyles} data-[placeholder]:text-muted-foreground`;
  const selectContentStyles = "bg-[#014f86] border-white/20 text-[#FAF9F6]";
  
  const healthQuestions = [
    { id: "chronic", question: "1. Do you have any chronic disease (e.g., asthma, diabetes, heart disease)? *", field: "chronicDisease", detailsField: "chronicDiseaseDetails", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], detailsPlaceholder: "Describe your chronic condition(s)" },
    { id: "injury", question: "2. Have you ever had any major injury or surgery? *", field: "injury", detailsField: "injuryDetails", options: [{ value: "yes-recent", label: "Yes, in the past year" }, { value: "yes-past", label: "Yes, more than a year ago" }, { value: "no", label: "No" }], detailsPlaceholder: "Describe your injury or surgery" },
    { id: "substances", question: "3. Do you smoke, drink alcohol, or use any substances? *", field: "substances", options: [{ value: "yes-regularly", label: "Yes (regularly)" }, { value: "yes-occasionally", label: "Yes (occasionally)" }, { value: "no", label: "No" }] },
    { id: "stress", question: "4. Do you experience stress, anxiety, or fatigue related to sports performance? *", field: "stress", options: [{ value: "often", label: "Often" }, { value: "sometimes", label: "Sometimes" }, { value: "rarely", label: "Rarely" }, { value: "never", label: "Never" }] },
    { id: "meds", question: "5. Are you currently taking any medications? *", field: "medications", detailsField: "medicationDetails", options: [{ value: "yes-daily", label: "Yes (daily)" }, { value: "yes-occasionally", label: "Yes (occasionally)" }, { value: "no", label: "No" }], detailsPlaceholder: "List your medications and dosages" }
  ];

  const policeRecordQuestions = [
    { id: "criminalRecord", question: "1. Do you have any past criminal convictions? *", field: "criminalRecord", detailsField: "criminalRecordDetails", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], detailsPlaceholder: "Please provide details of the conviction(s)" },
    { id: "underInvestigation", question: "2. Are you currently under any police or legal investigation? *", field: "underInvestigation", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    { id: "disciplinaryAction", question: "3. Have you ever faced disciplinary action for misconduct in a sport? *", field: "disciplinaryAction", detailsField: "disciplinaryActionDetails", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], detailsPlaceholder: "Please provide details of the action" }
  ];

  if (showResults) {
    return (
      <div className="min-h-screen bg-[#013a63] flex items-center justify-center py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-white/10 bg-[#014f86] shadow-lg">
            <CardHeader className="text-center space-y-4 p-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isBlocked ? "bg-red-500/10" : "bg-green-500/10"}`}>
                {isBlocked ? <XCircle className="h-12 w-12 text-red-400" /> : <CheckCircle className="h-12 w-12 text-green-400" />}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#FAF9F6]">{isBlocked ? "Medical Clearance Required" : "Assessment Complete"}</h2>
                <Badge variant={isBlocked ? "destructive" : "default"} className={isBlocked ? "bg-red-600 text-white" : "bg-green-500 text-black font-semibold"}>
                  {isBlocked ? "BLOCKED" : "CLEARED"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isBlocked ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-400 mt-0.5" />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-red-300">Cannot Proceed</h3>
                      <p className="text-red-400">Based on your answers, you require medical clearance before participating.</p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-300">Reasons for Review:</h4>
                        <ul className="text-sm text-red-400 space-y-1 list-disc list-inside">
                          {blockingReasons.map((reason, index) => <li key={index}>{reason}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/20 border border-green-500/30 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-[#FAF9F6]">Health Assessment Passed</h3>
                  <p className="text-[#EEEFA8]">Congratulations! You are cleared to proceed to the video analysis stage.</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                {isBlocked ? (
                  <Link href="/" className="w-full">
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white/80 hover:bg-white/10">Back to Home</Button>
                  </Link>
                ) : (
                  <Button onClick={() => router.push('/video-analysis')} className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold">
                    Continue to Video Analysis<ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#013a63] py-8">
        <div className="container mx-auto px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/sports-selection" className="flex items-center space-x-2 text-[#EAE151] hover:text-[#DDD92A]">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back</span>
                </Link>
                <div className="flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-[#DDD92A]" />
                    <span className="font-bold text-[#FAF9F6]">Team Sankalp</span>
                </div>
                <div className="w-16" /> {/* Spacer */}
            </div>

            {/* Page Header */}
            <div className="text-center space-y-4 mb-8">
                <Badge variant="secondary" className="w-fit mx-auto bg-black/20 text-[#EEEFA8] border-white/10">
                    Step 4 of 5
                </Badge>
                <h1 className="text-3xl lg:text-4xl font-bold text-balance text-[#FAF9F6]">Fitness & Health Assessment</h1>
                <p className="text-xl text-[#EEEFA8]/80 text-pretty max-w-3xl mx-auto">
                    Provide your physical measurements and answer the health questionnaire for personalized analysis and safety screening.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            {/* Basic Measurements Card */}
            <Card className="border-white/10 bg-[#014f86] shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-[#FAF9F6]">
                        <Ruler className="h-5 w-5 text-[#DDD92A]" />
                        Basic Measurements
                    </CardTitle>
                    <CardDescription className="text-[#EEEFA8]/80">Your physical measurements for baseline assessment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Age */}
                        <div className="space-y-2">
                            <Label htmlFor="age" className="text-[#EEEFA8]">Age *</Label>
                            <Input id="age" type="number" value={formData.age} onChange={(e) => handleInputChange("age", e.target.value)} className={`${inputStyles} ${errors.age ? "border-red-500" : ""}`} placeholder="25" />
                            {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                        </div>
                        {/* Gender */}
                        <div className="space-y-2">
                            <Label htmlFor="gender" className="text-[#EEEFA8]">Gender *</Label>
                            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                                <SelectTrigger className={`${selectTriggerStyles} ${errors.gender ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent className={selectContentStyles}>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Height */}
                        <div className="space-y-2">
                            <Label htmlFor="height" className="text-[#EEEFA8]">Height *</Label>
                            <div className="flex gap-2">
                                <Input id="height" type="number" value={formData.height} onChange={(e) => handleInputChange("height", e.target.value)} className={`${inputStyles} ${errors.height ? "border-red-500" : ""}`} placeholder="175" />
                                <Select value={formData.heightUnit} onValueChange={(value: "cm" | "ft") => handleInputChange("heightUnit", value)}>
                                    <SelectTrigger className={`${selectTriggerStyles} w-24`}><SelectValue /></SelectTrigger>
                                    <SelectContent className={selectContentStyles}>
                                        <SelectItem value="cm">cm</SelectItem>
                                        <SelectItem value="ft">ft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.height && <p className="text-sm text-red-500">{errors.height}</p>}
                        </div>
                        {/* Weight */}
                        <div className="space-y-2">
                            <Label htmlFor="weight" className="text-[#EEEFA8]">Weight *</Label>
                             <div className="flex gap-2">
                                <Input id="weight" type="number" value={formData.weight} onChange={(e) => handleInputChange("weight", e.target.value)} className={`${inputStyles} ${errors.weight ? "border-red-500" : ""}`} placeholder="70" />
                                <Select value={formData.weightUnit} onValueChange={(value: "kg" | "lbs") => handleInputChange("weightUnit", value)}>
                                    <SelectTrigger className={`${selectTriggerStyles} w-24`}><SelectValue /></SelectTrigger>
                                    <SelectContent className={selectContentStyles}>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lbs">lbs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.weight && <p className="text-sm text-red-500">{errors.weight}</p>}
                        </div>
                    </div>
                    {/* BMI Display */}
                    {bmi && (
                        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#EEEFA8] flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> Body Mass Index (BMI):
                                </span>
                                <span className={`font-medium ${bmiInfo?.color}`}>{bmi} - {bmiInfo?.category}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* Health Questionnaire */}
            <Card className="border-white/10 bg-[#014f86] shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-[#FAF9F6]">Health Questionnaire</CardTitle>
                    <CardDescription className="text-[#EEEFA8]/80">Please answer all questions honestly for your safety.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {healthQuestions.map(item => (
                        <div key={item.id} className="space-y-3 border-b border-white/10 pb-6 last:border-b-0 last:pb-0">
                            <Label className="text-base font-medium text-[#FAF9F6]">{item.question}</Label>
                            <RadioGroup value={formData[item.field as keyof CombinedFormData]} onValueChange={(value) => handleInputChange(item.field as keyof CombinedFormData, value)} className="text-[#EEEFA8]">
                                {item.options.map(option => (<div key={option.value} className="flex items-center space-x-2"><RadioGroupItem value={option.value} id={`${item.id}-${option.value}`} className="border-white/20 data-[state=checked]:border-[#DDD92A] data-[state=checked]:text-[#DDD92A]" /><Label htmlFor={`${item.id}-${option.value}`}>{option.label}</Label></div>))}
                            </RadioGroup>
                            {item.detailsField && (formData[item.field as keyof CombinedFormData].startsWith('yes')) && (
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor={`${item.id}Details`} className="text-[#EEEFA8]">Please specify details *</Label>
                                    <Textarea id={`${item.id}Details`} value={formData[item.detailsField as keyof CombinedFormData]} onChange={(e) => handleInputChange(item.detailsField as keyof CombinedFormData, e.target.value)} className={`${inputStyles} ${errors[item.detailsField] ? "border-red-500" : ""}`} placeholder={item.detailsPlaceholder} />
                                    {errors[item.detailsField] && <p className="text-sm text-red-500">{errors[item.detailsField]}</p>}
                                </div>
                            )}
                            {errors[item.field] && <p className="text-sm text-red-500">{errors[item.field]}</p>}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Declaration & Background */}
            <Card className="border-white/10 bg-[#014f86] shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-[#FAF9F6]">Declaration & Background</CardTitle>
                <CardDescription className="text-[#EEEFA8]/80">This information is required for administrative verification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {policeRecordQuestions.map(item => (
                  <div key={item.id} className="space-y-3 border-b border-white/10 pb-6 last:border-b-0 last:pb-0">
                    <Label className="text-base font-medium text-[#FAF9F6]">{item.question}</Label>
                    <RadioGroup value={formData[item.field as keyof CombinedFormData]} onValueChange={(value) => handleInputChange(item.field as keyof CombinedFormData, value)} className="text-[#EEEFA8]">
                      {item.options.map(option => (<div key={option.value} className="flex items-center space-x-2"><RadioGroupItem value={option.value} id={`${item.id}-${option.value}`} className="border-white/20 data-[state=checked]:border-[#DDD92A] data-[state=checked]:text-[#DDD92A]" /><Label htmlFor={`${item.id}-${option.value}`}>{option.label}</Label></div>))}
                    </RadioGroup>
                    {item.detailsField && (formData[item.field as keyof CombinedFormData] === 'yes') && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor={`${item.id}Details`} className="text-[#EEEFA8]">Please specify details *</Label>
                        <Textarea id={`${item.id}Details`} value={formData[item.detailsField as keyof CombinedFormData]} onChange={(e) => handleInputChange(item.detailsField as keyof CombinedFormData, e.target.value)} className={`${inputStyles} ${errors[item.detailsField] ? "border-red-500" : ""}`} placeholder={item.detailsPlaceholder} />
                        {errors[item.detailsField] && <p className="text-sm text-red-500">{errors[item.detailsField]}</p>}
                      </div>
                    )}
                    {errors[item.field] && <p className="text-sm text-red-500">{errors[item.field]}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-center pt-4">
 <Button type="submit" size="lg" disabled={isLoading} className="...">
               {isLoading ? 'Submitting...' : 'Complete Assessment'}
                <ArrowRight className="h-5 w-5 ml-2" />
               </Button>
                        </div>
            </form>
        </div>
      </div>
    </TooltipProvider>
)
}