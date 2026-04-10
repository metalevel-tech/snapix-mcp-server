#!/usr/bin/env python3
"""
CDP Screenshot — captures a PNG screenshot from a running Chrome tab
via the Chrome DevTools Protocol WebSocket API.

Usage:
    python3 cdp-screenshot.py <PAGE_ID> <output_path>

    PAGE_ID     — Chrome DevTools page ID (get via: curl http://127.0.0.1:9222/json)
    output_path — Destination file path, e.g. /tmp/screenshot.png

Example:
    python3 cdp-screenshot.py FAC3F889C7AEDBAF3AD09480C521D129 /tmp/snapix-upload.png
"""

import sys
import socket
import base64
import struct
import json
import os

CDP_HOST = "127.0.0.1"
CDP_PORT = 9222


def ws_connect(page_id: str):
    path = f"/devtools/page/{page_id}"
    key = base64.b64encode(b"snapix-cdp-key-01").decode()
    handshake = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {CDP_HOST}:{CDP_PORT}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )
    sock = socket.create_connection((CDP_HOST, CDP_PORT))
    sock.settimeout(30)
    sock.send(handshake.encode())
    resp = b""
    while b"\r\n\r\n" not in resp:
        resp += sock.recv(4096)
    return sock


def ws_send(sock, msg: str):
    data = msg.encode("utf-8")
    length = len(data)
    mask_key = os.urandom(4)
    if length <= 125:
        header = bytes([0x81, 0x80 | length]) + mask_key
    elif length <= 65535:
        header = bytes([0x81, 0xFE, (length >> 8) & 0xFF, length & 0xFF]) + mask_key
    else:
        header = bytes([0x81, 0x7F]) + struct.pack(">Q", length) + mask_key
    masked = bytes([data[i] ^ mask_key[i % 4] for i in range(length)])
    sock.send(header + masked)


def ws_recv_frame(sock) -> str:
    header = b""
    while len(header) < 2:
        header += sock.recv(2 - len(header))
    length = header[1] & 0x7F
    if length == 126:
        ext = b""
        while len(ext) < 2:
            ext += sock.recv(2 - len(ext))
        length = struct.unpack(">H", ext)[0]
    elif length == 127:
        ext = b""
        while len(ext) < 8:
            ext += sock.recv(8 - len(ext))
        length = struct.unpack(">Q", ext)[0]
    payload = b""
    while len(payload) < length:
        chunk = sock.recv(min(65536, length - len(payload)))
        if not chunk:
            break
        payload += chunk
    return payload.decode("utf-8")


def capture_screenshot(page_id: str, output_path: str):
    sock = ws_connect(page_id)
    cmd = json.dumps({"id": 1, "method": "Page.captureScreenshot", "params": {"format": "png"}})
    ws_send(sock, cmd)

    full_data = ""
    while True:
        try:
            chunk = ws_recv_frame(sock)
            full_data += chunk
            try:
                msg = json.loads(full_data)
                if msg.get("id") == 1:
                    break
            except json.JSONDecodeError:
                pass  # incomplete JSON, keep reading
        except Exception as e:
            print(f"Error reading frame: {e}", file=sys.stderr)
            break

    sock.close()

    msg = json.loads(full_data)
    if "result" in msg and "data" in msg["result"]:
        img_data = base64.b64decode(msg["result"]["data"])
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(img_data)
        print(f"Screenshot saved: {output_path} ({len(img_data):,} bytes)")
    else:
        error = msg.get("error", "no data in response")
        print(f"CDP error: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    capture_screenshot(sys.argv[1], sys.argv[2])
