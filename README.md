<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Lecture 2: Prompting LLMs - AI-Powered Arcade Game

## Project Description

This project is an **interactive AI-powered arcade game** built as part of a lecture on prompting Large Language Models (LLMs). The application demonstrates how to effectively prompt AI models to generate dynamic game content, including level descriptions, challenge suggestions, and real-time commentary.

## Project Summary

The AI Arcade combines classic game mechanics with modern AI capabilities:

- **Game Board**: A playable arcade-style game with multiple difficulty levels, obstacles, and scoring systems
- **Prompt Lab**: An interactive interface to experiment with different prompts and see how they affect AI responses
- **Arcade Shop**: An in-game economy system with purchasable items and cosmetics
- **Stats Leaderboard**: Track player performance and achievements across game levels
- **AI Commentary System**: Real-time AI-generated commentary on player actions and game events
- **Campaign Levels**: Progressive difficulty levels with themed challenges and rewards

## AI Tools Used

- **Google Generative AI (Gemini API)** - Powers dynamic content generation, game commentary, and prompt responses
- **React** - Frontend framework for building the interactive user interface
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Express.js** - Backend server for API routes and integration

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local development server address

## Development Branches

- **main** - Latest stable release
- **master** - Original development branch
- **development** - Active development branch (default) with combined features from all branches
