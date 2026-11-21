"""Synthetic Dubai listings for the prototype (toy dataset).

Not real listings. Prices are drawn around public area benchmarks; buildings,
agents and agencies are invented. Coordinates are approximate.
Regenerate: python3 -m dataset.generate_listings
"""
import json
import random
from datetime import date, timedelta
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

SEED = 42
N_LISTINGS = 150
RENT_SHARE = 0.65
OUT_PATH = Path(__file__).with_name("listings.json")
TODAY = date(2026, 11, 21)  # fixed so output is reproducible

# Annual 1BR rent (AED) and sale price per sq ft (AED) by area.
# Sources: Engel & Voelkers YTD May 2026 (Marina, Business Bay, Downtown 1BR rents);
# other values are assumptions in line with public 2026 market reports.
AREAS = {
    "Downtown Dubai": {"lat": 25.1972, "lng": 55.2744, "rent_1br": 120_000, "ppsf": 2_600, "src": "fact: E&V 2026", "villas": False, "offplan": False},
    "Business Bay": {"lat": 25.1850, "lng": 55.2650, "rent_1br": 94_000, "ppsf": 2_000, "src": "fact: E&V 2026", "villas": False, "offplan": True},
    "Dubai Marina": {"lat": 25.0805, "lng": 55.1403, "rent_1br": 97_000, "ppsf": 2_000, "src": "fact: E&V 2026", "villas": False, "offplan": False},
    "Jumeirah Lake Towers": {"lat": 25.0693, "lng": 55.1418, "rent_1br": 85_000, "ppsf": 1_400, "src": "assumption", "villas": False, "offplan": False},
    "Jumeirah Village Circle": {"lat": 25.0590, "lng": 55.2090, "rent_1br": 75_000, "ppsf": 1_200, "src": "assumption: sources range 46-85K", "villas": True, "offplan": True},
    "Palm Jumeirah": {"lat": 25.1124, "lng": 55.1390, "rent_1br": 170_000, "ppsf": 3_500, "src": "assumption", "villas": True, "offplan": False},
    "Dubai Hills Estate": {"lat": 25.1030, "lng": 55.2480, "rent_1br": 110_000, "ppsf": 2_000, "src": "assumption", "villas": True, "offplan": True},
    "Al Barsha": {"lat": 25.1100, "lng": 55.2000, "rent_1br": 70_000, "ppsf": 1_300, "src": "assumption", "villas": False, "offplan": False},
    "Dubai South": {"lat": 24.9000, "lng": 55.1500, "rent_1br": 50_000, "ppsf": 1_000, "src": "assumption", "villas": True, "offplan": True},
    "International City": {"lat": 25.1650, "lng": 55.4100, "rent_1br": 38_000, "ppsf": 700, "src": "assumption", "villas": False, "offplan": False},
    "Arabian Ranches": {"lat": 25.0550, "lng": 55.2700, "rent_1br": None, "ppsf": 1_600, "src": "assumption", "villas": True, "offplan": False},
}

# Approximate station coordinates (not from an official file).
METRO = {
    "Burj Khalifa/Dubai Mall": (25.2013, 55.2696),
    "Business Bay": (25.1913, 55.2603),
    "DMCC": (25.0710, 55.1387),
    "Dubai Marina": (25.0802, 55.1477),
    "Dubai Internet City": (25.1022, 55.1733),
    "Mall of the Emirates": (25.1213, 55.2003),
    "Expo 2020": (24.9632, 55.1480),
    "Rashidiya": (25.2303, 55.3910),
}

# Rent multiplier vs 1BR and typical size (sq ft) by bedrooms. Assumptions.
APARTMENT = {0: (0.70, 420, 520), 1: (1.00, 700, 900), 2: (1.55, 1_100, 1_400), 3: (2.20, 1_500, 2_000)}
VILLA = {3: (3.0, 2_400, 3_200), 4: (3.8, 3_200, 4_200), 5: (4.8, 4_200, 5_500)}
VILLA_BASE_1BR = 75_000  # used where an area has no apartment benchmark

CHEQUES = [1, 2, 4, 6, 12]
CHEQUE_PREMIUM = {1: 0.97, 2: 0.98, 4: 1.0, 6: 1.02, 12: 1.05}  # fewer cheques -> small discount
AMENITIES = ["Balcony", "Shared pool", "Private pool", "Gym", "Covered parking", "Maid's room",
             "Study", "Sea view", "Burj view", "Kids play area", "Concierge", "Built-in wardrobes"]
AGENCIES = ["Harbour & Dune Realty", "Crescent Key Properties", "Palmline Estates",
            "Northgate Homes", "Silver Falcon Realty"]
