"""
End-to-end pipeline test: send test_running.mp4 to the ML backend and print results.
"""
import requests
import json
import os

VIDEO_PATH = os.path.join(os.path.dirname(__file__), "test_running.mp4")
BASE_URL = "http://127.0.0.1:8000"

def test_health():
    r = requests.get(f"{BASE_URL}/health")
    print("=== HEALTH ===")
    print(json.dumps(r.json(), indent=2))
    print()

def test_sports():
    r = requests.get(f"{BASE_URL}/sports")
    print("=== SUPPORTED SPORTS ===")
    print(json.dumps(r.json(), indent=2))
    print()

def test_analyze(sport="running-100m", age=18):
    print(f"=== ANALYZING: {sport} (age {age}) ===")
    print(f"Video: {VIDEO_PATH} ({os.path.getsize(VIDEO_PATH)/1024:.1f} KB)")
    print("Sending to ML backend...")

    with open(VIDEO_PATH, "rb") as f:
        r = requests.post(
            f"{BASE_URL}/analyze",
            files={"video": ("test_running.mp4", f, "video/mp4")},
            data={"sport": sport, "athlete_age": str(age), "gender": "male"},
            timeout=120,
        )

    data = r.json()
    print(f"\nHTTP Status: {r.status_code}")
    print(f"Success: {data.get('success')}")
    print()

    if not data.get("success"):
        print("ERROR:", json.dumps(data.get("error"), indent=2))
        return

    print(f"Sport: {data['sport']}")
    print(f"Video: {data['video']['frames_processed']} frames, "
          f"{data['video']['duration_seconds']}s, "
          f"pose rate: {data['video']['pose_detection_rate']*100:.0f}%")
    print()
    print(f"Technique Score:    {data['technique_score']:.1f}/100")
    print(f"Performance Score:  {data['performance_score']:.1f}/100")
    print(f"Overall Video Score:{data['overall_video_score']:.1f}/100")
    print()

    print("=== METRICS ===")
    for name, m in data["metrics"].items():
        if m.get("value") is not None:
            est = " [estimated]" if m.get("estimated") else ""
            conf = f"  confidence: {m.get('confidence',0)*100:.0f}%"
            score = f"  score: {m.get('normalized_score',0):.0f}/100" if m.get('normalized_score') is not None else ""
            print(f"  {name}: {m['value']:.2f} {m.get('unit','')}{est}")
            print(f"    {conf}{score}")
            if m.get('note'):
                print(f"    note: {m['note']}")
        else:
            print(f"  {name}: null  (note: {m.get('note','')})")
    print()

    if data.get("warnings"):
        print("=== WARNINGS ===")
        for w in data["warnings"]:
            print(f"  ⚠ {w}")
        print()

    print("=== MODEL ===")
    print(f"  {data['model']['name']} v{data['model']['version']}")
    print(f"  Processed in: {data['processing']['time_ms']}ms")


if __name__ == "__main__":
    test_health()
    test_sports()
    test_analyze(sport="running-100m", age=18)
    print("\n--- Testing another sport (archery) ---\n")
    test_analyze(sport="archery", age=20)
