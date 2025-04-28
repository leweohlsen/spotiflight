#!/usr/bin/env python3
"""
Generate a radial layout of music genres as planets orbiting in a solar system based on hierarchy.
"""
import argparse
import json
import math
from collections import defaultdict

def compute_subtree_sizes(tree, node, sizes):
    """Recursively compute the size of each subtree rooted at node."""
    sizes[node] = 1
    for child in tree.get(node, []):
        compute_subtree_sizes(tree, child, sizes)
        sizes[node] += sizes[child]

def layout_radial(tree, root, theta_start, theta_end, sizes, depth=0, depth_spacing=200):
    """Assign radial coordinates (r, theta) to each node in the hierarchy."""
    r = depth * depth_spacing
    theta = (theta_start + theta_end) / 2.0
    layout = {root: {'r': r, 'theta0': theta, 'depth': depth}}
    children = tree.get(root, [])
    if children:
        total = sum(sizes[c] for c in children)
        angle = theta_start
        for child in children:
            span = (theta_end - theta_start) * (sizes[child] / total)
            sublayout = layout_radial(tree, child, angle, angle + span, sizes, depth + 1, depth_spacing)
            layout.update(sublayout)
            angle += span
    return layout

def assign_angular_speeds(layout, base_speed=0.8, epsilon=1e-3):
    """Compute angular velocity for each planet, inversely proportional to radius."""
    omega_map = {}
    for node, data in layout.items():
        r = data['r']
        omega_map[node] = base_speed / (r + epsilon)
    return omega_map

def main():
    parser = argparse.ArgumentParser(
        description='Generate a solar system layout of genres based on hierarchy.'
    )
    parser.add_argument(
        '--input', '-i', required=True,
        help='Input JSON file with a mapping of genre name to attributes, including a "parent" field.'
    )
    parser.add_argument(
        '--output', '-o', default='data/genre_planets.json',
        help='Output JSON file for planets layout.'
    )
    parser.add_argument(
        '--depth-spacing', type=float, default=200.0,
        help='Radial spacing between hierarchy levels.'
    )
    parser.add_argument(
        '--base-speed', type=float, default=0.8,
        help='Base angular speed factor for orbits.'
    )
    parser.add_argument(
        '--epsilon', type=float, default=1e-3,
        help='Small epsilon to avoid division by zero in speed calculation.'
    )
    args = parser.parse_args()

    # Load input data
    with open(args.input, 'r') as f:
        data = json.load(f)

    # Expect a dict mapping genre name to attributes
    if not isinstance(data, dict):
        raise ValueError('Input JSON must be an object mapping genre names to attributes.')

    # Build parent->children map
    tree = defaultdict(list)
    for name, attrs in data.items():
        parent = attrs.get('parent')
        if parent:
            tree[parent].append(name)

    # Identify root genres (no parent)
    roots = [name for name, attrs in data.items() if not attrs.get('parent')]
    if not roots:
        raise ValueError('No root genres found; check "parent" attributes in input.')

    # Compute subtree sizes for layout partitioning
    sizes = {}
    for root in roots:
        compute_subtree_sizes(tree, root, sizes)

    # Layout each root in its partition of the circle
    full_circle = 2 * math.pi
    per_root = full_circle / len(roots)
    all_layout = {}
    for i, root in enumerate(roots):
        start = i * per_root
        end = start + per_root
        # Use initial depth=1 so root genres orbit on the first ring
        part = layout_radial(
            tree, root, start, end, sizes,
            depth=1, depth_spacing=args.depth_spacing
        )
        all_layout.update(part)

    # Assign angular speeds
    omega_map = assign_angular_speeds(
        all_layout, base_speed=args.base_speed, epsilon=args.epsilon
    )

    # Build output mapping
    planets = {}
    for name, attrs in data.items():
        # Remove any existing Cartesian coordinates
        planet = {k: v for k, v in attrs.items() if k not in ('x', 'y', 'z')}
        layout = all_layout.get(name, {})
        planet['r'] = layout.get('r')
        planet['theta0'] = layout.get('theta0')
        planet['depth'] = layout.get('depth')
        planet['omega'] = omega_map.get(name)
        # Include mass: use provided mass or fallback to subtree size
        planet['mass'] = attrs.get('mass', sizes.get(name, 1))
        planets[name] = planet

    # Write output
    with open(args.output, 'w') as f:
        json.dump(planets, f, indent=2)
    print(f'✅ Generated {len(planets)} planets to {args.output}')

if __name__ == '__main__':
    main()