import json
import math
import random

# Load genres
with open('../data/positioned_genres_with_mass.json', 'r') as f:
    genres = json.load(f)

# Build parent -> children map
parent_to_children = {}
for genre_name, genre_data in genres.items():
    parent = genre_data.get('parent')
    if parent:
        parent_to_children.setdefault(parent, []).append(genre_name)

# Sphere radius multiplier (controls spacing)
BASE_DISTANCE = 10
DISTANCE_PER_MASS = 5
PADDING = 3  # extra space between planets

def compute_size(mass):
    return max(0.5, math.sqrt(mass or 1))

def place_genre(name, center, distance_from_center):
    """Place a genre in 3D space around the given center"""
    theta = random.uniform(0, 2 * math.pi)
    phi = random.uniform(0, math.pi)

    r = distance_from_center

    x = center[0] + r * math.sin(phi) * math.cos(theta)
    y = center[1] + r * math.sin(phi) * math.sin(theta)
    z = center[2] + r * math.cos(phi)

    genres[name]['x'] = x
    genres[name]['y'] = y
    genres[name]['z'] = z

def recursively_place(name, center=(0, 0, 0), parent_distance=0):
    """Recursively place genre and its children"""
    mass = genres[name].get('mass', 1)
    size = compute_size(mass)
    distance = parent_distance + BASE_DISTANCE + size * DISTANCE_PER_MASS

    place_genre(name, center, distance)

    children = parent_to_children.get(name, [])
    for child in children:
        recursively_place(child, center=(genres[name]['x'], genres[name]['y'], genres[name]['z']), parent_distance=size + PADDING)

# Start placing from root genres (no parent)
roots = [name for name, data in genres.items() if data.get('parent') is None]

for root in roots:
    recursively_place(root)

# Save new positioned genres
with open('../data/positioned_genres_final.json', 'w') as f:
    json.dump(genres, f, indent=2)

print(f"✅ Final positions computed for {len(genres)} genres.")
