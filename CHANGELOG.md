# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.9] - 2025-05-12

### Changed
- Updated domain again and changed back to `deepwiki.com` (by @KerneggerTim).

## [0.0.8] - 2025-05-09

### Changed
- Updated to support `deepwiki.org` instead of `deepwiki.com` (by @KerneggerTim).

### Fixed
- Preserve owner/repo format during URL normalization in `deepwiki_fetch` (related to `src/tools/deepwiki.ts`) (by @darinkishore).

## [0.0.7] - YYYY-MM-DD

### Added
- **NLP-powered keyword extraction:** (Already documented in 0.0.6, but linked to `wink-nlp` dependency addition in this version)
- **Automatic GitHub repo resolution:** (Already documented in 0.0.6, but relevant to README changes)

### Changed
- Updated `README.md` to reflect that the `url` parameter in `deepwiki_fetch` now accepts single library keywords.
- Added "Future Work" section to `README.md`.

### Dependencies
- Added `wink-nlp`