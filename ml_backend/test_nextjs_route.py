"""
Tests the full stack: Browser → Next.js /api/analyze → Python ML → DB
This simulates exactly what the frontend video-analysis page does.
"""
import requests
import json
import os

BASE_DIR = os.path.dirname(__file__)
NEXTJS_URL = "http://localhost:3000"
VIDEO_PATH = os.path.join(BASE_DIR, "test_running.mp4")

print("=== FULL STACK TEST: Next.js → Python → Response ===\n")
print(f"Next.js: {NEXTJS_URL}")
print(f"Video:   {VIDEO_PATH} ({os.path.getsize(VIDEO_PATH)/1024:.0f} KB)\n")

with open(VIDEO_PATH, "rb") as f:
    print("Sending video through Next.js /api/analyze ...")
    r = requests.post(
        f"{NEXTJS_URL}/api/analyze",
        files={"video": ("test_running.mp4", f, "video/mp4")},
        data={
            "sport": "running-100m",
            "athleteAge": "18",
            "gender": "male",
            # No userId → result returned but not saved to DB
        },
        timeout=180,
    )

print(f"HTTP {r.status_code}")
data = r.json()

if not data.get("success"):
    print("FAILED:", json.dumps(data.get("error"), indent=2))
else:
    print(f"SUCCESS")
    print(f"  Sport:             {data['sport']}")
    print(f"  Frames processed:  {data['video']['frames_processed']}")
    print(f"  Pose detection:    {data['video']['pose_detection_rate']*100:.0f}%")
    print(f"  Technique score:   {data['technique_score']:.1f}/100")
    print(f"  Performance score: {data['performance_score']:.1f}/100")
    print(f"  Overall video:     {data['overall_video_score']:.1f}/100")
    print(f"  Model version:     {data['model']['version']}")
    print(f"  Metrics:")
    for name, m in data["metrics"].items():
        if m.get("value") is not None:
            print(f"    {name}: {m['value']:.2f} {m.get('unit','')} "
                  f"(conf: {m.get('confidence',0)*100:.0f}%)")
    if data.get("warnings"):
        print(f"  Warnings: {len(data['warnings'])}")
        for w in data["warnings"][:3]:
            print(f"    - {w}")
    if data.get("saved"):
        print(f"  DB saved: overall={data['saved']['overall_score']}, tier={data['saved']['tier']}")
    else:
        print("  DB save: skipped (no userId provided)")

print("\nFull stack test complete.")
