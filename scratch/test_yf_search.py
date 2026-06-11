import yfinance as yf

# Search for "Korea" on yfinance
res = yf.Search('Korea Bond', max_results=10)
for q in res.quotes:
    print(q)
