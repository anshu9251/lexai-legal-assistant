import requests
import io

print("Testing GET /api/documents/list")
try:
    res = requests.get('http://localhost:8000/api/documents/list')
    print("List response:", res.status_code, res.text)
except Exception as e:
    print("List error:", e)

print("\nTesting POST /api/documents/upload with valid docx")
try:
    with open('test_contract.docx', 'rb') as f:
        files = {'file': ('test_contract.docx', f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        res = requests.post('http://localhost:8000/api/documents/upload', files=files)
        print("Upload response:", res.status_code, res.text)
except Exception as e:
    print("Upload error:", e)
