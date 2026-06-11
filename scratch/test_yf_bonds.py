import yfinance as yf

tickers = [
    'KR10YT=RR', 'KR3YT=RR', 'KRW10YT=RR', 'KRW3YT=RR',
    'KRW10Y=RR', 'KRW3Y=RR', 'KR10Y=RR', 'KR3Y=RR',
    'KR10Y.KS', 'KR3Y.KS', '^KR10Y', '^KR3Y'
]

for t in tickers:
    try:
        ticker = yf.Ticker(t)
        h = ticker.history(period='2d')
        if len(h) > 0:
            print(f"Ticker: {t} -> Success! Last close: {h['Close'].iloc[-1]}")
        else:
            print(f"Ticker: {t} -> Empty DataFrame")
    except Exception as e:
        print(f"Ticker: {t} -> Failed: {e}")
