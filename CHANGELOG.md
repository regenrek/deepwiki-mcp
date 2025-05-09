# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.6] - 2024-06-07

### Added
- **NLP-powered keyword extraction:** Introduced `@extractKeyword.ts`, which uses wink-nlp to extract the most likely tech/library keyword from free-form user input. This enables users to search Deepwiki using natural language queries, e.g., just typing "how to install shadcn" will automatically extract "shadcn" as the keyword.
- **Automatic GitHub repo resolution:** Added logic to resolve single keywords (without a slash) to their corresponding GitHub repositories. If a user enters a keyword, the system attempts to resolve it to an "owner/repo" format, improving the accuracy and convenience of searches.

### Improved
- Deepwiki fetch now supports natural language queries and will attempt to resolve them to the correct Deepwiki or GitHub repo, even if the user does not provide a shortform or explicit URL.

## [1.0.0] - 2025-04-27

### Added
- Initial release of the Deepwiki-to-Markdown MCP Server
- Implementation of `deepwiki_fetch` MCP tool for converting Deepwiki repositories to Markdown
- HTML-to-Markdown conversion with sanitization of headers, footers, navigation, and ads
- Support for both aggregate mode (single document) and pages mode (structured data)
- Link rewriting to maintain functional references in output Markdown
- Domain safety restrictions to only allow deepwiki.org URLs
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