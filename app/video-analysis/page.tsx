"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy, Upload, Loader2, AlertTriangle, ChevronRight,
  CheckCircle, Info, AlertCircle
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

interface MetricValue {
  value: number | null
  unit: string | null
  normalized_score?: number
  confidence: number
  estimated: boolean
  note?: string
}

interface AnalysisResult {
  sport: string
  video: {
    frames_processed: number
    duration_seconds: number
    pose_detection_rate: number
  }
  metrics: Record<string, MetricValue>
  technique_score: number
  performance_score: number
  overall_video_score: number
  warnings: string[]
  processing: {
    time_ms: number
    frames_processed: number
    pose_detection_rate: number
  }
  model: {
    name: string
    version: string
    analysis_timestamp: string
  }
  saved?: {
    video_analysis_score: number
    overall_score: number
    tier: string
  }
  db_warning?: string
}

interface ErrorPayload {
  code: string
  message: string
}

const SPORT_DISPLAY_NAMES: Record<string, string> = {
  "running-100m": "100m Sprint",
  "high-jump":    "High Jump",
  "long-jump":    "Long Jump",
  "shotput":      "Shot Put",
  "javelin":      "Javelin Throw",
  "archery":      "Archery",
  "shooting":     "Shooting",
}

const STEP_LABELS = ["Uploading", "Analyzing", "Processing results", "Complete"]

// ── Component ─────────────────────────────────────────────────────────────────

