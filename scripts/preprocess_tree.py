# preprocess_tree.py
import json
import math
import random

# Load your genres
with open('../data/genres.json', 'r') as f:
    genres_list = json.load(f)

# Build a name -> genre map
genre_map = {genre["name"]: genre for genre in genres_list}

# Step 1: Build hierarchy
tree = {}
for genre in genres_list:
    genre["children"] = []
    genre["parent"] = None

# Find parent by substring (could refine later!)
for genre in genres_list:
    name = genre["name"]
    for potential_parent in genres_list:
        if potential_parent["name"] in name and potential_parent["name"] != name:
            genre["parent"] = potential_parent["name"]
            genre_map[potential_parent["name"]]["children"].append(name)
            break

# Step 2: Positioning
positioned = {}

def place_node(name, center, base_radius, depth):
    # Place node at random angle
    angle = random.uniform(0, 2 * math.pi)
    radius = base_radius + depth * 10  # deeper levels = further spacing
    x = center["x"] + radius * math.cos(angle)
    z = center["z"] + radius * math.sin(angle)
    y = center["y"] + random.uniform(-5, 5)

    positioned[name] = {
        "x": x,
        "y": y,
        "z": z,
        "color": genre_map[name]["color"],
        "preview_url": genre_map[name]["preview_url"],
        "parent": genre_map[name]["parent"]
    }

    # Recursively place children
    for child_name in genre_map[name]["children"]:
        place_node(child_name, {"x": x, "y": y, "z": z}, base_radius=10, depth=depth + 1)

# Place main genres around the sun
sun_center = {"x": 0, "y": 0, "z": 0}
main_genres = [g for g in genres_list if g["parent"] is None]
angle_step = (2 * math.pi) / len(main_genres)
current_angle = 0
RADIUS_FROM_SUN = 300

for genre in main_genres:
    x = sun_center["x"] + RADIUS_FROM_SUN * math.cos(current_angle)
    z = sun_center["z"] + RADIUS_FROM_SUN * math.sin(current_angle)
    y = random.uniform(-20, 20)
    positioned[genre["name"]] = {
        "x": x,
        "y": y,
        "z": z,
        "color": genre["color"],
        "preview_url": genre["preview_url"],
        "parent": None
    }
    # Place children recursively
    for child_name in genre["children"]:
        place_node(child_name, {"x": x, "y": y, "z": z}, base_radius=10, depth=1)

    current_angle += angle_step

# Save
with open('../data/positioned_genres.json', 'w') as f:
    json.dump(positioned, f, indent=2)

print("✅ Saved positioned_genres.json")
