import requests
import json
import sys

def test():
    print("Testing /api/chat/ask...")
    try:
        resp = requests.post(
            "http://localhost:8000/api/chat/ask",
            json={"query": "what are the key terms of this contract?", "doc_ids": None}
        )
        print("Status:", resp.status_code)
        print("Response:", json.dumps(resp.json(), indent=2))
    except Exception as e:
        print("Error:", e)

    print("\nTesting /api/chat/risks...")
    try:
        resp = requests.post(
            "http://localhost:8000/api/chat/risks",
            json={"doc_ids": None}
        )
        print("Status:", resp.status_code)
        print("Response:", json.dumps(resp.json(), indent=2))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
