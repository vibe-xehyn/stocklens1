#!/usr/bin/env python3
import time
import sys
import urllib.request

# 1. Allocate ~180MB of memory to keep memory > 15% (out of 1GB AMD instance)
mem_block = bytearray(180 * 1024 * 1024)

print("Oracle Cloud Keep-Alive Service started.")
print("Allocated 180MB memory.")
sys.stdout.flush()

last_ping = time.time()

# Target CPU utilization: ~20%
# Target cycle: 100ms (busy loop for 20ms, sleep for 80ms)
CYCLE_TIME = 0.1
BUSY_TIME = 0.020
SLEEP_TIME = 0.080

try:
    while True:
        cycle_start = time.time()
        
        # Busy loop for 20ms
        while time.time() - cycle_start < BUSY_TIME:
            pass
            
        # Sleep for 80ms
        time.sleep(SLEEP_TIME)
        
        # Hourly network ping (to generate network I/O)
        now = time.time()
        if now - last_ping > 3600:
            try:
                urllib.request.urlopen("https://www.google.com", timeout=10)
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Hourly network I/O ping success.")
                sys.stdout.flush()
            except Exception as e:
                print(f"Network ping error: {e}", file=sys.stderr)
                sys.stderr.flush()
            last_ping = now
except KeyboardInterrupt:
    print("Keep-alive service stopped.")
