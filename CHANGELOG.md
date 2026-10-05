# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-05

### Added
- **Official Antigravity Language Server Direct Connect**:
  - Automatically locates language server port and CSRF token from active Antigravity IDE logs.
  - Connects via native ConnectRPC endpoint to retrieve live Gemini (5-Hour / Weekly) and Claude/GPT quota buckets.
- **Agent Session & Brain Transcript Aggregator**:
  - Seamlessly parses Antigravity's internal session transcripts (`~/.gemini/antigravity-ide/brain/`).
  - Automatically calculates Prompt Tokens, Completion Tokens, Tool Calls, and Agent Sessions.
- **Editor Autocomplete & Tab Token Tracking**:
  - Tracks Tab completion suggestions, acceptances, and calculates token volume in real time.
- **Dynamic Adaptive SVG Quota Gauges**:
  - Clean circular progress meters that smoothly update based on exact quota percentages.
  - Smart health-state coloring: Green (>40%), Amber/Warning (16%~40%), and Red (<15%).
- **Multi-Entry UI**:
  - Compact status bar widget (`$(sparkle) 5h余XX% | 周余XX% | 今日: XXk`).
  - Activity bar dedicated sidebar view.
  - Full-screen dashboard with manual calibration and refresh capabilities.
