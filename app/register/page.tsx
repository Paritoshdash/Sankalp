"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { OTPModal } from "@/components/otp-modal"
import { useRouter } from "next/navigation"

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
]

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
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [districts, setDistricts] = useState<string[]>([]);
  const [isFetchingDistricts, setIsFetchingDistricts] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required"
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.aadhaar.trim() || !/^\d{12}$/.test(formData.aadhaar.replace(/\s/g, ""))) newErrors.aadhaar = "Aadhaar must be exactly 12 digits"
    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Enter a valid 10-digit Indian mobile number"
    if (!formData.password || formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    if (!formData.state) newErrors.state = "State is required"
    if (!formData.district.trim()) newErrors.district = "District is required"
    if (!formData.city.trim()) newErrors.city = "City/Village is required"
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) newErrors.pincode = "Pin code must be 6 digits"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsLoading(true)
      setSuccessMessage(null)
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            username: formData.username,
            gmail: formData.gmail,
            aadhaar: formData.aadhaar.replace(/\s/g, ""),
            phone: formData.phone,
            password: formData.password,
            state: formData.state,
            district: formData.district,
            city: formData.city,
            pincode: formData.pincode,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed.');
        
        setIsLoading(false);
        setSuccessMessage("Registration successful! Proceeding to phone verification...");
        setTimeout(() => setShowOTP(true), 1000);
      } catch (error: any) {
        setIsLoading(false)
        setSuccessMessage(error.message || "Registration failed. Please try again.")
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleStateChange = async (stateName: string) => {
    setFormData(prev => ({ ...prev, state: stateName, district: "" }));
    setDistricts([]);
    if (errors.state) setErrors(prev => ({...prev, state: ""}));

    if (stateName) {
      setIsFetchingDistricts(true);
      try {
        const response = await fetch(`/api/locations/districts?state=${encodeURIComponent(stateName)}`);
        const data = await response.json();
        setDistricts(data.districts || []);
      } catch (error) {
        console.error("Failed to fetch districts", error);
        setDistricts([]);
      } finally {
        setIsFetchingDistricts(false);
      }
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
            <Link href="/" className="flex items-center space-x-2 text-[#EAE151] hover:text-[#DDD92A]">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
            </Link>
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
                  {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#EEEFA8]">Username *</Label>
                  <Input id="username" value={formData.username} onChange={(e) => handleInputChange("username", e.target.value)} placeholder="Enter a username" className={`${inputStyles} ${errors.username ? "border-red-500" : ""}`} />
                  {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gmail" className="text-[#EEEFA8]">Gmail <span className="text-sm text-gray-400">(Optional)</span></Label>
                  <Input id="gmail" type="email" value={formData.gmail} onChange={(e) => handleInputChange("gmail", e.target.value)} placeholder="GmailId" className={inputStyles} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar" className="text-[#EEEFA8]">Aadhaar Number *</Label>
                    <Input id="aadhaar" value={formatAadhaar(formData.aadhaar)} onChange={(e) => handleInputChange("aadhaar", e.target.value.replace(/\s/g, ""))} placeholder="12 Digit Aadhaar" maxLength={14} className={`${inputStyles} ${errors.aadhaar ? "border-red-500" : ""}`} />
                    {errors.aadhaar && <p className="text-sm text-red-500">{errors.aadhaar}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#EEEFA8]">Phone Number *</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))} placeholder="10 Digit No." maxLength={10} className={`${inputStyles} ${errors.phone ? "border-red-500" : ""}`} />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
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
                      <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state} className="focus:bg-black/20 focus:text-[#FAFDF6]">{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-[#EEEFA8]">District *</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => handleInputChange("district", value)}
                      disabled={!formData.state || isFetchingDistricts || districts.length === 0}
                    >
                      <SelectTrigger className={`${inputStyles} ${errors.district ? "border-red-500" : ""}`}>
                        <SelectValue placeholder={ isFetchingDistricts ? "Loading districts..." : !formData.state ? "Select a state first" : "Select your district" } />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                        {districts.map((district) => (
                          <SelectItem key={district} value={district} className="focus:bg-black/20 focus:text-[#FAFDF6]">{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.district && <p className="text-sm text-red-500">{errors.district}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[#EEEFA8]">Village/City *</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} className={`${inputStyles} ${errors.city ? "border-red-500" : ""}`} placeholder="Enter village or city name" />
                    {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-[#EEEFA8]">Pin Code *</Label>
                    <Input id="pincode" value={formData.pincode} onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputStyles} ${errors.pincode ? "border-red-500" : ""}`} placeholder="Pincode" maxLength={6} />
                    {errors.pincode && <p className="text-sm text-red-500">{errors.pincode}</p>}
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
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#EEEFA8]">Confirm Password *</Label>
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} className={`${inputStyles} ${errors.confirmPassword ? "border-red-500" : ""}`} placeholder="Re-enter your password" />
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {successMessage && (
                <div className={`border rounded-lg p-4 ${ successMessage.includes("successful") ? "bg-black/20 border-[#DDD92A]/50" : "bg-red-900/50 border-red-500/50" }`}>
                  <p className={`text-sm ${successMessage.includes("successful") ? "text-[#DDD92A]" : "text-red-400"}`}>{successMessage}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32] font-semibold py-3" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account & Verify Phone"}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-gray-400">
                Already have an account? <Link href="/login" className="text-[#DDD92A] hover:underline font-medium">Sign in here</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <OTPModal isOpen={showOTP} onClose={() => setShowOTP(false)} phoneNumber={formData.phone} onVerified={() => router.push("/login")} />
    </div>
  )
}