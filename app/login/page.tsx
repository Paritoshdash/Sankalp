"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setLoginError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginError(data.message || 'Login failed. Please try again.')
        return
      }

      // Store user in localStorage (existing session pattern)
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      if (data.session) {
        localStorage.setItem('supabaseSession', JSON.stringify(data.session))
      }
      setSuccessMessage('Login successful! Redirecting…')
      setTimeout(() => { window.location.href = '/sports-selection' }, 800)

    } catch {
      setLoginError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const inputStyles = "bg-black/20 border-white/20 text-[#FAF9F6] focus:ring-[#DDD92A] focus:border-[#DDD92A]"

  return (
    <div className="min-h-screen bg-[#013a63] flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="flex items-center space-x-2 text-[#EAE151] hover:text-[#DDD92A]">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </a>
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-[#DDD92A]" />
            <span className="font-bold text-[#FAF9F6]">Team Sankalp</span>
          </div>
        </div>

        <Card className="border-white/10 bg-[#014f86] shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-[#FAF9F6]">Welcome Back</CardTitle>
            <CardDescription className="text-[#EEEFA8]">Sign in to your athlete performance account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#EEEFA8]">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className={`${inputStyles} ${errors.username ? "border-red-500" : ""}`}
                  placeholder="Enter your username"
                />
                {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#EEEFA8]">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`${inputStyles} ${errors.password ? "border-red-500" : ""} pr-10`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#FAF9F6]/70 hover:text-[#FAF9F6]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
              </div>

              {successMessage && (
                <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4">
                  <p className="text-sm text-green-400">{successMessage}</p>
                </div>
              )}

              {loginError && !successMessage && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4">
                  <p className="text-sm text-red-400">{loginError}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <a href="/forgot-password" className="text-sm text-[#EEEFA8] hover:underline hover:text-[#EEEFA8]">
                  Forgot your password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold py-3"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-[#FAF9F6]/70">
                Don't have an account?{" "}
                <a href="/register" className="text-[#DDD92A] hover:underline font-medium">
                  Create one here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

