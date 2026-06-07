with open("server.js", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("['1wk','1mo','3mo','6mo','1y']", "['1d','1y','5y','max']")

with open("server.js", "w", encoding="utf-8") as f:
    f.write(code)

print("server.js updated completely")
