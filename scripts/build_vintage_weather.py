#!/usr/bin/env python3
"""Precompute a small, reproducible ERA5 regional-proxy vintage cache.

Never called from the browser. Requires explicit --refresh for network access.
"""
import argparse
import json
from datetime import date, timedelta
from pathlib import Path
from statistics import mean
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
REGIONS = {
    'sancerre': {'label': 'Sancerre area (town proxy)', 'lat': 47.331, 'lon': 2.840, 'hemisphere': 'north', 'season': 'Apr–Sep', 'locationNote': 'One grid cell near Sancerre; vineyards vary by slope and site.'},
    'marlborough': {'label': 'Marlborough (Blenheim proxy)', 'lat': -41.513, 'lon': 173.961, 'hemisphere': 'south', 'season': 'Oct–Mar', 'locationNote': 'One grid cell near Blenheim; this cannot represent all Marlborough valleys.'},
    'central-otago': {'label': 'Central Otago (Cromwell proxy)', 'lat': -45.038, 'lon': 169.196, 'hemisphere': 'south', 'season': 'Oct–Mar', 'locationNote': 'One grid cell near Cromwell; altitude and valley differences can be large.'},
}
SOURCE = 'https://archive-api.open-meteo.com/v1/archive'
DAILY = 'temperature_2m_mean,temperature_2m_max,precipitation_sum'
BASELINE = list(range(2000, 2021))
MATURITY_DAYS = 60  # after this proxy season ends; reviewed before publishing

def dates(year, hemisphere):
    return (date(year, 4, 1), date(year, 9, 30)) if hemisphere == 'north' else (date(year - 1, 10, 1), date(year, 3, 31))

def vintages(region, today):
    return [year for year in range(2000, today.year + 1) if dates(year, region['hemisphere'])[1] + timedelta(days=MATURITY_DAYS) <= today]

def fetch(region):
    years = vintages(region, date.today())
    start = min(dates(year, region['hemisphere'])[0] for year in years)
    end = max(dates(year, region['hemisphere'])[1] for year in years)
    params = {'latitude': region['lat'], 'longitude': region['lon'], 'start_date': start.isoformat(), 'end_date': end.isoformat(), 'daily': DAILY, 'models': 'era5', 'timezone': 'UTC'}
    with urlopen(SOURCE + '?' + urlencode(params), timeout=90) as response:
        result = json.load(response)
    if result.get('error'): raise ValueError(result)
    daily = result['daily']
    if not all(len(daily[k]) == len(daily['time']) for k in ['temperature_2m_mean', 'temperature_2m_max', 'precipitation_sum']): raise ValueError('Incomplete response arrays')
    return ({day: (daily['temperature_2m_mean'][i], daily['temperature_2m_max'][i], daily['precipitation_sum'][i]) for i, day in enumerate(daily['time'])}, {'lat': result['latitude'], 'lon': result['longitude'], 'elevationM': result['elevation']})

def measure(rows, year, hemisphere):
    start, end = dates(year, hemisphere)
    days = [rows[(start + timedelta(days=i)).isoformat()] for i in range((end - start).days + 1)]
    if any(any(v is None or not isinstance(v, (int, float)) for v in day) for day in days): raise ValueError(f'Missing weather data in {year}')
    return {'meanC': round(mean(d[0] for d in days), 2), 'rainMm': round(sum(d[2] for d in days), 1), 'hotDays30': sum(d[1] >= 30 for d in days), 'gdd10': round(sum(max(d[0] - 10, 0) for d in days))}

def build(region, rows, grid):
    values = {year: measure(rows, year, region['hemisphere']) for year in vintages(region, date.today())}
    base = {key: round(mean(values[y][key] for y in BASELINE), 2) for key in ['meanC', 'rainMm', 'hotDays30', 'gdd10']}
    return {'schema': 1, 'region': {**region, 'grid': grid}, 'source': {'provider': 'Open-Meteo', 'model': 'ERA5', 'variables': DAILY.split(','), 'url': 'https://open-meteo.com/en/docs/historical-weather-api', 'license': 'CC BY 4.0', 'baseline': '2000–2020', 'retrievedOn': date.today().isoformat(), 'resolution': '0.25° grid (~25 km)', 'timezone': 'UTC', 'maturityRule': '60 days after proxy growing-season end; manual review before publication'}, 'baseline': base, 'years': {str(year): values[year] for year in values}}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--refresh', action='store_true', required=True, help='Explicit network fetch and overwrite')
    args = parser.parse_args()
    for id, region in REGIONS.items():
        output = ROOT / 'data' / 'vintage' / f'{id}.json'
        rows, grid = fetch(region)
        data = build(region, rows, grid)
        output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        print(id, len(data['years']), 'vintages', output)
