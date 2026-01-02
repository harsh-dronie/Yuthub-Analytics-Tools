YouTube Analytics Platform

A web application for analyzing YouTube channel and video performance and generating data-driven content ideas.

Built as a full-stack project using Next.js, TypeScript, background jobs, and third-party APIs.

What it does

Fetches and analyzes channel and video metrics using the YouTube Data API

Authenticates users securely with Google OAuth 2.0

Displays performance trends through a React-based analytics dashboard

Uses AI models (Gemini and Grok) to suggest content ideas and optimize titles

Runs background workflows with Inngest for analytics processing and data collection

Uses BrightData for scalable data gathering

Tech stack

Next.js (App Router)

React

TypeScript

YouTube Data API

Google OAuth 2.0

Inngest

BrightData

Gemini AI

Grok

Running locally
npm install
npm run dev


The application will be available at:

http://localhost:3000

Environment variables

Create a .env.local file in the root directory:

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YOUTUBE_API_KEY=
GEMINI_API_KEY=
GROK_API_KEY=
BRIGHTDATA_API_KEY=

Deployment

This project is configured for deployment on Vercel.
Ensure all required environment variables are set in the deployment environment.
