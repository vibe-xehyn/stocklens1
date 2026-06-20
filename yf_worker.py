#!/usr/bin/env python3
"""
영구 yfinance 워커: stdin에서 JSON 요청을 읽고 stdout으로 결과를 전송.
한 번만 yfinance/pandas import → 매 호출 ~700ms 절감.
프로토콜:
  요청  (한 줄): {"id": "<rid>", "script": "<python source>"}
  응답  : <json>\n__END__\n
"""
import sys, json, io, traceback, warnings, socket
warnings.filterwarnings('ignore')
socket.setdefaulttimeout(2.5)

# Preload heavy imports
import yfinance as yf
import pandas as pd
import math, re

END = '\n__END__\n'

def respond(obj):
    sys.__stdout__.write(json.dumps(obj, default=str) + END)
    sys.__stdout__.flush()

# Ready signal
respond({'id': '__ready__', 'ok': True})

while True:
    try:
        line = sys.stdin.readline()
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        req = json.loads(line)
        rid = req.get('id', '?')
        script = req.get('script', '')
        buf = io.StringIO()
        saved = sys.stdout
        sys.stdout = buf
        try:
            exec(compile(script, f'<task:{rid}>', 'exec'),
                 {'yf': yf, 'pd': pd, 'json': json, 'math': math, 're': re, 'warnings': warnings})
            sys.stdout = saved
            respond({'id': rid, 'ok': True, 'out': buf.getvalue()})
        except Exception as e:
            sys.stdout = saved
            respond({'id': rid, 'ok': False,
                     'error': f'{type(e).__name__}: {e}',
                     'trace': traceback.format_exc()[-400:]})
    except Exception as e:
        try:
            respond({'id': '?', 'ok': False, 'error': f'worker: {e}'})
        except Exception:
            sys.stderr.write(f'worker fatal: {e}\n')
            sys.stderr.flush()
