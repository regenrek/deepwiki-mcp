# Contributing to Deepwiki-to-Markdown MCP Server

Thank you for considering contributing to the Deepwiki-to-Markdown MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with the following information:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant logs or error messages
- Environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

For feature requests or enhancements:

- Use a clear, descriptive title
- Provide a detailed description of the proposed functionality
- Explain why this enhancement would be useful
- Consider including mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests to ensure they pass (`npm test`)
5. Run linting to ensure code quality (`npm run lint`)
6. Update documentation as needed
7. Commit your changes with a clear message
8. Push to your fork
9. Submit a pull request to the `main` branch

### Pull Request Guidelines

- Follow the coding style of the project
- Include tests for new features
- Update the README.md with details of changes if applicable
- Update the CHANGELOG.md following the existing format
- The pull request should work on the latest Node.js LTS version

## Development Workflow

1. Clone the repository: `git clone https://github.com/regenrek/mcp-deepwiki.git`
2. Install dependencies: `npm install`
3. Run in development mode: `npm run dev-stdio` (or `dev-http`/`dev-sse`)
4. Make your changes
5. Run tests: `npm test`
6. Run linting: `npm run lint`

## Project Structure

```
src/
├── functions/         # Core functionality
│   ├── __tests__/     # Unit tests
│   ├── crawler.ts     # Website crawling logic
│   ├── converter.ts   # HTML to Markdown conversion
│   ├── types.ts       # TypeScript interfaces & schemas
│   └── utils.ts       # Utility functions
├── tools/             # MCP tool definitions
│   ├── deepwiki.ts    # Deepwiki fetch tool
│   └── mytool.ts      # Example tool
├── index.ts           # Main entry point
├── server.ts          # MCP server setup
└── types.ts           # Core type definitions
```

## Testing

Please ensure all tests pass before submitting a pull request:

```bash
npm test
```

Write new tests for new features or bug fixes. We use Vitest for testing.

## Linting

We use ESLint to maintain code quality:

```bash
npm run lint
```

## Documentation

Please update the documentation when necessary:

- README.md for user-facing changes
- CHANGELOG.md for release notes
- Code comments for complex logic

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Commit changes
4. Create a tag for the release
5. Push to GitHub
6. Publish to npm

## Questions?

If you have any questions, please open an issue or reach out to the maintainers.

Thank you for contributing to the Deepwiki-to-Markdown MCP Server!
