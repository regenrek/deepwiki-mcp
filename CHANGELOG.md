# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-04-27

### Added
- Initial release of the Deepwiki-to-Markdown MCP Server
- Implementation of `deepwiki_fetch` MCP tool for converting Deepwiki repositories to Markdown
- HTML-to-Markdown conversion with sanitization of headers, footers, navigation, and ads
- Support for both aggregate mode (single document) and pages mode (structured data)
- Link rewriting to maintain functional references in output Markdown
- Domain safety restrictions to only allow deepwiki.com URLs
- Repo scope limitation to prevent crawling outside the target repository
- Progress streaming for real-time updates during crawling
- Configurable depth limiting via maxDepth parameter
- Robust error handling with retry logic for transient failures
- Comprehensive test suite for utility functions and HTML conversion
- Docker support for containerized deployment
- Full documentation in README.md

### Fixed
- Properly handle links to maintain navigation between pages in both output modes
- Ensure Mermaid diagrams and code blocks are preserved in the output
- Fix potential issues with robots.txt parsing

### Security
- Domain whitelist to prevent phishing attempts
- HTML sanitization to remove potentially harmful scripts and content 