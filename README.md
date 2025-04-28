# 🚀 spotiflight

This is supposed to be a game where a spacecraft is navigated through a musical space [1]. Genres are organized in a 3D space according to genre similarity [2]. Discovering new music genres and becomes a journey through space. Spotify APIs are used for obtaining playlists and song properties.  As Spotifys API does not allow querying by genre, all "The Sound of <genre>" playlists are obtained from the fantastic [Every Noise at Once](https://everynoise.com) project. 

## Getting started
To get started playing, and developing, start vite using: 
```
cd spotiflight
npm i
npm start
```

## Generating genre positions

To generate the JSON file used by SolarSystemScene, run:

```bash
npm run generate-data
```

This will execute the Python scripts in `scripts/` and produce `data/positioned_genres_final.json`, which the app imports for visualization.

## Research subjects
1. *Gameplay and Graphics*: [Three.js](https://threejs.org) is used as a 3D engine. Rendering the spaceship will be taken care of later on. For now, there's only a camera that is controlled through 3D space. Genres should be represented as illuminated spheres in different colors. When the camera is facing a genre sphere and is nearby, the Spotify Web Playback SDK should be used to obtain the first song of the playlist of the respective genre.
2. *Genre similarity*: maybe use song attributes to generate genre vectors or use nlp to identify and organize similar genres close to one another