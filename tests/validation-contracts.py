"""Exercise real validation boundaries using isolated in-memory data fixtures."""
import contextlib
import copy
import importlib.util
import io
import json
import sys
sys.dont_write_bytecode = True
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result
validate = module('validate', 'validate.py')
audit = module('audit', 'content_audit.py')
original = {p.name: json.loads(p.read_text()) for p in (ROOT / 'data').glob('*.json')}
def run(data, checker=validate):
    checker.load = lambda path: copy.deepcopy(data[Path(path).name])
    output = io.StringIO()
    with contextlib.redirect_stdout(output): checker.main()
    return output.getvalue()
def rejected(mutator, message):
    data = copy.deepcopy(original)
    mutator(data)
    try: run(data)
    except (AssertionError, ValueError): return
    raise AssertionError(message)

# Identical rounded values remain legitimate; the advisory identifies them.
data = copy.deepcopy(original)
data['regions.json']['napa']['grapes']['cabernet-sauvignon']['mods'] = copy.deepcopy(data['regions.json']['bordeaux']['grapes']['cabernet-sauvignon']['mods'])
assert 'OK:' in run(data)
assert 'identical rounded scores (allowed' in run(data, audit)
rejected(lambda d: d['regions.json']['napa']['grapes']['cabernet-sauvignon']['mods'].update(body=float('nan')), 'NaN modifier accepted')
rejected(lambda d: d['grapes.json']['merlot'].update(body=True), 'Boolean metric accepted')
rejected(lambda d: d['regions.json']['vouvray']['grapes']['chenin-blanc']['evidence'][0]['sources'].append('missing-source'), 'Broken evidence reference accepted')
rejected(lambda d: d['regions.json']['vouvray']['grapes']['chenin-blanc']['evidence'][0].update(sources=['oxford-companion']), 'Background-only reference promoted to claim evidence')
rejected(lambda d: d['regions.json']['vouvray']['grapes']['chenin-blanc']['style'].pop('composition'), 'Missing blend status accepted')
rejected(lambda d: d['regions.json']['vouvray']['grapes']['chenin-blanc']['style'].update(sweetness='dry'), 'Contradictory sweetness accepted')
rejected(lambda d: d['regions.json']['tokaj']['grapes']['furmint']['related'][0].update(region='missing'), 'Broken related-expression link accepted')
rejected(lambda d: d['regions.json']['tokaj']['grapes']['furmint'].update(ageingBasis='unclear'), 'Unknown ageing basis accepted')
rejected(lambda d: d['sources.json']['tokaj-dry-example'].update(reviewedOn='not-a-date'), 'Invalid review date accepted')
rejected(lambda d: next(s for s in d['taste-basics.json']['sections'] if s['id'] == 'bubbles')['sources'].append('missing-guide-source'), 'Broken section evidence accepted')
rejected(lambda d: d['regions.json']['moscato-dasti']['grapes']['muscat-blanc']['style'].update(productionClass='traditional-bottle', effervescence='gentle'), 'Inconsistent production/bubble metadata accepted')
rejected(lambda d: d['regions.json']['cava']['grapes']['macabeo']['style'].update(productionClass='botrytised'), 'Wrong-family production class accepted')
rejected(lambda d: d['regions.json']['rueda']['grapes']['verdejo']['style'].update(productionClass='dried-grape-red'), 'White wine accepted with dried-grape-red production')
rejected(lambda d: d['regions.json']['primitivo-manduria']['grapes']['zinfandel'].update(displayName=7), 'Invalid display name accepted')
rejected(lambda d: d['wine-search.json']['rules'].append({'id':'bad-coverage','label':'Bad coverage','aliases':['missing-example'],'unavailable':True}), 'Unavailable query without coverage explanation accepted')
rejected(lambda d: d['regions.json']['jerez-px']['grapes']['pedro-ximenez']['style'].update(color='ebony'), 'Unknown wine colour accepted')
rejected(lambda d: d['regions.json']['jerez-fino']['grapes']['palomino']['style'].update(effervescence='sparkling'), 'Sparkling Fino accepted')
rejected(lambda d: d['regions.json']['vinho-verde-alvarinho']['grapes']['albarino']['style'].update(productionClass='fortified-flor'), 'Still Alvarinho accepted with flor fortification class')
print('OK: duplicate scores advisory; invalid metrics, metadata, evidence and links still block validation')

