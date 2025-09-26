"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, RefreshCw } from "lucide-react"

interface OTPModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
  onVerified: () => void
}

export function OTPModal({ isOpen, onClose, phoneNumber, onVerified }: OTPModalProps) {
  const [otp, setOtp] = useState("")
  const [generatedOTP, setGeneratedOTP] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)

  // Generate random OTP when modal opens
  useEffect(() => {
    if (isOpen) {
      const newOTP = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOTP(newOTP)
      setTimeLeft(300)
      setCanResend(false)
      setOtp("")
      setError("")
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setCanResend(true)
    }
  }, [isOpen, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleVerify = () => {
    if (otp === generatedOTP) {
      setIsVerifying(true)
      setTimeout(() => {
        setIsVerifying(false)
        onVerified()
      }, 1000)
    } else {
      setError("Invalid OTP. Please check and try again.")
    }
  }

  const handleResend = () => {
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOTP(newOTP)
    setTimeLeft(300)
    setCanResend(false)
    setOtp("")
    setError("")
  }

  const formatPhoneNumber = (phone: string) => {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#2D2A32] border-white/10 text-[#FAFDF6]">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-black/20 rounded-full flex items-center justify-center">
            <Phone className="h-6 w-6 text-[#DDD92A]" />
          </div>
          <DialogTitle className="text-xl font-semibold text-[#FAFDF6]">Verify Your Phone Number</DialogTitle>
          <DialogDescription className="text-[#EEEFA8]">
            We've sent a 6-digit verification code to
            <br />
            <span className="font-medium text-[#FAFDF6]">{formatPhoneNumber(phoneNumber)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Demo OTP Display */}
          <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-center">
            <p className="text-sm text-[#EEEFA8] mb-2">
              <strong></strong> Your OTP is
            </p>
            <p className="text-2xl font-bold text-[#FAFDF6] tracking-wider">{generatedOTP}</p>
            <p className="text-xs text-gray-400 mt-1">In production, this would be sent via SMS</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp" className="text-[#EEEFA8]">
              Enter 6-digit OTP
            </Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                setOtp(value)
                setError("")
              }}
              className={`text-center text-lg tracking-wider bg-black/20 border-white/20 text-[#FAFDF6] focus:ring-1 focus:ring-[#DDD92A] placeholder:text-gray-500 ${
                error ? "border-red-500" : ""
              }`}
              placeholder="000000"
              maxLength={6}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-[#EEEFA8]">
              Time remaining: <span className="font-medium text-[#DDD92A]">{formatTime(timeLeft)}</span>
            </p>

            {canResend ? (
              <Button variant="ghost" onClick={handleResend} className="text-[#DDD92A] hover:text-[#c8c426]">
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend OTP
              </Button>
            ) : (
              <p className="text-xs text-gray-400">
                Didn't receive the code? You can resend after the timer expires
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#EAE151] hover:bg-white/10 text-[#EAE151]"
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={otp.length !== 6 || isVerifying}
              className="flex-1 bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32] font-semibold"
            >
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}