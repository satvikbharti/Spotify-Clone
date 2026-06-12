# Spotify Clone

A responsive Spotify-style music player built with HTML, CSS, and JavaScript.

## Features

- Dynamic albums generated from the `songs/` folder during build
- Song search
- Active now-playing highlight
- Play, pause, previous, and next controls
- Autoplay next song
- Click and drag seekbar
- Volume and mute controls
- Responsive sidebar for mobile screens
- Vercel-ready static deployment

## Folder Structure

Each album should live inside `songs/`:

```text
songs/album-name/
  cover.jpg
  info.json
  song-one.mp3
  song-two.mp3
```

Example `info.json`:

```json
{
  "title": "Album Title",
  "description": "Songs for you",
  "artist": "Various Artists",
  "year": "2026"
}
```

## Local Setup

Generate the song manifest:

```bash
node scripts/generate-manifest.js
```

Then run the project with VS Code Live Server.

## Vercel Deployment

Use these settings:

```text
Framework Preset: Other
Build Command: npm run build
Output Directory: .
```

When you add a new album or song, push it to GitHub and Vercel will regenerate `songs/manifest.json` during deployment.
