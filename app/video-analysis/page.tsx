"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Upload, Play, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, ChevronRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from "next/navigation";

const SPORT_NAMES = { "running-100m": "100m Sprint", "high-jump": "High Jump", "long-jump": "Long Jump", "shotput": "Shot Put", "javelin": "Javelin" };

export default function VideoAnalysisPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef(null);
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [pageState, setPageState] = useState("idle");
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("An error occurred.");

  useEffect(() => {
    if (pageState === "processing" && liveMetrics?.frame && liveMetrics?.fps && videoRef.current) {
      const timestamp = liveMetrics.frame / liveMetrics.fps;
      if (Math.abs(videoRef.current.currentTime - timestamp) > 0.2) {
        videoRef.current.currentTime = timestamp;
      }
    }
  }, [liveMetrics, pageState]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };
  
  const startAnalysis = async () => {
    if (!videoFile) return;
    setPageState("uploading");
    const formData = new FormData();
    formData.append("video", videoFile);
    try {
      const uploadRes = await fetch("http://127.0.0.1:8000/upload/", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.detail || "Upload failed");
      
      setPageState("processing");
      if (videoRef.current) videoRef.current.play();
      
      const ws = new WebSocket(`ws://127.0.0.1:8000/ws/analyze/${uploadData.video_id}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === "processing") setLiveMetrics(data.metrics);
        else if (data.status === "complete") { setFinalResult(data); setPageState("complete"); ws.close(); }
        else if (data.status === "error") { setErrorMessage(data.message); setPageState("error"); ws.close(); }
      };
      ws.onerror = () => { setErrorMessage("Server connection failed."); setPageState("error"); };
    } catch (error) { setErrorMessage(error.message); setPageState("error"); }
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
    const { sport, metrics, cheat_detection } = finalResult;
    const chartData = Object.entries(metrics).map(([name, value]) => ({ name, value }));
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-amber-400 mx-auto" />
          <h3 className="text-2xl font-bold mt-2">Analysis Complete</h3>
          <p className="text-xl text-white/80">{SPORT_NAMES[sport]}</p>
        </div>
        
        {cheat_detection && (
          <div className={`flex items-center justify-center p-3 rounded-lg ${cheat_detection.status === 'Pass' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {cheat_detection.status === 'Pass' ? <ShieldCheck className="text-green-400 h-6 w-6 mr-3" /> : <ShieldAlert className="text-red-400 h-6 w-6 mr-3" />}
            <div>
              <p className={`font-bold ${cheat_detection.status === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>Foul Detection: {cheat_detection.status}</p>
              <p className="text-xs text-white/70">{cheat_detection.reason}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/20 border-white/10 p-4">
            <CardHeader><CardTitle className="text-lg text-amber-400">Key Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 items-baseline gap-4 font-mono">
                  <span className="text-sm text-white/70 text-left">{key}</span>
                  <span className="text-lg  text-white/70 text-right">{String(value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* <Card className="bg-black/20 border-white/10 p-4">
            <CardHeader><CardTitle className="text-lg text-amber-400">Performance Chart</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              {isClient && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={140} />
                    <Tooltip cursor={{fill: '#ffffff10'}} contentStyle={{backgroundColor: '#111827', border: '1px solid #374151'}}/>
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card> */}
        </div>
      </div>
    );
  };
  
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gray-900 text-white">
      <Card className="w-full max-w-6xl bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-amber-400">Game Performance Analyzer</CardTitle>
          <CardDescription className="text-gray-400"></CardDescription>
        </CardHeader>
        <CardContent className="min-h-[500px] flex flex-col justify-center">
          
          {pageState === 'idle' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <label htmlFor="video-upload" className="cursor-pointer group">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-10 flex flex-col items-center group-hover:bg-gray-700/50 transition-colors">
                    <Upload className="h-16 w-16 text-amber-400 mb-4" />
                    <p className="font-bold text-lg">{videoFile ? "File Selected: " + videoFile.name : "Click to Upload or Drag & Drop"}</p>
                    <p className="text-gray-400">Your sport will be recognized automatically.</p>
                  </div>
                  <input id="video-upload" type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
                {videoFile && <div className="text-center mt-6"><Button onClick={startAnalysis} size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-lg">Analyze Performance</Button></div>}
              </div>
              <div className="bg-black rounded-lg p-1 border-2 border-amber-400/50 aspect-video shadow-lg shadow-amber-500/10">
                <video ref={videoRef} src={videoUrl} muted loop autoPlay className="w-full h-full rounded" />
              </div>
            </div>
          )}

          {(pageState === 'processing' || pageState === 'complete') && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="bg-black rounded-lg p-1 border-2 border-amber-400/50 aspect-video shadow-lg shadow-amber-500/10">
                <video ref={videoRef} src={videoUrl} muted className="w-full h-full rounded" />
              </div>
              <div className="p-4">
                {pageState === 'processing' ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-16 w-16 text-amber-400 animate-spin mx-auto" />
                    <h3 className="text-2xl text-gray-400">AI Analyzing Performance...</h3>
                    <div className="font-mono text-left text-gray-400 p-4 rounded-lg min-h-[100px]">
                      {liveMetrics ? Object.entries(liveMetrics).map(([k, v]) => <p key={k}><span className="text-amber-400">{k}:</span> {String(v)}</p>) : <p>Initializing...</p>}
                    </div>
                  </div>
                ) : (
                  <div>
                    {renderResults()}
                    <div className="flex justify-center items-center gap-4 mt-6">
                      <Button onClick={resetState} variant="outline" className="border-gray-600">Analyze Another</Button>
                      <Button onClick={() => router.push('/admin')} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold">
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
              <Button onClick={resetState} variant="outline" className="border-gray-600">Try Again</Button>
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  );
}