AGENT_FIRST = ["Sara", "Omar", "Priya", "James", "Layla", "Arjun", "Elena", "Yusuf", "Mei", "Daniel", "Aisha", "Ivan"]
BUILDING_A = ["Azure", "Lumen", "Saffron", "Cedar", "Opal", "Marlin", "Juniper", "Solace", "Amber", "Tidal"]
BUILDING_B = ["Residences", "Tower", "Heights", "Court", "Gardens", "Views"]
OFFPLAN_PLANS = ["20/80", "30/70", "40/60", "60/40 post-handover"]
TIERS = [("standard", 0.6), ("featured", 0.25), ("premium", 0.15)]


def haversine_m(lat1, lng1, lat2, lng2):
    """Great-circle distance in metres."""
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * 6_371_000 * asin(sqrt(a))


def nearest_metro(lat, lng):
    name, (slat, slng) = min(METRO.items(), key=lambda kv: haversine_m(lat, lng, *kv[1]))
    return name, round(haversine_m(lat, lng, slat, slng))


def _round_to(x, step):
    return int(round(x / step) * step)


def _pick_weighted(rng, items):
    r, acc = rng.random(), 0.0
    for value, w in items:
        acc += w
        if r < acc:
            return value
    return items[-1][0]


def make_listing(i, rng):
    area_name = rng.choice(list(AREAS))
    area = AREAS[area_name]
    purpose = "rent" if rng.random() < RENT_SHARE else "sale"
    is_villa = area["villas"] and (area["rent_1br"] is None or rng.random() < 0.35)
    if is_villa:
        ptype, beds = "villa", rng.choice(list(VILLA))
        mult, smin, smax = VILLA[beds]
    else:
        ptype, beds = "apartment", rng.choice(list(APARTMENT))
        mult, smin, smax = APARTMENT[beds]
    size = _round_to(rng.uniform(smin, smax), 10)
    lat = round(area["lat"] + rng.uniform(-0.008, 0.008), 5)
    lng = round(area["lng"] + rng.uniform(-0.008, 0.008), 5)
    metro, metro_m = nearest_metro(lat, lng)

    listing = {
        "id": f"SYN-{i:04d}",
        "purpose": purpose,
        "area": area_name,
        "building": f"{rng.choice(BUILDING_A)} {rng.choice(BUILDING_B)}",
        "property_type": ptype,
        "bedrooms": beds,
        "bathrooms": max(1, beds + (1 if beds >= 2 else 0) - rng.choice([0, 0, 1])),
        "size_sqft": size,
        "furnished": rng.random() < 0.45,
        "lat": lat,
        "lng": lng,
        "nearest_metro": metro,
        "metro_distance_m": metro_m,
        "amenities": sorted(rng.sample(AMENITIES, rng.randint(2, 5))),
        "agency": rng.choice(AGENCIES),
        "agent": f"{rng.choice(AGENT_FIRST)} {chr(65 + rng.randrange(26))}.",
        "verified": rng.random() < 0.7,
        "tier": _pick_weighted(rng, TIERS),
        "listed_on": (TODAY - timedelta(days=rng.randint(0, 60))).isoformat(),
    }

    if purpose == "rent":
        base = (area["rent_1br"] or VILLA_BASE_1BR) * mult
        cheques = rng.choice(CHEQUES)
        listing.update({
            "price_aed": _round_to(base * rng.uniform(0.85, 1.15) * CHEQUE_PREMIUM[cheques], 1_000),
            "price_period": "yearly",
            "cheques": cheques,
            "pets_allowed": rng.random() < (0.6 if is_villa else 0.25),
            "available_from": (TODAY + timedelta(days=rng.randint(0, 75))).isoformat(),
            "completion": "ready",
        })
    else:
        offplan = area["offplan"] and rng.random() < 0.75  # Dubai: ~63-65% of deals are off-plan (DLD 2025)
        price = area["ppsf"] * size * rng.uniform(0.85, 1.15) * (0.92 if offplan else 1.0)
        listing.update({
            "price_aed": _round_to(price, 5_000),
            "price_period": "total",
            "completion": "off_plan" if offplan else "ready",
            "handover": f"Q{rng.randint(1, 4)} {rng.choice([2027, 2028, 2029])}" if offplan else None,
            "payment_plan": rng.choice(OFFPLAN_PLANS) if offplan else None,
        })

    beds_txt = "Studio" if beds == 0 else f"{beds}-bedroom"
    listing["title"] = f"{beds_txt} {ptype} in {listing['building']}, {area_name}"
    return listing


def generate(seed=SEED, n=N_LISTINGS):
    rng = random.Random(seed)
    return {
        "meta": {
            "synthetic": True,
            "note": "Toy dataset for a prototype. Not real listings. Prices drawn around public area "
                    "benchmarks (see dataset/generate_listings.py); buildings, agents and agencies are invented; "
                    "coordinates approximate.",
            "seed": seed,
            "generated_for_date": TODAY.isoformat(),
            "count": n,
        },
        "listings": [make_listing(i + 1, rng) for i in range(n)],
    }


def write(path=OUT_PATH):
    path.write_text(json.dumps(generate(), indent=2, ensure_ascii=False) + "\n")
    return path


if __name__ == "__main__":
    print(f"Wrote {write()}")