export default function VideoAnalysisPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [pageState, setPageState] = useState<"idle" | "uploading" | "analyzing" | "complete" | "error">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [errorPayload, setErrorPayload] = useState<ErrorPayload | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentSport, setCurrentSport] = useState<string>("running-100m")

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) setCurrentUser(JSON.parse(user))

    // Get sport from localStorage selection
    const selection = localStorage.getItem("sportSelection")
    if (selection) {
      const parsed = JSON.parse(selection)
      if (parsed.sport_id) setCurrentSport(parsed.sport_id)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side size check (100 MB)
    if (file.size > 100 * 1024 * 1024) {
      setErrorPayload({ code: "FILE_TOO_LARGE", message: "Video file must be under 100 MB." })
      setPageState("error")
      return
    }

    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setPageState("idle")
    setAnalysisResult(null)
    setErrorPayload(null)
  }

  const startAnalysis = useCallback(async () => {
    if (!videoFile) return

    setPageState("uploading")
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("video", videoFile)
    formData.append("sport", currentSport)
    if (currentUser?.id) formData.append("userId", String(currentUser.id))
    if (currentUser?.age) formData.append("athleteAge", String(currentUser.age))
    if (currentUser?.gender) formData.append("gender", currentUser.gender)

    // Simulate upload progress (XHR would give real progress, but fetch does not)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10))
    }, 300)

    try {
      setPageState("analyzing")
      clearInterval(progressInterval)
      setUploadProgress(100)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setErrorPayload(data.error || { code: "ANALYSIS_FAILED", message: "Analysis failed." })
        setPageState("error")
        return
      }

      setAnalysisResult(data as AnalysisResult)
      setPageState("complete")
    } catch (err: any) {
      setErrorPayload({
        code: "NETWORK_ERROR",
        message: "Could not reach the analysis server. Please check your connection.",
      })
      setPageState("error")
    } finally {
      clearInterval(progressInterval)
    }
  }, [videoFile, currentSport, currentUser])

  const reset = () => {
    setVideoFile(null)
    setVideoUrl(null)
    setPageState("idle")
    setAnalysisResult(null)
    setErrorPayload(null)
    setUploadProgress(0)
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderMetricCard = (name: string, m: MetricValue) => {
    if (m.value === null || m.value === undefined) return null
    const label = name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    const confPct = Math.round((m.confidence ?? 0) * 100)

    return (
      <div key={name} className="p-3 bg-black/20 rounded-lg border border-white/5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#EEEFA8]/70 mb-1">{label}</p>
            <p className="font-mono text-lg text-[#FAF9F6] font-semibold">
              {typeof m.value === "number" ? m.value.toFixed(1) : m.value}
              {m.unit ? <span className="text-sm text-[#EEEFA8]/60 ml-1">{m.unit}</span> : null}
            </p>
            {m.normalized_score !== undefined && (
              <div className="mt-1">
                <Progress value={m.normalized_score} className="h-1 bg-black/30 [&>div]:bg-[#DDD92A]" />
                <p className="text-xs text-[#EEEFA8]/50 mt-0.5">Score: {m.normalized_score.toFixed(0)}/100</p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {m.estimated && (
              <Badge variant="outline" className="text-xs border-yellow-400/40 text-yellow-300/70 px-1 py-0">
                est.
              </Badge>
            )}
            <span className={`text-xs ${confPct >= 70 ? "text-green-400" : confPct >= 40 ? "text-yellow-400" : "text-red-400"}`}>
              {confPct}% conf
            </span>
          </div>
        </div>
        {m.note && <p className="text-xs text-[#EEEFA8]/40 mt-1 italic">{m.note}</p>}
      </div>
    )
  }

  const renderResults = () => {
    if (!analysisResult) return null
    const r = analysisResult

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <CheckCircle className="h-14 w-14 text-green-400 mx-auto" />
          <h3 className="text-2xl font-bold text-[#FAF9F6]">Analysis Complete</h3>
          <p className="text-[#EEEFA8]">{SPORT_DISPLAY_NAMES[r.sport] ?? r.sport}</p>
        </div>

        {/* Score summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Technique", value: r.technique_score },
            { label: "Performance", value: r.performance_score },
            { label: "Overall", value: r.overall_video_score },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-black/20 rounded-lg p-3 border border-white/10">
              <div className="text-2xl font-bold text-[#DDD92A]">{value.toFixed(0)}</div>
              <div className="text-xs text-[#EEEFA8]">{label}</div>
              <Progress value={value} className="h-1 mt-1 bg-black/30 [&>div]:bg-[#DDD92A]" />
            </div>
          ))}
        </div>

        {/* Saved score */}
        {r.saved && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Score saved — Overall: {r.saved.overall_score} | Tier: {r.saved.tier}
            </p>
          </div>
        )}
        {r.db_warning && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-300 text-xs">{r.db_warning}</p>
          </div>
        )}

        {/* Metrics */}
        {Object.keys(r.metrics).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[#EEEFA8] mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" /> Measured Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(r.metrics).map(([k, v]) =>
                v.value !== null && v.value !== undefined
                  ? renderMetricCard(k, v)
                  : null
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {r.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Analysis Notes
            </h4>
            {r.warnings.map((w, i) => (
              <p key={i} className="text-xs text-yellow-200/70 bg-yellow-900/10 border border-yellow-500/20 rounded p-2">
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Processing info */}
        <div className="text-xs text-[#EEEFA8]/40 space-y-1 border-t border-white/10 pt-3">
          <p>Frames processed: {r.video.frames_processed} | Duration: {r.video.duration_seconds}s</p>
          <p>Pose detection rate: {(r.video.pose_detection_rate * 100).toFixed(0)}%</p>
          <p>Model: {r.model.name} v{r.model.version}</p>
          <p>Processed in: {r.processing.time_ms}ms</p>
        </div>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#013a63] text-[#FAF9F6]">
      <Card className="w-full max-w-5xl bg-[#014f86] border-white/10">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold text-[#DDD92A]">Game Performance Analyzer</CardTitle>
          <CardDescription className="text-[#EEEFA8]">
            Sport: <strong>{SPORT_DISPLAY_NAMES[currentSport] ?? currentSport}</strong>
            {" · "}Upload a video to receive real pose-based analysis.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-[500px] flex flex-col justify-center">

          {/* ── IDLE ── */}
          {pageState === "idle" && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <label htmlFor="video-upload" className="cursor-pointer group">
                  <div className="border-2 border-dashed border-[#DDD92A]/50 rounded-lg p-10 flex flex-col items-center group-hover:bg-white/5 transition-colors">
                    <Upload className="h-16 w-16 text-[#DDD92A] mb-4" />
                    <p className="font-bold text-lg text-center">
                      {videoFile ? videoFile.name : "Click to Upload Video"}
                    </p>
                    <p className="text-[#EEEFA8] text-sm text-center mt-1">
                      MP4, MOV, AVI, WebM · Max 100 MB · Max ~60 seconds
                    </p>
                  </div>
                  <input id="video-upload" type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>

                {videoFile && (
                  <div className="text-center mt-6 space-y-2">
                    <p className="text-sm text-[#EEEFA8]/70">
                      Size: {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <Button
                      onClick={startAnalysis}
                      size="lg"
                      className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-bold text-lg w-full"
                    >
                      Analyze Performance
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-black rounded-lg p-1 border-2 border-[#DDD92A]/30 aspect-video shadow-lg">
                {videoUrl
                  ? <video ref={videoRef} src={videoUrl} muted loop autoPlay className="w-full h-full rounded object-contain" />
                  : <div className="w-full h-full flex items-center justify-center text-[#EEEFA8]/30">Video preview</div>
                }
              </div>
            </div>
          )}

          {/* ── UPLOADING / ANALYZING ── */}
          {(pageState === "uploading" || pageState === "analyzing") && (
            <div className="flex flex-col items-center justify-center space-y-8 py-16">
              <Loader2 className="h-20 w-20 text-[#DDD92A] animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-[#EEEFA8]">
                  {pageState === "uploading" ? "Uploading video…" : "Running AI analysis…"}
                </h3>
                <p className="text-[#EEEFA8]/60 text-sm">
                  {pageState === "analyzing"
                    ? "Extracting frames → Detecting pose → Analyzing technique. This may take 30–90 seconds."
                    : "Sending video to analysis backend…"}
                </p>
              </div>
              {pageState === "uploading" && (
                <div className="w-64">
                  <Progress value={uploadProgress} className="h-2 bg-black/30 [&>div]:bg-[#DDD92A]" />
                  <p className="text-center text-xs text-[#EEEFA8]/50 mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}

          {/* ── COMPLETE ── */}
          {pageState === "complete" && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="bg-black rounded-lg p-1 border-2 border-[#DDD92A]/30 aspect-video">
                {videoUrl && <video src={videoUrl} muted loop autoPlay className="w-full h-full rounded object-contain" />}
              </div>
              <div className="overflow-y-auto max-h-[70vh] space-y-4 pr-1">
                {renderResults()}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="flex-1 border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10 bg-transparent"
                  >
                    Analyze Another
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/admin")}
                    className="flex-1 bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-bold"
                  >
                    Leaderboard <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {pageState === "error" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-16 text-center">
              <AlertTriangle className="h-16 w-16 text-red-400" />
              <div>
                <h3 className="text-2xl font-bold text-red-300 mb-2">Analysis Failed</h3>
                {errorPayload && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 max-w-lg mx-auto">
                    <p className="text-sm font-mono text-red-300/70 mb-1">{errorPayload.code}</p>
                    <p className="text-red-200">{errorPayload.message}</p>
                  </div>
                )}
              </div>
              <Button
                onClick={reset}
                variant="outline"
                className="border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10 bg-transparent"
              >
                Try Again
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  )
}
