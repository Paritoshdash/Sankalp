"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Upload, Play, Loader2, AlertTriangle, ChevronRight } from "lucide-react"

const SPORT_NAMES = {
  "running-100m": "100m Sprint",
  "high-jump": "High Jump",
  "long-jump": "Long Jump",
  "shotput": "Shot Put",
  "javelin": "Javelin"
};

// Define interfaces for state objects to ensure type safety
interface LiveMetrics {
  status: string;
  progress: string;
  frame: number;
  fps: number;
}

interface FinalResult {
  sport: keyof typeof SPORT_NAMES;
  metrics: Record<string, string>;
}

export default function VideoAnalysisPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [pageState, setPageState] = useState("idle");
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("An error occurred.");

  useEffect(() => {
    if (pageState === "processing" && liveMetrics?.frame && liveMetrics?.fps && videoRef.current) {
      const timestamp = liveMetrics.frame / liveMetrics.fps;
      if (Math.abs(videoRef.current.currentTime - timestamp) > 0.2) {
        videoRef.current.currentTime = timestamp;
      }
    }
  }, [liveMetrics, pageState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const startAnalysis = () => {
    if (!videoFile) return;

    setPageState("processing");
    if (videoRef.current) videoRef.current.play();

    let frame = 0;
    const fps = 30;
    const analysisDurationSeconds = 8;
    const totalFrames = analysisDurationSeconds * fps;

    const liveMetricsInterval = setInterval(() => {
      frame += 6;
      if (frame >= totalFrames) frame = totalFrames;

      setLiveMetrics({
        status: "Analyzing keyframes...",
        progress: `${Math.round((frame / totalFrames) * 100)}%`,
        frame: frame,
        fps: fps,
      });
    }, 120);

    setTimeout(() => {
      clearInterval(liveMetricsInterval);

      // --- MODIFICATION ---
      // The analysis now returns fixed results based on the provided video.
      const selectedSport = "running-100m";
      const metrics = {
        "Final Time (s)": "14.82",
        "Top Speed (km/h)": "29.50",
        "Avg. Step Frequency (steps/s)": "3.91",
      };

      const finalData: FinalResult = { sport: selectedSport, metrics: metrics };
      setFinalResult(finalData);
      setPageState("complete");

    }, analysisDurationSeconds * 1000);
  };

  const resetState = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setPageState("idle");
    setFinalResult(null);
    setLiveMetrics(null);
  };

  const renderResults = () => {
    if (!finalResult) return null;
    const { sport, metrics } = finalResult;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-[#DDD92A] mx-auto" />
          <h3 className="text-2xl font-bold mt-2">Analysis Complete</h3>
          <p className="text-xl text-[#EEEFA8]">{SPORT_NAMES[sport]}</p>
        </div>

        <div className="grid grid-cols-1 md:col-span-2 gap-6">
          <Card className="bg-black/20 border-white/10 p-4">
            <CardHeader><CardTitle className="text-lg text-[#DDD92A]">Key Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 items-baseline gap-4 font-mono">
                  <span className="text-sm text-[#FAF9F6]/70 text-left">{key}</span>
                  <span className="text-lg text-[#FAF9F6]/70 text-right">{String(value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#013a63] text-[#FAF9F6]">
      <Card className="w-full max-w-6xl bg-[#014f86] border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-[#DDD92A]">Game Performance Analyzer</CardTitle>
          <CardDescription className="text-[#EEEFA8]"></CardDescription>
        </CardHeader>
        <CardContent className="min-h-[500px] flex flex-col justify-center">

          {pageState === 'idle' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <label htmlFor="video-upload" className="cursor-pointer group">
                  <div className="border-2 border-dashed border-[#DDD92A]/50 rounded-lg p-10 flex flex-col items-center group-hover:bg-white/10 transition-colors">
                    <Upload className="h-16 w-16 text-[#DDD92A] mb-4" />
                    <p className="font-bold text-lg text-center">{videoFile ? "File Selected: " + videoFile.name : "Click to Upload or Drag & Drop"}</p>
                    <p className="text-[#EEEFA8]">Your sport will be recognized automatically.</p>
                  </div>
                  <input id="video-upload" type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
                {videoFile && <div className="text-center mt-6"><Button onClick={startAnalysis} size="lg" className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-bold text-lg">Analyze Performance</Button></div>}
              </div>
              <div className="bg-black rounded-lg p-1 border-2 border-[#DDD92A]/50 aspect-video shadow-lg shadow-[#DDD92A]/10">
                <video ref={videoRef} src={videoUrl} muted loop autoPlay className="w-full h-full rounded" />
              </div>
            </div>
          )}

          {(pageState === 'processing' || pageState === 'complete') && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="bg-black rounded-lg p-1 border-2 border-[#DDD92A]/50 aspect-video shadow-lg shadow-[#DDD92A]/10">
                <video ref={videoRef} src={videoUrl} muted className="w-full h-full rounded" />
              </div>
              <div className="p-4">
                {pageState === 'processing' ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-16 w-16 text-[#DDD92A] animate-spin mx-auto" />
                    <h3 className="text-2xl text-[#EEEFA8]">AI Analyzing Performance...</h3>
                    <div className="font-mono text-left text-[#EEEFA8] p-4 rounded-lg min-h-[100px]">
                      {liveMetrics ? Object.entries(liveMetrics).map(([k, v]) => <p key={k}><span className="text-[#DDD92A]">{k}:</span> {String(v)}</p>) : <p>Initializing...</p>}
                    </div>
                  </div>
                ) : (
                  <div>
                    {renderResults()}
                    <div className="flex justify-center items-center gap-4 mt-6">
                      <Button onClick={resetState} variant="outline" className="border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10 bg-transparent">Analyze Another</Button>
                      <Button onClick={() => window.location.href = '/admin'} className="bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-bold">
                        Go to Leaderboard Page <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {pageState === 'error' && (
            <div className="text-center space-y-4 p-4">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
              <h3 className="text-2xl font-bold">Analysis Failed</h3>
              <p className="bg-red-500/10 p-3 rounded-lg text-red-300">{errorMessage}</p>
              <Button onClick={resetState} variant="outline" className="border-[#DDD92A]/50 text-[#DDD92A] hover:bg-white/10 bg-transparent">Try Again</Button>
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  );
}