# Flights must remain meaningful atomic comparisons as the catalog evolves.
rejected(lambda d: d['tasting-flights.json'][0]['wines'][0].update(region='missing'), 'Unknown flight wine accepted')
rejected(lambda d: d['tasting-flights.json'][0]['wines'].__setitem__(1, copy.deepcopy(d['tasting-flights.json'][0]['wines'][0])), 'Duplicate flight wine accepted')
rejected(lambda d: d['tasting-flights.json'][0]['wines'].__setitem__(1, {'grape':'cabernet-sauvignon','region':'napa'}), 'Incompatible flight accepted')
rejected(lambda d: d['tasting-flights.json'][1].update(id=d['tasting-flights.json'][0]['id']), 'Duplicate flight ID accepted')
rejected(lambda d: d['tasting-flights.json'][0].update(observations=['only one']), 'Missing observation prompts accepted')
rejected(lambda d: d['tasting-flights.json'][0].update(limitation=''), 'Missing flight limitations accepted')
print('OK: flight identities, references, compatibility and lesson contracts')

# The short journey uses the existing definitions, profiles, flights and guide.
rejected(lambda d: d['beginner-journey.json']['lessons'][0].update(id='start'), 'Reserved/invalid journey ID accepted')
rejected(lambda d: d['beginner-journey.json']['lessons'][0].update(glossary='unknown'), 'Unknown journey definition accepted')
rejected(lambda d: d['beginner-journey.json']['lessons'][0]['profile'].update(region='unknown'), 'Unknown journey example accepted')
rejected(lambda d: d['beginner-journey.json']['lessons'][0].update(flight='unknown'), 'Unknown journey flight accepted')
rejected(lambda d: d['beginner-journey.json']['lessons'][0].update(guideSection='unknown'), 'Unknown journey guide section accepted')
rejected(lambda d: d['beginner-journey.json'].update(firstFlight='unknown'), 'Unknown first-comparison flight accepted')
rejected(lambda d: d['beginner-journey.json']['lessons'][0].update(exercise=''), 'Missing observation exercise accepted')
print('OK: beginner journey sequence, definitions, observation prompts and linked references')

# Practical lessons must retain usable teaching content and canonical examples.
rejected(lambda d: d['beginner-journey.json']['practice']['contrasts']['tannin']['wines'][0].update(grape='riesling', region='clare-valley'), 'White substituted for tannin practice')
rejected(lambda d: d['beginner-journey.json']['practice']['contrasts']['acidity'].update(references=['missing']), 'Unknown teaching reference accepted')
rejected(lambda d: d['beginner-journey.json']['practice']['method'][0].update(body=''), 'Empty tasting instruction accepted')
rejected(lambda d: d['beginner-journey.json']['practice']['contrasts']['body']['wines'][0].update(region='missing'), 'Unknown practical profile accepted')
print('OK: practical tasting steps, references and contrasting profiles')

rejected(lambda d: d['aroma-practice.json']['samples'][0].update(family='missing'), 'Unknown aroma family accepted')
rejected(lambda d: d['aroma-practice.json']['samples'][1].update(id=d['aroma-practice.json']['samples'][0]['id']), 'Duplicate aroma identity accepted')
rejected(lambda d: d['aroma-practice.json']['samples'][0].update(prepare=''), 'Empty reference preparation accepted')
rejected(lambda d: d['aroma-practice.json']['sources'][0].update(url='javascript:alert(1)'), 'Unsafe aroma source accepted')
print('OK: aroma families, reference identities, preparation and sources')

rejected(lambda d: d['label-guidance.json']['bordeaux/cabernet-sauvignon'].update(match=''), 'Empty label meaning accepted')
rejected(lambda d: d['label-guidance.json']['prosecco-doc/glera'].update(sources=['prosecco-doc']), 'Background-only label source accepted')
rejected(lambda d: d['label-guidance.json']['chablis/chardonnay']['alternatives'].append({'grape':'missing','region':'bordeaux','label':'Unknown'}), 'Unknown label alternative accepted')
rejected(lambda d: d['label-guidance.json']['amarone/corvina'].update(terms=['unknown']), 'Unknown glossary term accepted')
rejected(lambda d: d['glossary.json']['pre-post-phylloxera']['examples'][0].update(source='missing'), 'Unsourced vineyard example accepted')
print('OK: scoped label guidance and documented vineyard examples')
