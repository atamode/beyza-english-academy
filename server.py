from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, threading, webbrowser

PORT = 8765
ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

if __name__ == "__main__":
    url = f"http://127.0.0.1:{PORT}"
    threading.Timer(0.7, lambda: webbrowser.open(url)).start()
    print(f"Beyza English Academy: {url}")
    print("Kapatmak için Ctrl+C tuşlarına basın.")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
