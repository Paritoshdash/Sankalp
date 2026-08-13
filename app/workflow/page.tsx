"use client"

import React, { useState } from "react"
import {
  User,
  Activity,
  Database,
  Video,
  Cpu,
  Layers,
  Brain,
  BarChart3,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  LayoutGrid,
  GitMerge,
  Code2,
  Copy,
  Check,
  Award,
  ArrowRight,
} from "lucide-react"
import { MermaidRenderer } from "@/components/MermaidRenderer"

// ── Stage Definition Interface ───────────────────────────────────────────────
interface WorkflowStage {
  id: number
  title: string
  category: string
  icon: React.FC<{ className?: string }>
  badgeBg: string
  badgeText: string
  badgeBorder: string
  cardBg: string
  borderColor: string
  accentColor: string
  points: string[]
}

// ── Technical Stages Data ──────────────────────────────────────────────────
const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 1,
    title: "Athlete Registration",
    category: "Profile Intake",
    icon: User,
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    cardBg: "bg-gradient-to-b from-blue-50/60 to-white",
    borderColor: "border-blue-200/80 hover:border-blue-400",
    accentColor: "#3B82F6",
    points: [
      "Athlete profile creation",
      "Personal and basic physical information",
      "Sport/discipline selection",
    ],
  },
  {
    id: 2,
    title: "Fitness Assessment",
    category: "Physical Field Tests",
    icon: Activity,
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    cardBg: "bg-gradient-to-b from-emerald-50/60 to-white",
    borderColor: "border-emerald-200/80 hover:border-emerald-400",
    accentColor: "#10B981",
    points: [
      "Standardized fitness tests",
      "Vertical jump, sit-ups, shuttle run",
      "Endurance testing",
      "Capture fitness measurements",
    ],
  },
  {
    id: 3,
    title: "Data Processing & Validation",
    category: "ETL & Storage",
    icon: Database,
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-200",
    cardBg: "bg-gradient-to-b from-teal-50/60 to-white",
    borderColor: "border-teal-200/80 hover:border-teal-400",
    accentColor: "#14B8A6",
    points: [
      "Data cleaning",
      "Feature preprocessing",
      "Normalization/scaling",
      "Store structured athlete data",
    ],
  },
  {
    id: 4,
    title: "Video Upload",
    category: "Media Management",
    icon: Video,
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
    badgeBorder: "border-sky-200",
    cardBg: "bg-gradient-to-b from-sky-50/60 to-white",
    borderColor: "border-sky-200/80 hover:border-sky-400",
    accentColor: "#0EA5E9",
    points: [
      "Upload athlete performance video",
      "Video preprocessing",
      "Frame extraction",
      "Secure video storage",
    ],
  },
  {
    id: 5,
    title: "Pose Estimation & Movement Analysis",
    category: "Computer Vision",
    icon: Cpu,
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-700",
    badgeBorder: "border-cyan-200",
    cardBg: "bg-gradient-to-b from-cyan-50/60 to-white",
    borderColor: "border-cyan-200/80 hover:border-cyan-400",
    accentColor: "#06B6D4",
    points: [
      "MediaPipe Pose",
      "Human body-keypoint detection",
      "Joint/movement tracking",
      "Exercise/movement analysis",
    ],
  },
  {
    id: 6,
    title: "Feature Extraction",
    category: "Multimodal Fusion",
    icon: Layers,
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
    badgeBorder: "border-indigo-200",
    cardBg: "bg-gradient-to-b from-indigo-50/60 to-white",
    borderColor: "border-indigo-200/80 hover:border-indigo-400",
    accentColor: "#6366F1",
    points: [
      "Pose-based movement features",
      "Fitness-performance features",
      "Combine numerical and video-derived features",
    ],
  },
  {
    id: 7,
    title: "ML-Based Performance Evaluation",
    category: "AI Predictive Engine",
    icon: Brain,
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
    badgeBorder: "border-violet-200",
    cardBg: "bg-gradient-to-b from-violet-50/60 to-white",
    borderColor: "border-violet-200/80 hover:border-violet-400",
    accentColor: "#8B5CF6",
    points: [
      "Scikit-learn models",
      "Athlete performance classification",
      "Compare performance features",
      "Generate prediction",
    ],
  },
  {
    id: 8,
    title: "Performance Score & Talent Insights",
    category: "Analytics & Output",
    icon: BarChart3,
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
    cardBg: "bg-gradient-to-b from-amber-50/60 to-white",
    borderColor: "border-amber-200/80 hover:border-amber-400",
    accentColor: "#D97706",
    points: [
      "Overall performance score",
      "Performance category",
      "Strengths and weaknesses",
      "Potential talent indication",
      "Recommendation for further professional assessment",
    ],
  },
]

