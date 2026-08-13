"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Trophy, Users, Download, FileText, Filter, Search,
  BarChart3, Medal, MapPin, CheckCircle, XCircle, Clock, Eye, Loader2, RefreshCw,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AthleteProfile {
  id: string
  userId: number
  fullName: string
  sport: string
  state: string
  district: string
  registrationDate: string
  validationStatus: "Validated" | "Pending" | "Rejected" | "Under Review"
  excellenceScore: number
  fitnessScore: number
  videoAnalysisScore: number
  overallScore: number
  tier: "Beginner" | "Intermediate" | "Advanced"
  age: number | null
  phone: string
  email: string
  healthStatus: "Cleared" | "Medical Review Required" | "Blocked"
  techniqueScore: number | null
  performanceScore: number | null
  analysisTimestamp: string | null
  modelVersion: string | null
  videoMetricsJson: Record<string, any> | null
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  pages: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SPORTS = ["All Sports", "100m Running", "High Jump", "Javelin Throw", "Long Jump", "Shot Put", "Archery", "Shooting"]
const STATES = ["All States", "Andhra Pradesh", "Delhi", "Gujarat", "Karnataka", "Maharashtra", "Odisha", "Punjab", "Telangana", "Uttar Pradesh"]

// ── Color helpers ─────────────────────────────────────────────────────────────

const statusColor = (s: string) => {
  switch (s) {
    case "Validated":    return "bg-green-900/50 text-green-300 border-green-500/30"
    case "Pending":      return "bg-yellow-900/50 text-yellow-300 border-yellow-500/30"
    case "Rejected":     return "bg-red-900/50 text-red-300 border-red-500/30"
    case "Under Review": return "bg-blue-900/50 text-blue-300 border-blue-500/30"
    default:             return "bg-gray-700 text-gray-300 border-gray-500/30"
  }
}

const healthColor = (s: string) => {
  switch (s) {
    case "Cleared":                 return "bg-green-900/50 text-green-300 border-green-500/30"
    case "Medical Review Required": return "bg-orange-900/50 text-orange-300 border-orange-500/30"
    case "Blocked":                 return "bg-red-900/50 text-red-300 border-red-500/30"
    default:                        return "bg-gray-700 text-gray-300 border-gray-500/30"
  }
}

const tierColor = (t: string) => {
  switch (t) {
    case "Advanced":     return "bg-[#DDD92A] text-[#2D2A32] font-semibold"
    case "Intermediate": return "bg-[#EAE151] text-[#2D2A32] font-semibold"
    default:             return "bg-white/10 text-[#EEEFA8]"
  }
}

const statusIcon = (s: string) => {
  if (s === "Validated") return <CheckCircle className="h-4 w-4 text-green-500" />
  if (s === "Rejected")  return <XCircle className="h-4 w-4 text-red-500" />
  return <Clock className="h-4 w-4 text-yellow-500" />
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [athletes, setAthletes]     = useState<AthleteProfile[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [searchTerm,      setSearchTerm]      = useState("")
  const [selectedSport,   setSelectedSport]   = useState("All Sports")
  const [selectedState,   setSelectedState]   = useState("All States")
  const [selectedStatus,  setSelectedStatus]  = useState("All Status")
  const [currentPage,     setCurrentPage]     = useState(1)
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null)

  const fetchAthletes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedSport !== "All Sports") params.set("sport", selectedSport)
      if (selectedState !== "All States") params.set("state", selectedState)
      if (selectedStatus !== "All Status") params.set("status", selectedStatus)
      if (searchTerm) params.set("search", searchTerm)
      params.set("page", String(currentPage))
      params.set("limit", "50")

      const res = await fetch(`/api/admin/athletes?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAthletes(data.athletes || [])
      setPagination(data.pagination || null)
    } catch (err: any) {
      setError("Failed to load athlete data. Is the database running?")
      setAthletes([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedSport, selectedState, selectedStatus, searchTerm, currentPage])

  useEffect(() => {
    fetchAthletes()
  }, [fetchAthletes])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSport, selectedState, selectedStatus, searchTerm])

  const handleExportCSV = () => {
    const headers = ["ID","Name","Sport","State","District","Status","Excellence","Fitness","Video","Overall","Tier","Health"]
    const rows = athletes.map(a => [
      a.id, a.fullName, a.sport, a.state, a.district,
      a.validationStatus,
      a.excellenceScore, a.fitnessScore, a.videoAnalysisScore, a.overallScore,
      a.tier, a.healthStatus,
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sankalp_athletes_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadReport = (athlete: AthleteProfile) => {
    const warnings = athlete.videoMetricsJson ? [] : ["No video analysis performed yet."]
    const metricsSection = athlete.videoMetricsJson
      ? Object.entries(athlete.videoMetricsJson)
          .map(([k, v]: [string, any]) =>
            `  ${k.replace(/_/g, " ")}: ${v?.value ?? "N/A"} ${v?.unit ?? ""} (confidence: ${((v?.confidence ?? 0) * 100).toFixed(0)}%)`
          ).join("\n")
      : "  No video metrics available."

    const report = `
ATHLETE PERFORMANCE REPORT — TEAM SANKALP
==========================================
Athlete ID : ${athlete.id}
Name       : ${athlete.fullName}
Sport      : ${athlete.sport}
Age        : ${athlete.age ?? "N/A"}
Location   : ${athlete.district}, ${athlete.state}
Phone      : ${athlete.phone}

SCORES
------
Excellence Score   : ${athlete.excellenceScore.toFixed(1)}/100
Fitness Score      : ${athlete.fitnessScore.toFixed(1)}/100
Video Analysis     : ${athlete.videoAnalysisScore.toFixed(1)}/100
  Technique Score  : ${athlete.techniqueScore?.toFixed(1) ?? "N/A"}
  Performance Score: ${athlete.performanceScore?.toFixed(1) ?? "N/A"}
Overall Score      : ${athlete.overallScore.toFixed(1)}/100
Tier               : ${athlete.tier}

VIDEO METRICS
-------------
${metricsSection}

HEALTH & STATUS
---------------
Health Status      : ${athlete.healthStatus}
Validation Status  : ${athlete.validationStatus}

MODEL INFO
----------
Model Version      : ${athlete.modelVersion ?? "N/A"}
Analysis Timestamp : ${athlete.analysisTimestamp ?? "N/A"}

NOTES
-----
${warnings.join("\n") || "None."}

Generated: ${new Date().toISOString()}
Team Sankalp — Athlete Performance Analysis System
`.trim()

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${athlete.fullName.replace(/\s+/g, "_")}_report_${athlete.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total:     athletes.length,
    validated: athletes.filter(a => a.validationStatus === "Validated").length,
    pending:   athletes.filter(a => ["Pending", "Under Review"].includes(a.validationStatus)).length,
    advanced:  athletes.filter(a => a.tier === "Advanced").length,
  }

  const inputStyles = "bg-black/20 border-white/20 text-[#FAFDF6] focus:ring-[#DDD92A] focus:border-[#DDD92A]"

  return (
    <div className="min-h-screen bg-[#013a63] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-[#DDD92A]" />
            <div>
              <h1 className="text-3xl font-bold text-[#FAFDF6]">Athlete Leaderboard</h1>
              <p className="text-[#EEEFA8]">Sports Authority of India — Athlete Management System</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAthletes} variant="outline" className="bg-transparent border-white/20 text-white/70 hover:bg-white/10">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={handleExportCSV} className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32] font-semibold">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,    label: "Total Athletes",   value: pagination?.total ?? stats.total },
            { icon: CheckCircle, label: "Validated",     value: stats.validated },
            { icon: Clock,    label: "Pending Review",   value: stats.pending },
            { icon: Medal,    label: "Advanced Tier",    value: stats.advanced },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-white/10 bg-black/20">
              <CardContent className="p-5">
                <div className="flex items-center space-x-3">
                  <Icon className="h-7 w-7 text-[#DDD92A]" />
                  <div>
                    <div className="text-2xl font-bold text-[#FAFDF6]">{value}</div>
                    <div className="text-xs text-[#EEEFA8]">{label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-white/10 bg-[#014f86] shadow-lg mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#FAFDF6] flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-[#EEEFA8]">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Name or ID…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`pl-9 ${inputStyles}`}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#EEEFA8]">Sport</Label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                    {SPORTS.map(s => <SelectItem key={s} value={s} className="focus:bg-black/20">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#EEEFA8]">State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                    {STATES.map(s => <SelectItem key={s} value={s} className="focus:bg-black/20">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#EEEFA8]">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                    {["All Status","Validated","Pending","Under Review","Rejected"].map(s => (
                      <SelectItem key={s} value={s} className="focus:bg-black/20">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(""); setSelectedSport("All Sports"); setSelectedState("All States"); setSelectedStatus("All Status") }}
                  className="w-full bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-white/10 bg-[#014f86] shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#FAFDF6]">
              Athlete Profiles
              {pagination && <span className="text-sm font-normal text-[#EEEFA8] ml-2">({pagination.total} total)</span>}
            </CardTitle>
            <CardDescription className="text-[#EEEFA8]">Ranked by overall score (descending)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 text-[#DDD92A] animate-spin" />
                <span className="ml-3 text-[#EEEFA8]">Loading athletes from database…</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-300">{error}</p>
              </div>
            ) : athletes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <p className="text-[#FAFDF6]">No athletes found</p>
                <p className="text-[#EEEFA8] text-sm mt-1">Try adjusting filters, or complete athlete registrations first.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-white/10">
                      {["Athlete","Sport","Location","Status","Health","Overall Score","Tier","Actions"].map(h => (
                        <TableHead key={h} className="text-[#EEEFA8]">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {athletes.map(a => (
                      <TableRow key={a.id} className="border-b-white/10 hover:bg-black/20">
                        <TableCell>
                          <div className="font-medium text-[#FAFDF6]">{a.fullName}</div>
                          <div className="text-xs text-gray-400">{a.id}</div>
                          {a.age && <div className="text-xs text-gray-500">Age: {a.age}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#EAE151]/50 text-[#EAE151]">
                            {a.sport || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-[#FAFDF6]">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                            <span>{a.district || "—"}</span>
                          </div>
                          <div className="text-xs text-gray-500">{a.state}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {statusIcon(a.validationStatus)}
                            <Badge className={statusColor(a.validationStatus)}>{a.validationStatus}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={healthColor(a.healthStatus)}>{a.healthStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-28">
                            <div className="flex justify-between text-xs text-[#EEEFA8] mb-1">
                              <span className="font-semibold text-[#FAFDF6]">{a.overallScore.toFixed(1)}</span>
                              <span>/100</span>
                            </div>
                            <Progress value={a.overallScore} className="h-1.5 bg-black/30 [&>div]:bg-[#DDD92A]" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={tierColor(a.tier)}>{a.tier}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedAthlete(a)}
                              className="bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10">
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                            <Button size="sm" onClick={() => handleDownloadReport(a)}
                              className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32]">
                              <Download className="h-3 w-3 mr-1" /> Report
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-[#EEEFA8]">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="bg-transparent border-white/20 text-white/70"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        disabled={currentPage >= pagination.pages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="bg-transparent border-white/20 text-white/70"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Athlete Detail Modal ── */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#2D2A32] border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-[#FAFDF6]">{selectedAthlete.fullName}</CardTitle>
                <Button variant="outline" onClick={() => setSelectedAthlete(null)}
                  className="bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10">
                  Close
                </Button>
              </div>
              <CardDescription className="text-[#EEEFA8]">
                {selectedAthlete.id} · {selectedAthlete.sport || "No sport selected"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal info */}
                <div>
                  <h4 className="font-medium text-[#FAFDF6] mb-3">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Age",       selectedAthlete.age ? `${selectedAthlete.age} years` : "N/A"],
                      ["Location",  `${selectedAthlete.district}, ${selectedAthlete.state}`],
                      ["Phone",     selectedAthlete.phone || "—"],
                      ["Registered",selectedAthlete.registrationDate || "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-400">{k}</span>
                        <span className="font-medium text-[#FAFDF6]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scores */}
                <div>
                  <h4 className="font-medium text-[#FAFDF6] mb-3">Performance Scores</h4>
                  <div className="space-y-3">
                    {[
                      ["Excellence",      selectedAthlete.excellenceScore],
                      ["Fitness",         selectedAthlete.fitnessScore],
                      ["Video Analysis",  selectedAthlete.videoAnalysisScore],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#EEEFA8]">{label}</span>
                          <span className="font-medium text-[#FAFDF6]">{Number(value).toFixed(1)}%</span>
                        </div>
                        <Progress value={Number(value)} className="h-1.5 bg-black/30 [&>div]:bg-[#DDD92A]" />
                      </div>
                    ))}
                    {selectedAthlete.techniqueScore !== null && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#EEEFA8]">Technique</span>
                          <span className="font-medium text-[#FAFDF6]">{selectedAthlete.techniqueScore?.toFixed(1)}%</span>
                        </div>
                        <Progress value={selectedAthlete.techniqueScore ?? 0} className="h-1.5 bg-black/20 [&>div]:bg-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Video metrics detail */}
              {selectedAthlete.videoMetricsJson && (
                <div>
                  <h4 className="font-medium text-[#FAFDF6] mb-3">Video Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedAthlete.videoMetricsJson)
                      .filter(([, v]: any) => v?.value !== null && v?.value !== undefined)
                      .map(([k, v]: any) => (
                        <div key={k} className="bg-black/20 rounded p-2 text-xs">
                          <p className="text-[#EEEFA8]/60">{k.replace(/_/g, " ")}</p>
                          <p className="text-[#FAFDF6] font-mono">{typeof v.value === "number" ? v.value.toFixed(2) : v.value} {v.unit || ""}</p>
                          <p className="text-[#EEEFA8]/40">{Math.round((v.confidence ?? 0) * 100)}% conf</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-[#DDD92A]">{selectedAthlete.overallScore.toFixed(1)}</div>
                  <div className="text-xs text-[#EEEFA8]">Overall Score</div>
                </div>
                <div className="p-3 bg-black/20 rounded-lg flex flex-col justify-center items-center">
                  <Badge className={tierColor(selectedAthlete.tier)}>{selectedAthlete.tier}</Badge>
                  <div className="text-xs text-[#EEEFA8] mt-1">Tier</div>
                </div>
                <div className="p-3 bg-black/20 rounded-lg flex flex-col justify-center items-center">
                  <Badge className={healthColor(selectedAthlete.healthStatus)}>{selectedAthlete.healthStatus}</Badge>
                  <div className="text-xs text-[#EEEFA8] mt-1">Health</div>
                </div>
              </div>

              {selectedAthlete.modelVersion && (
                <p className="text-xs text-[#EEEFA8]/40 text-center">
                  Model v{selectedAthlete.modelVersion} · {selectedAthlete.analysisTimestamp || "Not analyzed yet"}
                </p>
              )}

              <div className="flex gap-3">
                <Button onClick={() => handleDownloadReport(selectedAthlete)}
                  className="flex-1 bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32] font-semibold">
                  <FileText className="h-4 w-4 mr-2" /> Download Report
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10">
                  <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
