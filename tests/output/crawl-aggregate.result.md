regenrek/codefetch | DeepWiki

[Powered by Devin](https://devin.ai)

[DeepWiki](#)

[DeepWiki](#)

[regenrek/codefetch](https://github.com/regenrek/codefetch)

[powered by](https://devin.ai)

[Devin](https://devin.ai)

Share

Last updated: 23 April 2025 (17e894)

- [Overview](#regenrek/codefetch/1-overview)
- [Installation and Usage](#regenrek/codefetch/2-installation-and-usage)
- [Architecture](#regenrek/codefetch/3-architecture)
- [Configuration System](#regenrek/codefetch/3.1-configuration-system)
- [File Collection and Filtering](#regenrek/codefetch/3.2-file-collection-and-filtering)
- [Markdown Generation](#regenrek/codefetch/3.3-markdown-generation)
- [Token Management](#regenrek/codefetch/3.4-token-management)
- [Command System](#regenrek/codefetch/4-command-system)
- [Default Command](#regenrek/codefetch/4.1-default-command)
- [Init Command](#regenrek/codefetch/4.2-init-command)
- [Template System](#regenrek/codefetch/5-template-system)
- [Built-in Prompts](#regenrek/codefetch/5.1-built-in-prompts)
- [Project Configuration](#regenrek/codefetch/6-project-configuration)

Menu

# Overview

Relevant source files

The following files were used as context for generating this wiki page:

- [README.md](https://github.com/regenrek/codefetch/blob/17e89409/README.md)
- [package.json](https://github.com/regenrek/codefetch/blob/17e89409/package.json)

CodeFetch is a command-line utility designed to convert source code repositories into Markdown documents optimized for analysis by Large Language Models (LLMs). It extracts, filters, and processes code files, outputting them in a single, well-formatted Markdown document that can be fed directly to AI tools.

## Purpose and Scope

CodeFetch serves as a bridge between your codebase and AI tools by:

- Collecting code files from a project directory
- Filtering files based on configurable patterns and ignore rules
- Converting code to Markdown with syntax highlighting and line numbers
- Managing token counts for LLM context window compatibility
- Supporting prompt templates for specific analysis tasks

This overview covers the high-level functionality and architecture of CodeFetch. For detailed installation and usage instructions, see [Installation and Usage](#regenrek/codefetch/2-installation-and-usage).

Sources: [package.json1-70](https://github.com/regenrek/codefetch/blob/17e89409/package.json#L1-L70) [README.md1-13](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L1-L13)

## Core Architecture

The CodeFetch system consists of several interconnected components that work together to transform code into Markdown:

```
```

Sources: [package.json22-24](https://github.com/regenrek/codefetch/blob/17e89409/package.json#L22-L24) [package.json60-68](https://github.com/regenrek/codefetch/blob/17e89409/package.json#L60-L68) [README.md14-52](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L14-L52)

## Data Flow

The following diagram illustrates how data flows through the CodeFetch system from input files to final Markdown output:

```
```

Sources: [README.md154-167](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L154-L167) [README.md169-176](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L169-L176)

## Key Components

### CLI and Configuration System

The CLI system parses command-line arguments using `mri` and loads configuration from multiple sources:

1. Command-line arguments
2. Project configuration file (`codefetch.config.mjs`)
3. Default configuration values

Configuration values are merged using `defu` with CLI arguments taking highest precedence.

Key configuration options include:

- `outputPath`: Directory for output files (default: "codefetch")
- `outputFile`: Output filename (default: "codebase.md")
- `maxTokens`: Token limit for LLM compatibility
- `tokenEncoder`: Token counting method

Sources: [package.json60-62](https://github.com/regenrek/codefetch/blob/17e89409/package.json#L60-L62) [README.md237-267](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L237-L267)

### File Collection and Filtering

The file collection system gathers and filters code files using:

- `fast-glob` for finding files matching glob patterns
- `ignore` package for applying ignore rules
- Custom filtering logic for include/exclude patterns

Files are filtered based on:

- File extensions specified in `extensions` option
- Include and exclude patterns for files and directories
- `.gitignore` and `.codefetchignore` rules
- Default ignore patterns for common non-code files

Sources: [package.json64-65](https://github.com/regenrek/codefetch/blob/17e89409/package.json#L64-L65) [README.md169-183](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L169-L183)

### Markdown Generation

The Markdown generation system:

- Reads file contents
- Creates code blocks with appropriate language syntax highlighting
- Adds line numbers (unless `disableLineNumbers` is true)
- Optionally includes a project tree visualization
- Processes and includes prompt templates
- Applies token limiting if needed

Sources: [README.md78-104](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L78-L104) [README.md10-11](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L10-L11)

### Token Management

Token management is crucial for ensuring compatibility with LLM context windows:

| Token Encoder | Description                 | Target Model                     |
| ------------- | --------------------------- | -------------------------------- |
| `simple`      | Basic word-based estimation | Any (fastest but least accurate) |
| `p50k`        | GPT-3 style tokenization    | GPT-3 models                     |
| `cl100k`      | GPT-4 style tokenization    | GPT-4 models                     |
| `o200k`       | GPT-4o style tokenization   | GPT-4o models                    |

When output exceeds the token limit, two strategies are available:

- `sequential`: Process files in order until the limit is reached
- `truncated`: Distribute tokens evenly across all files

Sources: [README.md154-167](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L154-L167) [README.md185-198](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L185-L198) [package.json66](https://github.com/regenrek/codefetch/blob/17e89409/package.json#L66-L66)

### Prompt System

The prompt system supports:

- Built-in prompts for common code analysis tasks (`fix`, `improve`, `codegen`, `testgen`)
- Custom prompts stored in the `codefetch/prompts/` directory
- Template variable substitution

Sources: [README.md106-153](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L106-L153)

## Usage Scenarios

CodeFetch is designed for several use cases:

1. Preparing code for AI-assisted code reviews
2. Enabling LLMs to analyze entire codebases for refactoring suggestions
3. Generating documentation or tests based on existing code
4. Troubleshooting complex code issues with AI assistance

The tool can be run directly via `npx codefetch` or installed globally.

Sources: [README.md14-53](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L14-L53) [README.md217-222](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L217-L222)

## Project Integration

CodeFetch can be integrated into a project using:

```
```

This command:

1. Creates a `.codefetchignore` file for excluding files
2. Generates a `codefetch.config.mjs` with project preferences
3. Sets up the necessary directory structure

For a detailed explanation of the configuration options, see [Project Configuration](#regenrek/codefetch/6-project-configuration).

Sources: [README.md223-236](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L223-L236) [README.md237-281](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L237-L281)

## Related Systems

CodeFetch includes several interconnected subsystems that handle different aspects of the code processing pipeline. For more detailed information about these systems, refer to:

- [Configuration System](#regenrek/codefetch/3.1-configuration-system) - How configuration is loaded and merged
- [File Collection and Filtering](#regenrek/codefetch/3.2-file-collection-and-filtering) - How files are discovered and filtered
- [Markdown Generation](#regenrek/codefetch/3.3-markdown-generation) - How code is converted to Markdown
- [Token Management](#regenrek/codefetch/3.4-token-management) - How tokens are counted and limited
- [Command System](#regenrek/codefetch/4-command-system) - Available CLI commands
- [Template System](#regenrek/codefetch/5-template-system) - Prompt template handling

Sources: [README.md202-215](https://github.com/regenrek/codefetch/blob/17e89409/README.md#L202-L215)

Try DeepWiki on your private codebase with [Devin](#private-repo)

### On this page

- [Overview](##overview)
- [Purpose and Scope](##purpose-and-scope)
- [Core Architecture](##core-architecture)
- [Data Flow](##data-flow)
- [Key Components](##key-components)
- [CLI and Configuration System](##cli-and-configuration-system)
- [File Collection and Filtering](##file-collection-and-filtering)
- [Markdown Generation](##markdown-generation)
- [Token Management](##token-management)
- [Prompt System](##prompt-system)
- [Usage Scenarios](##usage-scenarios)
- [Project Integration](##project-integration)
- [Related Systems](##related-systems)
