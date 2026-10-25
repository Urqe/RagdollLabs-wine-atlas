from datetime import date
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build_vintage_weather import dates, measure, vintages, REGIONS
assert dates(2024, 'north') == (date(2024, 4, 1), date(2024, 9, 30))
assert dates(2024, 'south') == (date(2023, 10, 1), date(2024, 3, 31))
assert 2026 not in vintages(REGIONS['sancerre'], date(2026, 10, 25))
assert 2026 in vintages(REGIONS['marlborough'], date(2026, 10, 25))
start, end = dates(2000, 'south')
from datetime import timedelta
rows = {(start + timedelta(days=i)).isoformat(): (15, 31 if i == 0 else 25, 2) for i in range((end-start).days+1)}
result = measure(rows, 2000, 'south')
assert result['hotDays30'] == 1 and result['rainMm'] == len(rows)*2
assert result['gdd10'] == len(rows)*5
print('OK: north/south vintage-year bounds, maturity gate and daily aggregation')
