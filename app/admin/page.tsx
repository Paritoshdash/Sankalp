"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Trophy,
  Users,
  Download,
  FileText,
  Filter,
  Search,
  BarChart3,
  Medal,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react"

interface AthleteProfile {
  id: string
  firstName: string
  lastName: string
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
  age: number
  phone: string
  email: string
  aadhaar: string
  healthStatus: "Cleared" | "Medical Review Required" | "Blocked"
}

const mockAthletes: AthleteProfile[] = [
    {
    id: "ATH001",
    firstName: "Karan",
    lastName: "Sahu",
    sport: "Javlien",
    state: "Odisha",
    district: "Sambalpur",
    registrationDate: "2025-09-20",
    validationStatus: "Validated",
    excellenceScore: 85,
    fitnessScore: 92,
    videoAnalysisScore: 88,
    overallScore: 88,
    tier: "Intermediate",
    age: 20,
    phone: "7735956170",
    email: "karansahu12@email.com",
    aadhaar: "9572-2115-2383",
    healthStatus: "Cleared",
  },
  // {
  //   id: "ATH002",
  //   firstName: "Piyush",
  //   lastName: "Pradhan",
  //   sport: "Javelin Throw",
  //   state: "Odisha",
  //   district: "Sambalpur",
  //   registrationDate: "2025-09-18",
  //   validationStatus: "Validated",
  //   excellenceScore: 78,
  //   fitnessScore: 85,
  //   videoAnalysisScore: 92,
  //   overallScore: 85,
  //   tier: "Intermediate",
  //   age: 20,
  //   phone: "9876543211",
  //   email: "piyushpradhan12@email.com",
  //   aadhaar: "2345-6789-0123",
  //   healthStatus: "Cleared",
  // },
  // {
  //   id: "ATH003",
  //   firstName: "Manish",
  //   lastName: "Sahoo",
  //   sport: "High Jump",
  //   state: "Odisha",
  //   district: "Sambalpur",
  //   registrationDate: "2024-01-20",
  //   validationStatus: "Under Review",
  //   excellenceScore: 72,
  //   fitnessScore: 88,
  //   videoAnalysisScore: 0,
  //   overallScore: 0,
  //   tier: "Advanced",
  //   age: 20,
  //   phone: "9876543212",
  //   email: "m.nsahoo@email.com",
  //   aadhaar: "3456-7890-1234",
  //   healthStatus: "Medical Review Required",
  // },
  // {
  //   id: "ATH004",
  //   firstName: "Riku",
  //   lastName: "Mishra",
  //   sport: "Shot Put",
  //   state: "Odisha",
  //   district: "Rourkela",
  //   registrationDate: "2024-01-22",
  //   validationStatus: "Validated",
  //   excellenceScore: 68,
  //   fitnessScore: 75,
  //   videoAnalysisScore: 82,
  //   overallScore: 75,
  //   tier: "Advanced",
  //   age: 20,
  //   phone: "9876543213",
  //   email: "rikumishra@email.com",
  //   aadhaar: "4567-8901-2345",
  //   healthStatus: "Cleared",
  // },
  // {
  //   id: "ATH005",
  //   firstName: "Priyadarshani",
  //   lastName: "Patro",
  //   sport: "Long Jump",
  //   state: "Odisha",
  //   district: "Gajpati",
  //   registrationDate: "2024-01-25",
  //   validationStatus: "Validated",
  //   excellenceScore: 45,
  //   fitnessScore: 0,
  //   videoAnalysisScore: 0,
  //   overallScore: 79,
  //   tier: "Beginner",
  //   age: 20,
  //   phone: "9876543214",
  //   email: "priyadarshanipatro14@email.com",
  //   aadhaar: "5678-9012-3456",
  //   healthStatus: "Cleared",
  // },
  // {
  //   id: "ATH006",
  //   firstName: "Karan",
  //   lastName: "Sahu",
  //   sport: "100m Running",
  //   state: "Odisha",
  //   district: "Jhasrsugada",
  //   registrationDate: "2024-01-28",
  //   validationStatus: "Rejected",
  //   excellenceScore: 35,
  //   fitnessScore: 0,
  //   videoAnalysisScore: 0,
  //   overallScore: 0,
  //   tier: "Beginner",
  //   age: 20,
  //   phone: "9876543215",
  //   email: "karansahoo32@email.com",
  //   aadhaar: "6789-0123-4567",
  //   healthStatus: "Cleared",
  // },
]

const indianStates = [
  "All States",
  "Andhra Pradesh",
  "Delhi",
  "Gujarat",
  "Karnataka",
  "Maharashtra",
  "Punjab",
  "Telangana",
  "Uttar Pradesh",
  "Odisha",
]

