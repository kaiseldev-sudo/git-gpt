# Installation Guide

## Method 1: Local Development Installation (Recommended)

### Prerequisites
- Node.js (version 16 or higher)
- VS Code
- Git

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install VS Code Extension CLI** (if not already installed):
   ```bash
   npm install -g @vscode/vsce
   ```

3. **Build and package the extension**:
   ```bash
   npm run package
   ```
   This creates a `.vsix` file in the project root.

4. **Install the extension in VS Code**:
   ```bash
   code --install-extension git-commit-ai-generator-1.0.0.vsix
   ```
   
   Or use the automated script:
   ```bash
   npm run build-and-install
   ```

5. **Reload VS Code** to activate the extension.

## Method 2: Development Mode (For Testing)

1. **Open the project in VS Code**:
   ```bash
   code .
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile TypeScript**:
   ```bash
   npm run compile
   ```

4. **Press F5** in VS Code to open a new Extension Development Host window with the extension loaded.

## Method 3: Manual Installation via VS Code

1. **Package the extension**:
   ```bash
   npm run package
   ```

2. **In VS Code**:
   - Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Type "Extensions: Install from VSIX..."
   - Select the generated `.vsix` file
   - Reload VS Code

## Post-Installation Setup

1. **Get OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key

2. **Configure the Extension**:
   - Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
   - Search for "Git Commit AI Generator"
   - Enter your OpenAI API key
   - Configure other settings as needed

3. **Grant Permissions**:
   - The extension will ask for permission to log activity on first use
   - Click "Allow Logging" to enable the feature

## Verification

1. **Check if installed**:
   - Go to Extensions view (`Ctrl+Shift+X`)
   - Search for "Git Commit AI Generator"
   - Should show as installed

2. **Test the extension**:
   - Make some code changes
   - Press `Ctrl+Shift+G Ctrl+Shift+M` (or `Cmd+Shift+G Cmd+Shift+M` on Mac)
   - Should prompt to generate a commit message

## Troubleshooting

### Extension not appearing
- Make sure VS Code is reloaded after installation
- Check the Extensions view to confirm installation

### Commands not working
- Verify the extension is enabled in Extensions view
- Check that you've granted logging permissions
- Ensure OpenAI API key is configured

### Build errors
- Make sure Node.js version is 16 or higher
- Delete `node_modules` and run `npm install` again
- Check that TypeScript compiles without errors: `npm run compile`

## Uninstallation

To remove the extension:
1. Go to Extensions view (`Ctrl+Shift+X`)
2. Find "Git Commit AI Generator"
3. Click the gear icon and select "Uninstall"
4. Reload VS Code