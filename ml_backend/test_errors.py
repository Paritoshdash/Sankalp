"""
Tests error handling: empty file, bad file, unsupported sport, bad age.
"""
import requests
import json
import os

BASE_DIR = os.path.dirname(__file__)
BASE_URL = "http://127.0.0.1:8000"

def send(filepath, sport="running-100m", age=18, content_type="video/mp4"):
    with open(filepath, "rb") as f:
        r = requests.post(
            f"{BASE_URL}/analyze",
            files={"video": (os.path.basename(filepath), f, content_type)},
            data={"sport": sport, "athlete_age": str(age)},
            timeout=30,
        )
    return r.status_code, r.json()

print("=== ERROR HANDLING TESTS ===\n")

# 1. Empty file
status, data = send(os.path.join(BASE_DIR, "test_empty.mp4"))
print(f"[Empty file]      HTTP {status}  →  {data.get('error',{}).get('code','?')}: {data.get('error',{}).get('message','')[:60]}")

# 2. Corrupted / non-video
status, data = send(os.path.join(BASE_DIR, "test_not_a_video.mp4"))
print(f"[Corrupt video]   HTTP {status}  →  {data.get('error',{}).get('code','?')}: {data.get('error',{}).get('message','')[:60]}")

# 3. Unsupported sport
status, data = send(os.path.join(BASE_DIR, "test_running.mp4"), sport="badminton")
print(f"[Bad sport]       HTTP {status}  →  {data.get('error',{}).get('code','?')}: {data.get('error',{}).get('message','')[:60]}")

# 4. Invalid age
status, data = send(os.path.join(BASE_DIR, "test_running.mp4"), age=150)
print(f"[Invalid age]     HTTP {status}  →  {data.get('error',{}).get('code','?')}: {data.get('error',{}).get('message','')[:60]}")

# 5. Valid text file with wrong extension (jpg → still wrong type check)
import tempfile
with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
    tmp.write(b"not a real image")
    tmp_path = tmp.name
status, data = send(tmp_path, content_type="image/jpeg")
os.unlink(tmp_path)
print(f"[Wrong file type] HTTP {status}  →  {data.get('error',{}).get('code','?')}: {data.get('error',{}).get('message','')[:60]}")

print("\nAll error handling tests complete.")
