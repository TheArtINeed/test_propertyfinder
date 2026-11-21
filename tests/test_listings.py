import json
import unittest

from dataset import generate_listings as g

REQUIRED = {"id", "purpose", "area", "building", "property_type", "bedrooms", "bathrooms", "size_sqft",
            "furnished", "lat", "lng", "nearest_metro", "metro_distance_m", "amenities", "agency", "agent",
            "verified", "tier", "listed_on", "price_aed", "price_period", "completion", "title"}


class TestListings(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = g.generate()
        cls.listings = cls.data["listings"]

    def test_deterministic(self):
        self.assertEqual(g.generate(), g.generate())
        self.assertNotEqual(g.generate(seed=1), g.generate(seed=2))

    def test_marked_synthetic(self):
        self.assertTrue(self.data["meta"]["synthetic"])
        self.assertEqual(self.data["meta"]["count"], len(self.listings))

    def test_required_fields_and_unique_ids(self):
        for l in self.listings:
            self.assertTrue(REQUIRED <= l.keys(), l["id"])
        ids = [l["id"] for l in self.listings]
        self.assertEqual(len(ids), len(set(ids)))

    def test_rent_and_sale_fields(self):
        purposes = {l["purpose"] for l in self.listings}
        self.assertEqual(purposes, {"rent", "sale"})
        for l in self.listings:
            if l["purpose"] == "rent":
                self.assertEqual(l["price_period"], "yearly")
                self.assertIn(l["cheques"], g.CHEQUES)
                self.assertEqual(l["completion"], "ready")
            else:
                self.assertEqual(l["price_period"], "total")
                self.assertNotIn("cheques", l)
                if l["completion"] == "off_plan":
                    self.assertTrue(g.AREAS[l["area"]]["offplan"])
                    self.assertIsNotNone(l["payment_plan"])

    def test_rent_within_benchmark_band(self):
        for l in (x for x in self.listings if x["purpose"] == "rent"):
            table = g.VILLA if l["property_type"] == "villa" else g.APARTMENT
            base = (g.AREAS[l["area"]]["rent_1br"] or g.VILLA_BASE_1BR) * table[l["bedrooms"]][0]
            self.assertGreaterEqual(l["price_aed"], base * 0.80, l["id"])
            self.assertLessEqual(l["price_aed"], base * 1.25, l["id"])

    def test_sale_price_matches_price_per_sqft(self):
        for l in (x for x in self.listings if x["purpose"] == "sale"):
            ppsf = l["price_aed"] / l["size_sqft"]
            ref = g.AREAS[l["area"]]["ppsf"]
            self.assertGreaterEqual(ppsf, ref * 0.75, l["id"])
            self.assertLessEqual(ppsf, ref * 1.20, l["id"])

    def test_sizes_match_bedrooms(self):
        for l in self.listings:
            table = g.VILLA if l["property_type"] == "villa" else g.APARTMENT
            _, smin, smax = table[l["bedrooms"]]
            self.assertTrue(smin - 10 <= l["size_sqft"] <= smax + 10, l["id"])

    def test_villas_only_where_allowed(self):
        for l in self.listings:
            if l["property_type"] == "villa":
                self.assertTrue(g.AREAS[l["area"]]["villas"], l["id"])

    def test_metro_is_nearest_and_distance_consistent(self):
        for l in self.listings:
            dists = {n: g.haversine_m(l["lat"], l["lng"], *c) for n, c in g.METRO.items()}
            self.assertEqual(l["nearest_metro"], min(dists, key=dists.get))
            self.assertAlmostEqual(l["metro_distance_m"], dists[l["nearest_metro"]], delta=1)

    def test_haversine_known_distance(self):
        # 0.01 degree of latitude is ~1,112 m
        self.assertAlmostEqual(g.haversine_m(25.0, 55.0, 25.01, 55.0), 1112, delta=2)

    def test_json_file_in_sync(self):
        on_disk = json.loads(g.OUT_PATH.read_text())
        self.assertEqual(on_disk, json.loads(json.dumps(g.generate())))


if __name__ == "__main__":
    unittest.main()
