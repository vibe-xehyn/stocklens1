import sys
import urllib.request
import re
import json
import ssl

def get_naver_financials(ticker):
    ssl_ctx = ssl._create_unverified_context()
    url = f"https://finance.naver.com/item/main.naver?code={ticker}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as response:
            raw_bytes = response.read()
        try:
            html = raw_bytes.decode('utf-8')
        except:
            html = raw_bytes.decode('euc-kr', errors='ignore')
    except Exception as e:
        return {'error': str(e)}

    # Find the cop_analysis table (기업실적분석)
    # The table is wrapped in <div class="section cop_analysis">
    table_match = re.search(r'<div class="section cop_analysis">[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>', html)
    if not table_match:
        return {'error': 'Table not found'}

    table_html = table_match.group(1)

    # Extract dates/headers
    # E.g., <th scope="col" class="">2023.12</th>
    dates = []
    # Find all table headers inside the first few trs
    thead_match = re.search(r'<thead>([\s\S]*?)<\/thead>', table_html)
    if thead_match:
        thead_html = thead_match.group(1)
        th_list = re.findall(r'<th[^>]*>([\s\S]*?)<\/th>', thead_html)
        for th in th_list:
            text = re.sub(r'<[^>]+>', '', th).strip()
            text = text.replace('&#40;', '(').replace('&#41;', ')')
            if re.search(r'\d{4}\.\d{2}', text):
                dates.append(text)

    # Find rows
    # E.g., <th class="h_th2" scope="row"><span>매출액</span></th>
    # followed by numbers inside td
    rows = {}
    tbody_match = re.search(r'<tbody>([\s\S]*?)<\/tbody>', table_html)
    if tbody_match:
        tbody_html = tbody_match.group(1)
        # split by tr
        tr_list = re.findall(r'<tr[^>]*>([\s\S]*?)<\/tr>', tbody_html)
        for tr in tr_list:
            th_match = re.search(r'<th[^>]*>[\s\S]*?<(?:span|strong)[^>]*>([^<]+)<\/(?:span|strong)>', tr)
            if th_match:
                row_name = th_match.group(1).strip()
                # Find all tds
                tds = re.findall(r'<td[^>]*>\s*([^<\s]*)\s*<\/td>', tr)
                # clean up tds (remove commas, handle empty/dash)
                td_values = []
                for td in tds:
                    td_clean = td.replace(',', '').strip()
                    if td_clean == '-' or td_clean == '':
                        td_values.append(None)
                    else:
                        try:
                            td_values.append(float(td_clean))
                        except:
                            td_values.append(td_clean)
                rows[row_name] = td_values

    # Let's map the last annual column (column index 2 or 3)
    col_idx = 2
    if len(dates) > 3 and 'E' in dates[3]:
        # index 3 is estimate, index 2 is last actual
        col_idx = 2
    else:
        # no estimate, or index 3 is last actual
        col_idx = 3 if len(dates) > 3 else (len(dates) - 1 if len(dates) > 0 else 0)

    # 52주 최고/최저
    high_52w = None
    low_52w = None
    high_low_match = re.search(r'52주최고[\s\S]*?<td>\s*<em>([\d,]+)<\/em>[\s\S]*?<em>([\d,]+)<\/em>', html)
    if high_low_match:
        high_52w = float(high_low_match.group(1).replace(',', ''))
        low_52w = float(high_low_match.group(2).replace(',', ''))

    # 상장주식수
    shares = None
    shares_match = re.search(r'상장주식수[\s\S]*?<em>([\d,]+)<\/em>', html)
    if shares_match:
        shares = int(shares_match.group(1).replace(',', ''))

    # 시가총액
    market_cap = None
    market_sum_match = re.search(r'id="_market_sum"[\s\S]*?>([\s\S]*?)<\/em>억원', html)
    if market_sum_match:
        m_text = re.sub(r'\s+', '', market_sum_match.group(1))
        try:
            total_val = 0
            if '조' in m_text:
                parts = m_text.split('조')
                cho = float(parts[0].replace(',', ''))
                total_val += cho * 1e12
                if parts[1]:
                    eok = float(parts[1].replace(',', ''))
                    total_val += eok * 1e8
            else:
                eok = float(m_text.replace(',', ''))
                total_val += eok * 1e8
            market_cap = total_val
        except:
            pass

    # Let's print out all rows and dates to see what we got
    result = {
        'dates': dates,
        'col_idx': col_idx,
        'selected_date': dates[col_idx] if len(dates) > col_idx else None,
        'high52': high_52w,
        'low52': low_52w,
        'shares': shares,
        'marketCap': market_cap,
        'data': {k: (v[col_idx] if len(v) > col_idx else None) for k, v in rows.items()}
    }
    return result

if __name__ == '__main__':
    ticker = sys.argv[1] if len(sys.argv) > 1 else '005930'
    print(json.dumps(get_naver_financials(ticker), indent=2, ensure_ascii=False))
