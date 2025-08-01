# Git Commit AI Generator

A VS Code extension that generates intelligent Git commit messages based on your recent coding activity using AI.

## 🚀 Features

- **Privacy-First Activity Logging**: Asks for explicit permission before logging any activity
- **AI-Powered Commit Messages**: Uses OpenAI to generate meaningful commit messages based on your code changes
- **Multiple Commit Styles**: Supports conventional commits, Angular style, gitmoji, and custom formats
- **Smart File Filtering**: Automatically excludes sensitive files like .env, credentials, and build artifacts
- **Keyboard Shortcuts**: Quick access with `Ctrl+Shift+G Ctrl+Shift+M` (or `Cmd+Shift+G Cmd+Shift+M` on Mac)
- **Status Bar Integration**: Visual indicator showing logging status

## 📋 Requirements

- VS Code 1.74.0 or higher
- OpenAI API key (for AI-powered commit message generation)

## 🛠️ Setup

1. Install the extension
2. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
3. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
4. Search for "Git Commit AI Generator"
5. Enter your OpenAI API key in the `OpenAI API Key` field
6. Configure other settings as desired

## 🎯 Usage

### First Time Setup
1. On first activation, the extension will ask for permission to log your coding activity
2. Choose "Allow Logging" to enable activity tracking
3. Your activity will be logged locally and never shared externally

### Generating Commit Messages
1. Make some code changes in your project
2. Use one of these methods to generate a commit message:
   - Press `Ctrl+Shift+G Ctrl+Shift+M` (or `Cmd+Shift+G Cmd+Shift+M` on Mac)
   - Open Command Palette (`Ctrl+Shift+P`) and run "Git Commit AI: Generate Commit Message"
   - Click the status bar item and select "Generate Commit Message"

### Managing Activity Logging
- **Toggle Logging**: Use "Git Commit AI: Toggle Activity Logging" command
- **Clear Log**: Use "Git Commit AI: Clear Activity Log" command to remove all logged activity
- **Status Bar**: Click the status bar item to quickly toggle logging on/off

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `enableLogging` | Enable logging of code changes | `false` |
| `openaiApiKey` | Your OpenAI API key | `""` |
| `maxLogEntries` | Maximum number of log entries to keep | `100` |
| `excludePatterns` | File patterns to exclude from logging | See below |
| `commitStyle` | Commit message style (conventional, angular, gitmoji, custom) | `conventional` |
| `customPrompt` | Custom prompt template for commit generation | `""` |

### Default Excluded Patterns
```json
[
  "**/.env*",
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/*.log",
  "**/package-lock.json",
  "**/yarn.lock"
]
```

## 🔒 Privacy & Security

- **Local Storage**: All activity logs are stored locally on your machine
- **No Data Sharing**: Your code activity is never sent to any external service except OpenAI for commit message generation
- **Sensitive File Protection**: Automatically excludes .env files, credentials, and other sensitive patterns
- **Explicit Consent**: Always asks for permission before starting activity logging
- **Configurable Exclusions**: Full control over which files and patterns to exclude

## 📝 Commit Message Styles

### Conventional Commits
```
feat: add user authentication
fix: resolve memory leak in data processing
docs: update API documentation
```

### Angular Style
```
feat(auth): implement OAuth2 integration
fix(ui): correct button alignment issues
chore(deps): update dependencies
```

### Gitmoji Style
```
✨ Add new search functionality
🐛 Fix navigation menu bug
📝 Update documentation
```

### Custom Style
Define your own prompt template using the `customPrompt` setting.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) section
2. Create a new issue with detailed information about your problem
3. Include VS Code version, extension version, and error messages

## 🚧 Roadmap

- [ ] Integration with popular Git GUIs
- [ ] Support for additional AI providers (Claude, Cohere, etc.)
- [ ] Team commit style presets
- [ ] Commit message templates
- [ ] Integration with GitHub Copilot

---

**Enjoy generating better commit messages with AI! 🎉**