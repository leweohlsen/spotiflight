import json
from collections import defaultdict

# Load genres
with open('../data/positioned_genres.json', 'r') as f:
    genres = json.load(f)

# Build parent -> children map
children_map = defaultdict(list)
for genre_name, genre_data in genres.items():
    parent = genre_data.get('parent')
    if parent:
        children_map[parent].append(genre_name)

def count_descendants(genre_name: str) -> int:
    """Recursively count all descendants"""
    children = children_map.get(genre_name, [])
    count = len(children)
    for child in children:
        count += count_descendants(child)
    return count

def count_ancestors(genre_name: str) -> int:
    """Walk up the tree to count ancestors"""
    current = genres[genre_name]
    count = 0
    while current.get('parent'):
        count += 1
        current = genres[current['parent']]
    return count

# Compute mass
for genre_name in genres.keys():
    ancestors = count_ancestors(genre_name)
    descendants = count_descendants(genre_name)
    mass = ancestors + descendants
    genres[genre_name]['mass'] = mass

# Save new genres with mass
with open('../data/positioned_genres_with_mass.json', 'w') as f:
    json.dump(genres, f, indent=2)

print(f"✅ Added mass to {len(genres)} genres")
