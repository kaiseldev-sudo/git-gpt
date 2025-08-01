# Change Log

All notable changes to the "git-commit-ai-generator" extension will be documented in this file.

## [1.0.0] - 2025-01-08

### Added
- Initial release of Git Commit AI Generator
- Privacy-first activity logging with user consent
- AI-powered commit message generation using OpenAI
- Support for multiple commit message styles (Conventional, Angular, Gitmoji, Custom)
- Smart file filtering to exclude sensitive files
- Keyboard shortcuts for quick access
- Status bar integration with logging indicator
- Configurable settings for customization
- Command palette integration
- Activity log management (toggle, clear)

### Security
- Automatic exclusion of sensitive files (.env, credentials, etc.)
- Local-only activity logging
- Explicit user consent for data collection
- No data sharing except with OpenAI for commit generation

### Features
- Real-time file change monitoring
- Document save event logging
- Intelligent activity summarization
- Multiple AI prompt templates
- Log rotation to prevent excessive storage usage
- Integration with VS Code Git interface