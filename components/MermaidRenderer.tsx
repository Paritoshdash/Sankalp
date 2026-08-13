"use client"

import React, { useEffect, useRef, useState } from "react"
import { Check, Copy, Download } from "lucide-react"

interface MermaidRendererProps {
  chart: string
  className?: string
}

declare global {
  interface Window {
    mermaid?: any
  }
}

export function MermaidRenderer({ chart, className = "" }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function initAndRender() {
      try {
        setLoading(true)

        // Load mermaid CDN script if not present
        if (!window.mermaid) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.getElementById("mermaid-cdn-script")
            if (existingScript) {
              existingScript.addEventListener("load", () => resolve())
              existingScript.addEventListener("error", () => reject(new Error("Failed to load Mermaid library script")))
              return
            }

            const script = document.createElement("script")
            script.id = "mermaid-cdn-script"
            script.src = "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Failed to load Mermaid from CDN"))
            document.body.appendChild(script)
          })
        }

        if (!window.mermaid) {
          throw new Error("Mermaid instance missing after script load")
        }

        window.mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            fontFamily: "Inter, system-ui, sans-serif",
            primaryColor: "#EFF6FF",
            primaryTextColor: "#1E3A8A",
            primaryBorderColor: "#3B82F6",
            lineColor: "#0D9488",
            secondaryColor: "#ECFDF5",
            tertiaryColor: "#F5F3FF",
            nodeBorder: "#3B82F6",
            clusterBkg: "#FFFFFF",
            clusterBorder: "#CBD5E1",
            titleColor: "#0F172A",
            edgeLabelBackground: "#FFFFFF",
          },
          securityLevel: "loose",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        })

        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`
        const { svg } = await window.mermaid.render(id, chart)
        if (isMounted) {
          setSvgContent(svg)
          setError(null)
          setLoading(false)
        }
      } catch (err: any) {
        console.error("Mermaid render error:", err)
        if (isMounted) {
          setError(err?.message || "Failed to render Mermaid diagram")
          setLoading(false)
        }
      }
    }

    initAndRender()
    return () => {
      isMounted = false
    }
  }, [chart])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chart)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadSvg = () => {
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "athlete-talent-exposure-workflow.svg"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden ${className}`}>
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Mermaid Workflow Diagram
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Copy Mermaid Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied Code!" : "Copy Code"}
          </button>
          {svgContent && (
            <button
              onClick={downloadSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              title="Download SVG"
            >
              <Download className="w-3.5 h-3.5" />
              Download SVG
            </button>
          )}
        </div>
      </div>

      {/* Render Output Area */}
      <div className="p-6 overflow-x-auto flex justify-center items-center min-h-[350px] bg-slate-50/50">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Rendering Mermaid Workflow Diagram...
          </div>
        ) : error ? (
          <div className="text-center p-6 text-red-500 text-sm">
            <p className="font-semibold mb-1">Diagram Rendering Issue</p>
            <p className="text-xs text-red-400 max-w-md">{error}</p>
          </div>
        ) : svgContent ? (
          <div
            ref={containerRef}
            className="w-full flex justify-center items-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : null}
      </div>
    </div>
  )
}
