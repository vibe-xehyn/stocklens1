with open("public/index.html", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("['1wk','1mo','3mo','6mo','1y']", "['1d','1y','5y','max']")
code = code.replace("currentIndexRange = '1mo'", "currentIndexRange = '1y'")
code = code.replace("let currentIndexRange = '1mo'", "let currentIndexRange = '1y'")
code = code.replace("renderIndexDetail(m, '1mo')", "renderIndexDetail(m, '1y')")
code = code.replace("currentRange = '1mo'", "currentRange = '1y'")
code = code.replace("let currentRange = '1mo'", "let currentRange = '1y'")

with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(code)

print("index.html updated completely")
