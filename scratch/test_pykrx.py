from pykrx import bond

# List all methods in pykrx.bond
methods = [m for m in dir(bond) if not m.startswith('_')]
print("Methods in pykrx.bond:", methods)

# Try to fetch bond yields
try:
    df = bond.get_otc_treasury_yields("20260611")
    print("OTC Treasury Yields for 20260611:")
    print(df)
except Exception as e:
    print("Failed to get OTC treasury yields:", e)