// ── Raw Mermaid Code String ─────────────────────────────────────────────────
const MERMAID_CODE = `flowchart LR
    %% Professional Blue/Green/Teal Theme for Research & Proposals
    classDef stage1 fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px,color:#1E3A8A,rx:10px,ry:10px
    classDef stage2 fill:#ECFDF5,stroke:#10B981,stroke-width:2px,color:#064E3B,rx:10px,ry:10px
    classDef stage3 fill:#F0FDFA,stroke:#14B8A6,stroke-width:2px,color:#134E4A,rx:10px,ry:10px
    classDef stage4 fill:#F0F9FF,stroke:#0EA5E9,stroke-width:2px,color:#0C4A6E,rx:10px,ry:10px
    classDef stage5 fill:#ECFEFF,stroke:#06B6D4,stroke-width:2px,color:#164E63,rx:10px,ry:10px
    classDef stage6 fill:#EEF2FF,stroke:#6366F1,stroke-width:2px,color:#312E81,rx:10px,ry:10px
    classDef stage7 fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px,color:#4C1D95,rx:10px,ry:10px
    classDef stage8 fill:#FEFCE8,stroke:#D97706,stroke-width:2px,color:#78350F,rx:10px,ry:10px
    classDef noteCard fill:#FFFFFF,stroke:#0D9488,stroke-width:2px,color:#0F172A,rx:12px,ry:12px

    subgraph Pipeline ["ATHLETE TALENT EXPOSURE SYSTEM - SYSTEM WORKFLOW"]
        direction LR

        S1["<b>1. Athlete Registration</b><br/>👤 <i>Profile Creation</i><br/>• Athlete profile creation<br/>• Personal & physical info<br/>• Sport selection"]:::stage1
        
        S2["<b>2. Fitness Assessment</b><br/>🏃 <i>Field Testing</i><br/>• Standardized fitness tests<br/>• Vertical jump, sit-ups, shuttle<br/>• Endurance testing"]:::stage2

        S3["<b>3. Data Processing & Validation</b><br/>🗄️ <i>ETL Storage</i><br/>• Data cleaning<br/>• Feature preprocessing<br/>• Normalization / scaling<br/>• Store structured data"]:::stage3

        S4["<b>4. Video Upload</b><br/>📹 <i>Media Processing</i><br/>• Performance video upload<br/>• Video preprocessing<br/>• Frame extraction<br/>• Secure video storage"]:::stage4

        S5["<b>5. Pose Estimation & Movement</b><br/>🦴 <i>MediaPipe Analysis</i><br/>• MediaPipe Pose<br/>• Body-keypoint detection<br/>• Joint/movement tracking<br/>• Exercise analysis"]:::stage5

        S6["<b>6. Feature Extraction</b><br/>⚡ <i>Feature Fusion</i><br/>• Pose-based features<br/>• Fitness-performance features<br/>• Combine numerical + video"]:::stage6

        S7["<b>7. ML Performance Evaluation</b><br/>🤖 <i>Scikit-Learn ML</i><br/>• Scikit-learn models<br/>• Performance classification<br/>• Compare features<br/>• Generate prediction"]:::stage7

        S8["<b>8. Performance Score & Insights</b><br/>📊 <i>Talent Report</i><br/>• Overall score & category<br/>• Strengths & weaknesses<br/>• Talent indication<br/>• Recommendation"]:::stage8

        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8
    end

    subgraph Governance ["DECISION FRAMEWORK & OVERSIGHT"]
        N1["<b>AI-Assisted First-Level Athlete Assessment</b><br/>Combines standardized fitness data with computer-vision and machine-learning analysis to support scalable grassroots talent identification.<br/><br/><i>Note: AI provides screening insights; final athlete selection remains with qualified coaches and sports experts.</i>"]:::noteCard
    end

    Pipeline --> Governance`

