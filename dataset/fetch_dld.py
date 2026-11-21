"""Fetch real DLD open data for Jumeirah Village Circle (JVC), 1 Jan - 20 Nov 2026.

The open-data endpoints only return the current calendar year (earlier dates return 0 rows),
so this is the longest window available without a Dubai Pulse API key.

Source: Dubai Land Department open data (https://dubailand.gov.ae/en/open-data/real-estate-data/),
the same public endpoints the page uses. No key needed.

- Sales: transactions, group "Sales", community JVC (DLD community id C-82).
- Rents: Ejari contracts registered in land area "Al Barsha South Fourth" (DLD area id 441), which is JVC.

Run: python3 -m dataset.fetch_dld
Output: dataset/dld_jvc_sales.json, dataset/dld_jvc_rents.json (snapshot, committed to the repo).
"""

import calendar
import datetime as dt
import json
import os
import time
import urllib.request

API = "https://gateway.dubailand.gov.ae/open-data"
SOURCE_PAGE = "https://dubailand.gov.ae/en/open-data/real-estate-data/"
SALES_COMMUNITY_ID = "C-82"  # JUMEIRAH VILLAGE CIRCLE
RENT_AREA_ID = "441"  # Al Barsha South Fourth (= JVC)
SALES_GROUP_ID = "1"
PAGE_SIZE = 20000
PERIOD = (dt.date(2026, 1, 1), dt.date(2026, 11, 20))  # all the open-data page serves: it starts on 1 Jan of the current year
OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def month_ranges(start, end):
    """Split [start, end] into calendar-month chunks, as DLD date strings (MM/DD/YYYY)."""
    out = []
    cur = dt.date(start.year, start.month, 1)
    while cur <= end:
        last = dt.date(cur.year, cur.month, calendar.monthrange(cur.year, cur.month)[1])
        a, b = max(cur, start), min(last, end)
        out.append((a.strftime("%m/%d/%Y"), b.strftime("%m/%d/%Y")))
        cur = last + dt.timedelta(days=1)
    return out


def sales_payload(date_from, date_to, skip=0, take=PAGE_SIZE):
    return {
        "P_FROM_DATE": date_from, "P_TO_DATE": date_to, "P_GROUP_ID": SALES_GROUP_ID,
        "P_IS_OFFPLAN": "", "P_IS_FREE_HOLD": "", "P_AREA_ID": SALES_COMMUNITY_ID,
        "P_USAGE_ID": "", "P_PROP_TYPE_ID": "",
        "P_TAKE": str(take), "P_SKIP": str(skip), "P_SORT": "TRANSACTION_NUMBER_ASC",
    }


def rents_payload(date_from, date_to, skip=0, take=PAGE_SIZE):
    return {
        "P_FROM_DATE": date_from, "P_TO_DATE": date_to, "P_DATE_TYPE": "0",
        "P_IS_FREE_HOLD": "", "P_VERSION": "", "P_AREA_ID": RENT_AREA_ID,
        "P_USAGE_ID": "", "P_PROP_TYPE_ID": "",
        "P_TAKE": str(take), "P_SKIP": str(skip), "P_SORT": "DEFAULT_SORT_ASC",
    }


def _date(s):
    return s[:10] if s else None


def _rooms(s):
    """'1 B/R' -> 1, 'Studio' -> 0, 'NA'/None -> None."""
    if not s:
        return None
    s = str(s).strip()
    if s.lower().startswith("studio"):
        return 0
    head = s.split()[0]
    return int(head) if head.isdigit() else None


def slim_sale(r):
    size = r.get("ACTUAL_AREA") or r.get("PROCEDURE_AREA")
    return {
        "id": r.get("TRANSACTION_NUMBER"),
        "date": _date(r.get("INSTANCE_DATE")),
        "procedure": r.get("PROCEDURE_EN"),
        "off_plan": r.get("IS_OFFPLAN_EN") == "Off-Plan",
        "freehold": r.get("IS_FREE_HOLD_EN") == "Free Hold",
        "project": r.get("PROJECT_EN"),
        "master_project": r.get("MASTER_PROJECT_EN"),
        "type": r.get("PROP_TYPE_EN"),
        "sub_type": r.get("PROP_SB_TYPE_EN"),
        "usage": r.get("USAGE_EN"),
        "rooms": _rooms(r.get("ROOMS_EN")),
        "size_sqm": size,
        "value_aed": r.get("TRANS_VALUE"),
        "parking": r.get("PARKING"),
        "nearest_metro": r.get("NEAREST_METRO_EN"),
    }


def slim_rent(r):
    return {
        "registered": _date(r.get("REGISTRATION_DATE")),
        "start": _date(r.get("START_DATE")),
        "end": _date(r.get("END_DATE")),
        "version": r.get("VERSION_EN"),
        "project": r.get("PROJECT_EN"),
        "type": r.get("PROP_TYPE_EN"),
        "sub_type": (r.get("PROP_SUB_TYPE_EN") or "").strip() or None,
        "usage": r.get("USAGE_EN"),
        "rooms": r.get("ROOMS"),
        "size_sqm": r.get("ACTUAL_AREA"),
        "annual_aed": r.get("ANNUAL_AMOUNT"),
        "contract_aed": r.get("CONTRACT_AMOUNT"),
        "freehold": r.get("IS_FREE_HOLD_EN") == "Free Hold",
        "nearest_metro": r.get("NEAREST_METRO_EN"),
    }


def post(command, payload, retries=3):
    req = urllib.request.Request(
        f"{API}/{command}", data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "pf-prototype-data-fetch"},
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=240) as resp:
                return json.loads(resp.read())["response"]["result"]
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(5 * (attempt + 1))


def fetch_all(command, payload_fn, ranges, slim, post_fn=post, page_size=PAGE_SIZE):
    """Fetch every page of every date range; returns slimmed rows."""
    rows = []
    for date_from, date_to in ranges:
        skip = 0
        while True:
            page = post_fn(command, payload_fn(date_from, date_to, skip, page_size))
            rows.extend(slim(r) for r in page)
            if len(page) < page_size:
                break
            skip += page_size
        print(f"{command} {date_from}-{date_to}: total {len(rows)}", flush=True)
    return rows


def write(name, rows, description):
    meta = {
        "source": "Dubai Land Department open data",
        "source_url": SOURCE_PAGE,
        "description": description,
        "period": [PERIOD[0].isoformat(), PERIOD[1].isoformat()],
        "fetched_on": dt.date.today().isoformat(),
        "count": len(rows),
        "synthetic": False,
    }
    with open(os.path.join(OUT_DIR, name), "w") as f:
        json.dump({"meta": meta, "rows": rows}, f, separators=(",", ":"))


def main():
    ranges = month_ranges(*PERIOD)
    sales = fetch_all("transactions", sales_payload, ranges, slim_sale)
    write("dld_jvc_sales.json", sales, "DLD sales transactions, community Jumeirah Village Circle")
    rents = fetch_all("rents", rents_payload, ranges, slim_rent)
    write("dld_jvc_rents.json", rents, "Ejari rent contracts, land area Al Barsha South Fourth (JVC)")


if __name__ == "__main__":
    main()