const sports = [
  "All Sports",
  "100m Running",
  "High Jump",
  "Javelin Throw",
  "Long Jump",
  "Shot Put",
  "Archery",
  "Shooting",
]

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSport, setSelectedSport] = useState("All Sports")
  const [selectedState, setSelectedState] = useState("All States")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null)

  const filteredAthletes = mockAthletes.filter((athlete) => {
    const matchesSearch =
      athlete.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSport = selectedSport === "All Sports" || athlete.sport === selectedSport
    const matchesState = selectedState === "All States" || athlete.state === selectedState
    const matchesStatus = selectedStatus === "All Status" || athlete.validationStatus === selectedStatus

    return matchesSearch && matchesSport && matchesState && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Validated":
        return "bg-green-900/50 text-green-300 border-green-500/30"
      case "Pending":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-500/30"
      case "Rejected":
        return "bg-red-900/50 text-red-300 border-red-500/30"
      case "Under Review":
        return "bg-blue-900/50 text-blue-300 border-blue-500/30"
      default:
        return "bg-gray-700 text-gray-300 border-gray-500/30"
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "Cleared":
        return "bg-green-900/50 text-green-300 border-green-500/30"
      case "Medical Review Required":
        return "bg-orange-900/50 text-orange-300 border-orange-500/30"
      case "Blocked":
        return "bg-red-900/50 text-red-300 border-red-500/30"
      default:
        return "bg-gray-700 text-gray-300 border-gray-500/30"
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Advanced":
        return "bg-[#DDD92A] text-[#2D2A32] font-semibold"
      case "Intermediate":
        return "bg-[#EAE151] text-[#2D2A32] font-semibold"
      case "Beginner":
        return "bg-white/10 text-[#EEEFA8]"
      default:
        return "bg-gray-700 text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Validated":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "Pending":
      case "Under Review":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
        ["ID", "Name", "Sport", "State", "District", "Status", "Excellence Score", "Fitness Score", "Video Score", "Overall Score", "Tier", "Health Status"],
        ...filteredAthletes.map((athlete) => [athlete.id, `${athlete.firstName} ${athlete.lastName}`, athlete.sport, athlete.state, athlete.district, athlete.validationStatus, athlete.excellenceScore, athlete.fitnessScore, athlete.videoAnalysisScore, athlete.overallScore, athlete.tier, athlete.healthStatus])
    ].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `athletes_report_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadReport = (athlete: AthleteProfile) => {
    const reportContent = `ATHLETE PERFORMANCE REPORT...` // content omitted for brevity
    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${athlete.firstName}_${athlete.lastName}_report.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = {
    total: mockAthletes.length,
    validated: mockAthletes.filter((a) => a.validationStatus === "Validated").length,
    pending: mockAthletes.filter((a) => a.validationStatus === "Pending" || a.validationStatus === "Under Review").length,
    advanced: mockAthletes.filter((a) => a.tier === "Advanced").length,
  }

  const inputStyles = "bg-black/20 border-white/20 text-[#FAFDF6] focus:ring-[#DDD92A] focus:border-[#DDD92A]"

  return (
    <div className="min-h-screen bg-[#013a63] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-[#DDD92A]" />
              <div>
                <h1 className="text-3xl font-bold text-[#FAFDF6]">User Leaderboard</h1>
                <p className="text-[#EEEFA8]">Sports Authority of India - Athlete Management System</p>
              </div>
            </div>
            <Button onClick={handleExportCSV} className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32] font-semibold">
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Users, label: "Total Athletes", value: stats.total },
            { icon: CheckCircle, label: "Validated", value: stats.validated },
            { icon: Clock, label: "Pending Review", value: stats.pending },
            { icon: Medal, label: "Advanced Tier", value: stats.advanced },
          ].map((stat, index) => (
            <Card key={index} className="border-white/10 bg-black/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <stat.icon className="h-8 w-8 text-[#DDD92A]" />
                  <div>
                    <div className="text-2xl font-bold text-[#FAFDF6]">{stat.value}</div>
                    <div className="text-sm text-[#EEEFA8]">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/10 bg-[#014f86] shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-[#FAFDF6] flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Athletes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-[#EEEFA8]">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${inputStyles}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#EEEFA8]">Sport</Label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                    {sports.map((sport) => (<SelectItem key={sport} value={sport} className="focus:bg-black/20">{sport}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#EEEFA8]">State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                    {indianStates.map((state) => (<SelectItem key={state} value={state} className="focus:bg-black/20">{state}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#EEEFA8]">Validation Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2D2A32] border-white/20 text-[#FAFDF6]">
                    <SelectItem value="All Status" className="focus:bg-black/20">All Status</SelectItem>
                    <SelectItem value="Validated" className="focus:bg-black/20">Validated</SelectItem>
                    <SelectItem value="Pending" className="focus:bg-black/20">Pending</SelectItem>
                    <SelectItem value="Under Review" className="focus:bg-black/20">Under Review</SelectItem>
                    <SelectItem value="Rejected" className="focus:bg-black/20">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedSport("All Sports"); setSelectedState("All States"); setSelectedStatus("All Status"); }} className="w-full bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10">Clear Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#014f86] shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-[#FAFDF6]">Athlete Profiles ({filteredAthletes.length} results)</CardTitle>
            <CardDescription className="text-[#EEEFA8]">Manage and review athlete data and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="hover:bg-black/10">
                  <TableRow className="border-b-white/10">
                    {["Athlete", "Sport", "Location", "Status", "Health", "Scores", "Tier", "Actions"].map(h => <TableHead key={h} className="text-[#EEEFA8]">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAthletes.map((athlete) => (
                    <TableRow key={athlete.id} className="border-b-white/10 hover:bg-black/20">
                      <TableCell>
                        <div className="font-medium text-[#FAFDF6]">{athlete.firstName} {athlete.lastName}</div>
                        <div className="text-sm text-gray-400">{athlete.id}</div>
                        <div className="text-xs text-gray-500">Age: {athlete.age}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="border-[#EAE151]/50 text-[#EAE151]">{athlete.sport}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-[#FAFDF6]"><MapPin className="h-3 w-3 text-gray-400" /><span>{athlete.district}</span></div>
                        <div className="text-xs text-gray-500">{athlete.state}</div>
                      </TableCell>
                      <TableCell><div className="flex items-center space-x-2">{getStatusIcon(athlete.validationStatus)}<Badge className={getStatusColor(athlete.validationStatus)}>{athlete.validationStatus}</Badge></div></TableCell>
                      <TableCell><Badge className={getHealthStatusColor(athlete.healthStatus)}>{athlete.healthStatus}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm text-[#EEEFA8]">
                            <div><span className="font-medium text-[#FAFDF6]">{athlete.overallScore}%</span> Overall</div>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={getTierColor(athlete.tier)}>{athlete.tier}</Badge></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedAthlete(athlete)} className="bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10 hover:text-[#EAE151]"><Eye className="h-3 w-3 mr-1" />View</Button>
                          <Button size="sm" onClick={() => handleDownloadReport(athlete)} className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32]"><Download className="h-3 w-3 mr-1" />Report</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredAthletes.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#FAFDF6] mb-2">No athletes found</h3>
                <p className="text-[#EEEFA8]">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedAthlete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#2D2A32] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-[#FAFDF6]">{selectedAthlete.firstName} {selectedAthlete.lastName}</CardTitle>
                  <Button variant="outline" onClick={() => setSelectedAthlete(null)} className="bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10 hover:text-[#EAE151]">Close</Button>
                </div>
                <CardDescription className="text-[#EEEFA8]">Detailed athlete profile and performance data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-[#FAFDF6]">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      {[
                          {label: "ID:", value: selectedAthlete.id},
                          {label: "Age:", value: `${selectedAthlete.age} years`},
                          {label: "Sport:", value: selectedAthlete.sport},
                          {label: "Location:", value: `${selectedAthlete.district}, ${selectedAthlete.state}`},
                          {label: "Phone:", value: selectedAthlete.phone},
                          {label: "Email:", value: selectedAthlete.email},
                      ].map(info => (
                          <div key={info.label} className="flex justify-between">
                              <span className="text-gray-400">{info.label}</span>
                              <span className="font-medium text-[#FAFDF6]">{info.value}</span>
                          </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-[#FAFDF6]">Performance Scores</h4>
                    <div className="space-y-3">
                      {[
                          {label: "Excellence Score", value: selectedAthlete.excellenceScore},
                          {label: "Fitness Score", value: selectedAthlete.fitnessScore},
                          {label: "Video Analysis", value: selectedAthlete.videoAnalysisScore},
                      ].map(score => (
                        <div key={score.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#EEEFA8]">{score.label}</span>
                                <span className="font-medium text-[#FAFDF6]">{score.value}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2"><div className="bg-[#DDD92A] h-2 rounded-full" style={{ width: `${score.value}%` }}/></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-[#DDD92A]">{selectedAthlete.overallScore}%</div>
                    <div className="text-sm text-[#EEEFA8]">Overall Score</div>
                  </div>
                  <div className="text-center p-4 bg-black/20 rounded-lg flex flex-col justify-center items-center">
                    <Badge className={getTierColor(selectedAthlete.tier)}>{selectedAthlete.tier}</Badge>
                    <div className="text-sm text-[#EEEFA8] mt-1">Performance Tier</div>
                  </div>
                  <div className="text-center p-4 bg-black/20 rounded-lg flex flex-col justify-center items-center">
                    <Badge className={getStatusColor(selectedAthlete.validationStatus)}>{selectedAthlete.validationStatus}</Badge>
                    <div className="text-sm text-[#EEEFA8] mt-1">Validation Status</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={() => handleDownloadReport(selectedAthlete)} className="flex-1 bg-[#DDD92A] hover:bg-[#c8c426] text-[#2D2A32] font-semibold"><FileText className="h-4 w-4 mr-2" />Download Full Report</Button>
                  <Button variant="outline" className="flex-1 bg-transparent border-[#EAE151] text-[#EAE151] hover:bg-white/10"><BarChart3 className="h-4 w-4 mr-2" />View Analytics</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}