export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState<"cards" | "mermaid" | "code">("cards")
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(MERMAID_CODE)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header & Title Section ────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm relative overflow-hidden">
          {/* Subtle Background Radial Gradients */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-teal-100/40 via-sky-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-gradient-to-tr from-blue-100/40 via-indigo-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Research & Proposal Technical Architecture</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Athlete Talent Exposure System
              </h1>
              <p className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed">
                End-to-End Workflow Architecture — Integrating Grassroots Assessment, MediaPipe Computer Vision, and Scikit-Learn Predictive Modeling.
              </p>
            </div>

            {/* View Controls & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTab("cards")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === "cards"
                    ? "bg-white text-teal-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Interactive Cards</span>
              </button>
              <button
                onClick={() => setActiveTab("mermaid")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === "mermaid"
                    ? "bg-white text-teal-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <GitMerge className="w-4 h-4" />
                <span>Mermaid Diagram</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === "code"
                    ? "bg-white text-teal-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Mermaid Code</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">Pipeline Stages</div>
              <div className="text-xl font-bold text-teal-700 mt-0.5">8 Sequential Steps</div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">Computer Vision Engine</div>
              <div className="text-xl font-bold text-sky-700 mt-0.5">MediaPipe Pose (33 pts)</div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">ML Core</div>
              <div className="text-xl font-bold text-violet-700 mt-0.5">Scikit-Learn Classifier</div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-xs text-slate-500 font-medium">Governance</div>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">Coach-Assisted AI</div>
            </div>
          </div>
        </div>

        {/* ── TAB CONTENT 1: INTERACTIVE CARDS DASHBOARD ───────────────────── */}
        {activeTab === "cards" && (
          <div className="space-y-6">

            {/* Pipeline Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-teal-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  End-to-End System Workflow
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Horizontal Data Flow (Left to Right)
              </span>
            </div>

            {/* 8 Stage Grid / Horizontal Flow Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {WORKFLOW_STAGES.map((stage, idx) => {
                const IconComponent = stage.icon
                return (
                  <div key={stage.id} className="flex flex-col relative group">
                    {/* Stage Card */}
                    <div
                      className={`h-full flex flex-col justify-between p-5 rounded-2xl border ${stage.borderColor} ${stage.cardBg} shadow-xs hover:shadow-md transition-all duration-200`}
                    >
                      <div>
                        {/* Stage Number & Icon Header */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.badgeBg} ${stage.badgeText} ${stage.badgeBorder}`}
                          >
                            Stage {stage.id}
                          </span>
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-xs border border-slate-200/80"
                            style={{ color: stage.accentColor }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Stage Title */}
                        <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                          {stage.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                          {stage.category}
                        </span>

                        <hr className="border-slate-200/60 mb-3" />

                        {/* Technical Bullet Points */}
                        <ul className="space-y-2">
                          {stage.points.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ backgroundColor: stage.accentColor }}
                              />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Next Arrow Indicator for Horizontal Flow */}
                      <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>{idx === 7 ? "Final Output" : `Proceeds to Stage ${idx + 2}`}</span>
                        {idx < 7 ? (
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        ) : (
                          <Award className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT 2: MERMAID DIAGRAM RENDERER ───────────────────────── */}
        {activeTab === "mermaid" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                Generated Mermaid Architecture Diagram
              </h2>
              <span className="text-xs text-slate-500">
                Clean light-mode palette suitable for publication & research proposals
              </span>
            </div>
            <MermaidRenderer chart={MERMAID_CODE} className="shadow-xs" />
          </div>
        )}

        {/* ── TAB CONTENT 3: MERMAID CODE & SYNTAX ──────────────────────────── */}
        {activeTab === "code" && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-slate-100 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-teal-400" />
                <span className="font-mono text-sm font-semibold text-slate-200">
                  mermaid_workflow_diagram.mmd
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors shadow-xs"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied to Clipboard!" : "Copy Mermaid Code"}
              </button>
            </div>
            <pre className="font-mono text-xs sm:text-sm text-teal-300/90 overflow-x-auto p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 leading-relaxed">
              {MERMAID_CODE}
            </pre>
          </div>
        )}

        {/* ── HIGHLIGHTED BOTTOM STATEMENT & GOVERNANCE BOX ─────────────────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-500/40 shadow-sm relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500" />

          <div className="max-w-4xl mx-auto text-center space-y-5">
            {/* Main Highlighted Statement */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 via-emerald-50 to-sky-50 px-5 py-2 rounded-full border border-teal-200/80">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
              <span className="text-base sm:text-lg font-extrabold text-teal-900 tracking-tight">
                AI-Assisted First-Level Athlete Assessment
              </span>
            </div>

            {/* Subtitle Description */}
            <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto">
              Combines standardized fitness data with computer-vision and machine-learning analysis to support scalable grassroots talent identification.
            </p>

            {/* Crucial Governance Disclaimer Note */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-left max-w-2xl mx-auto shadow-2xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-normal">
                <strong className="font-bold text-amber-950">Governance Note: </strong>
                AI provides screening insights; final athlete selection remains with qualified coaches and sports experts.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
