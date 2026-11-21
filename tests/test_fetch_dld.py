import datetime as dt
import json
import os
import unittest

from dataset import fetch_dld as f

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")


class TestHelpers(unittest.TestCase):
    def test_month_ranges_full_year(self):
        r = f.month_ranges(dt.date(2025, 11, 1), dt.date(2026, 10, 31))
        self.assertEqual(len(r), 12)
        self.assertEqual(r[0], ("11/01/2025", "11/30/2025"))
        self.assertEqual(r[3], ("02/01/2026", "02/28/2026"))
        self.assertEqual(r[-1], ("10/01/2026", "10/31/2026"))

    def test_month_ranges_partial(self):
        self.assertEqual(f.month_ranges(dt.date(2026, 1, 15), dt.date(2026, 2, 10)),
                         [("01/15/2026", "01/31/2026"), ("02/01/2026", "02/10/2026")])

    def test_payloads(self):
        s = f.sales_payload("10/01/2026", "10/31/2026", skip=40, take=20)
        self.assertEqual((s["P_AREA_ID"], s["P_GROUP_ID"], s["P_SKIP"], s["P_TAKE"]), ("C-82", "1", "40", "20"))
        r = f.rents_payload("10/01/2026", "10/31/2026")
        self.assertEqual((r["P_AREA_ID"], r["P_SKIP"]), ("441", "0"))
        self.assertTrue(all(isinstance(v, str) for v in {**s, **r}.values()))

    def test_rooms(self):
        self.assertEqual(f._rooms("1 B/R"), 1)
        self.assertEqual(f._rooms("Studio"), 0)
        self.assertIsNone(f._rooms("NA"))
        self.assertIsNone(f._rooms(None))

    def test_slim_sale(self):
        s = f.slim_sale({"TRANSACTION_NUMBER": "1-2", "INSTANCE_DATE": "2026-10-23T08:43:58", "PROCEDURE_EN": "Sale",
                         "IS_OFFPLAN_EN": "Ready", "IS_FREE_HOLD_EN": "Free Hold", "PROJECT_EN": "Dune Residency Dubai",
                         "ROOMS_EN": "2 B/R", "ACTUAL_AREA": 110.5, "TRANS_VALUE": 1500000})
        self.assertEqual((s["date"], s["off_plan"], s["freehold"], s["rooms"], s["size_sqm"], s["value_aed"]),
                         ("2026-10-23", False, True, 2, 110.5, 1500000))

    def test_slim_rent(self):
        r = f.slim_rent({"REGISTRATION_DATE": "2026-10-17T08:50:06", "START_DATE": "2026-10-01T00:00:00",
                         "VERSION_EN": "Renewed", "PROP_SUB_TYPE_EN": "Studio ", "ACTUAL_AREA": 40,
                         "ANNUAL_AMOUNT": 55000, "PROJECT_EN": None})
        self.assertEqual((r["registered"], r["start"], r["version"], r["sub_type"], r["annual_aed"], r["project"]),
                         ("2026-10-17", "2026-10-01", "Renewed", "Studio", 55000, None))

    def test_fetch_all_paginates(self):
        calls = []

        def fake_post(command, payload):
            calls.append((payload["P_FROM_DATE"], payload["P_SKIP"]))
            skip = int(payload["P_SKIP"])
            return [{"ANNUAL_AMOUNT": i} for i in range(skip, min(skip + 2, 5))]

        rows = f.fetch_all("rents", f.rents_payload, [("01/01/2026", "01/31/2026"), ("02/01/2026", "02/28/2026")],
                           f.slim_rent, post_fn=fake_post, page_size=2)
        self.assertEqual(len(rows), 10)
        self.assertEqual(calls[:3], [("01/01/2026", "0"), ("01/01/2026", "2"), ("01/01/2026", "4")])


class TestSnapshot(unittest.TestCase):
    """Sanity checks on the committed snapshot (skipped until it is fetched)."""

    def load(self, name):
        path = os.path.join(DATA_DIR, name)
        if not os.path.exists(path):
            self.skipTest(f"{name} not fetched yet")
        with open(path) as fh:
            return json.load(fh)

    def check_common(self, data, date_key):
        meta, rows = data["meta"], data["rows"]
        self.assertFalse(meta["synthetic"])
        self.assertEqual(meta["count"], len(rows))
        self.assertGreater(len(rows), 1000)
        lo, hi = meta["period"]
        self.assertTrue(all(lo <= r[date_key] <= hi for r in rows if r[date_key]))
        months = {r[date_key][:7] for r in rows if r[date_key]}
        expected = {m for m, _ in ((a[6:10] + "-" + a[:2], b) for a, b in f.month_ranges(
            dt.date.fromisoformat(lo), dt.date.fromisoformat(hi)))}
        self.assertEqual(months, expected)  # every month of the period has data

    def test_sales(self):
        d = self.load("dld_jvc_sales.json")
        self.check_common(d, "date")
        ready = [r for r in d["rows"] if not r["off_plan"] and r["value_aed"] and r["size_sqm"]]
        self.assertGreater(len(ready), 1000)
        ppsf = sorted(r["value_aed"] / (r["size_sqm"] * 10.7639) for r in ready)
        self.assertTrue(600 < ppsf[len(ppsf) // 2] < 3000)  # JVC median AED/sqft is in a sane band

    def test_rents(self):
        d = self.load("dld_jvc_rents.json")
        self.check_common(d, "registered")
        flats = sorted(r["annual_aed"] for r in d["rows"] if r["sub_type"] == "Flat" and r["annual_aed"])
        self.assertTrue(30000 < flats[len(flats) // 2] < 250000)


if __name__ == "__main__":
    unittest.main()
