"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, ArrowLeft, Loader2, CheckCircle } from "lucide-react"

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
];

// Mock data for districts, specifically for Odisha as requested
const mockDistricts: Record<string, string[]> = {
    "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Keonjhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"]
};

// A simple OTP Modal component for demonstration
const OTPModal = ({ isOpen, onClose, phoneNumber, onVerified }: { isOpen: boolean, onClose: () => void, phoneNumber: string, onVerified: () => void }) => {
    if (!isOpen) return null;
    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleVerify = () => {
        setVerifying(true);
        setTimeout(() => {
            setIsVerified(true);
            setVerifying(false);
            // Redirect after showing the success message for a moment
            setTimeout(() => {
                onVerified();
                onClose();
            }, 2000);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm bg-[#014f86] border-white/10 text-[#FAFDF6]">
                <CardHeader>
                    <CardTitle>{isVerified ? "Verification Successful" : "Verify Phone Number"}</CardTitle>
                    {!isVerified && (
                        <CardDescription className="text-[#EEEFA8]">
                            An OTP has been sent to +91 {phoneNumber}.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {isVerified ? (
                        <div className="flex flex-col items-center space-y-3 text-center">
                            <CheckCircle className="h-12 w-12 text-green-400" />
                            <p className="font-semibold text-green-400">Phone number verified!</p>
                            <p className="text-sm text-[#EEEFA8]">You will be redirected to the login page shortly.</p>
                        </div>
                    ) : (
                        <>
                            <Input 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP" 
                                className="bg-black/20 border-white/20 text-[#FAFDF6] focus:ring-[#DDD92A] focus:border-[#DDD92A] text-center" 
                                maxLength={6}
                                disabled={verifying}
                            />
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={onClose} className="w-full border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10 bg-transparent">Cancel</Button>
                                <Button onClick={handleVerify} className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32]" disabled={verifying}>
                                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};


export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    gmail: "",
    aadhaar: "",
    phone: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
    city: "",
    pincode: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showOTP, setShowOTP] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  
  const [districts, setDistricts] = useState<string[]>([]);
  const [isFetchingDistricts, setIsFetchingDistricts] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);


  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required"
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.aadhaar.trim() || !/^\d{12}$/.test(formData.aadhaar.replace(/\s/g, ""))) newErrors.aadhaar = "Aadhaar must be 12 digits"
    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Enter a valid 10-digit mobile number"
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    if (!formData.state) newErrors.state = "State is required"
    if (!formData.district.trim()) newErrors.district = "District is required"
    if (!formData.city.trim()) newErrors.city = "City/Village is required"
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) newErrors.pincode = "Pin code must be 6 digits"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackMessage(null); 
    
    if (validateForm()) {
      setIsLoading(true)
      setFeedbackMessage("Registering your account...");
      setTimeout(() => {
        setIsLoading(false);
        setFeedbackMessage("Registration successful! Proceeding to phone verification...");
        setTimeout(() => setShowOTP(true), 1000);
      }, 2000);
    } else {
      setFeedbackMessage("Please fix the errors highlighted in red before submitting.");
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleStateChange = (stateName: string) => {
    setFormData(prev => ({ ...prev, state: stateName, district: "" }));
    if (errors.state) setErrors(prev => ({...prev, state: ""}));

    if (stateName === "Odisha") {
        setIsFetchingDistricts(true);
        setTimeout(() => {
            setDistricts(mockDistricts.Odisha);
            setShowDistrictDropdown(true);
            setIsFetchingDistricts(false);
        }, 500);
    } else {
        setShowDistrictDropdown(false);
        setDistricts([]);
    }
  };

  const formatAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12)
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
  }

  const inputStyles = "bg-black/20 border-white/20 text-[#FAFDF6] focus:ring-[#DDD92A] focus:border-[#DDD92A]";

  return (
    <div className="min-h-screen bg-[#013a63] py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
            <a href="/" className="flex items-center space-x-2 text-[#EAE151] hover:text-[#DDD92A]">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
            </a>
            <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-[#DDD92A]" />
                <span className="font-bold text-[#FAFDF6]">Team Sankalp</span>
            </div>
        </div>

        <Card className="border-white/10 bg-[#014f86] shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-[#FAFDF6]">Create Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#FAFDF6] border-b border-white/10 pb-2">Account Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#EEEFA8]">Full Name *</Label>
                  <Input id="fullName" value={formData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} placeholder="Enter Full Name" className={`${inputStyles} ${errors.fullName ? "border-red-500" : ""}`} />
                  {errors.fullName && <p className="text-sm text-red-400">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#EEEFA8]">Username *</Label>
                  <Input id="username" value={formData.username} onChange={(e) => handleInputChange("username", e.target.value)} placeholder="Enter a username" className={`${inputStyles} ${errors.username ? "border-red-500" : ""}`} />
                  {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gmail" className="text-[#EEEFA8]">Gmail <span className="text-sm text-gray-400">(Optional)</span></Label>
                  <Input id="gmail" type="email" value={formData.gmail} onChange={(e) => handleInputChange("gmail", e.target.value)} placeholder="your.email@example.com" className={inputStyles} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar" className="text-[#EEEFA8]">Aadhaar Number *</Label>
                    <Input id="aadhaar" value={formatAadhaar(formData.aadhaar)} onChange={(e) => handleInputChange("aadhaar", e.target.value.replace(/\s/g, ""))} placeholder="xxxx xxxx xxxx" maxLength={14} className={`${inputStyles} ${errors.aadhaar ? "border-red-500" : ""}`} />
                    {errors.aadhaar && <p className="text-sm text-red-400">{errors.aadhaar}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#EEEFA8]">Phone Number *</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile" maxLength={10} className={`${inputStyles} ${errors.phone ? "border-red-500" : ""}`} />
                    {errors.phone && <p className="text-sm text-red-400">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#FAFDF6] border-b border-white/10 pb-2">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-[#EEEFA8]">State *</Label>
                    <Select value={formData.state} onValueChange={handleStateChange}>
                      <SelectTrigger className={`${inputStyles} ${errors.state ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#014f86] border-white/20 text-[#FAFDF6]">
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state} className="focus:bg-black/20 focus:text-[#FAFDF6]">{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-red-400">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-[#EEEFA8]">District *</Label>
                    {showDistrictDropdown ? (
                       <Select
                        value={formData.district}
                        onValueChange={(value) => handleInputChange("district", value)}
                        disabled={isFetchingDistricts}
                      >
                        <SelectTrigger className={`${inputStyles} ${errors.district ? "border-red-500" : ""}`}>
                          <SelectValue placeholder={isFetchingDistricts ? "Loading..." : "Select your district"} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#014f86] border-white/20 text-[#FAFDF6]">
                          {districts.map((district) => (
                            <SelectItem key={district} value={district} className="focus:bg-black/20 focus:text-[#FAFDF6]">{district}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => handleInputChange("district", e.target.value)}
                        className={`${inputStyles} ${errors.district ? "border-red-500" : ""}`}
                        placeholder="Enter district name"
                        disabled={!formData.state}
                      />
                    )}
                    {errors.district && <p className="text-sm text-red-400">{errors.district}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[#EEEFA8]">Village/City *</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} className={`${inputStyles} ${errors.city ? "border-red-500" : ""}`} placeholder="Enter village or city name" />
                    {errors.city && <p className="text-sm text-red-400">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-[#EEEFA8]">Pin Code *</Label>
                    <Input id="pincode" value={formData.pincode} onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputStyles} ${errors.pincode ? "border-red-500" : ""}`} placeholder="6-digit pincode" maxLength={6} />
                    {errors.pincode && <p className="text-sm text-red-400">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#FAFDF6] border-b border-white/10 pb-2">Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#EEEFA8]">Password *</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} className={`${inputStyles} ${errors.password ? "border-red-500" : ""}`} placeholder="Minimum 8 characters" />
                    {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#EEEFA8]">Confirm Password *</Label>
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} className={`${inputStyles} ${errors.confirmPassword ? "border-red-500" : ""}`} placeholder="Re-enter your password" />
                    {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {feedbackMessage && (
                <div className={`border rounded-lg p-4 text-center ${ feedbackMessage.includes("successful") || feedbackMessage.includes("Registering") ? "bg-green-900/50 border-green-500/50" : "bg-red-900/50 border-red-500/50" }`}>
                  <p className={`text-sm ${feedbackMessage.includes("successful") || feedbackMessage.includes("Registering") ? "text-green-400" : "text-red-400"}`}>{feedbackMessage}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold py-3" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account & Verify Phone"}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-[#FAF9F6]/70">
                Already have an account?{" "}
                <a href="/login" className="text-[#DDD92A] hover:underline font-medium">
                  Sign in here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <OTPModal 
        isOpen={showOTP} 
        onClose={() => setShowOTP(false)} 
        phoneNumber={formData.phone} 
        onVerified={() => { window.location.href = "/login" }} 
      />
    </div>
  )
}

