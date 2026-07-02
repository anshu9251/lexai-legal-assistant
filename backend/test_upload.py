import requests
import io

print("Testing GET /api/documents/list")
try:
    res = requests.get('http://localhost:8000/api/documents/list')
    print("List response:", res.status_code, res.text)
except Exception as e:
    print("List error:", e)

print("\nTesting POST /api/documents/upload")
try:
    files = {'file': ('dummy.pdf', io.BytesIO(b'%PDF-1.4\nTest PDF'), 'application/pdf')}
    res = requests.post('http://localhost:8000/api/documents/upload', files=files)
    print("Upload response:", res.status_code, res.text)
except Exception as e:
    print("Upload error:", e)
