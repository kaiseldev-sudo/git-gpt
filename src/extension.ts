import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import ignore from 'ignore';

interface LogEntry {
    timestamp: string;
    action: string;
    fileName: string;
    content?: string;
    changes?: string;
}

interface CommitMessageResponse {
    message: string;
    confidence: number;
}

export class GitCommitAIProvider {
    private context: vscode.ExtensionContext;
    private logFilePath: string;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private isLoggingEnabled: boolean = false;
    private statusBarItem: vscode.StatusBarItem;
    private ignoreFilter: any;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.logFilePath = path.join(context.globalStoragePath, 'code-activity-log.txt');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.initializeIgnoreFilter();
        this.initializeExtension();
    }

    private initializeIgnoreFilter() {
        const config = vscode.workspace.getConfiguration('gitCommitAI');
        const excludePatterns = config.get<string[]>('excludePatterns', []);
        this.ignoreFilter = ignore().add(excludePatterns);
    }

    private async initializeExtension() {
        // Ensure storage directory exists
        const storageDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // Check if logging permission has been requested before
        const hasAskedPermission = this.context.globalState.get('hasAskedLoggingPermission', false);
        const loggingEnabled = vscode.workspace.getConfiguration('gitCommitAI').get('enableLogging', false);

        if (!hasAskedPermission) {
            await this.requestLoggingPermission();
        } else if (loggingEnabled) {
            this.enableLogging();
        }

        this.updateStatusBar();
    }

    private async requestLoggingPermission(): Promise<void> {
        const response = await vscode.window.showInformationMessage(
            '🤖 Git Commit AI Generator would like to log your coding activity to help generate better commit messages. Your data stays local and is never shared.',
            { modal: true },
            'Allow Logging',
            'Deny',
            'Learn More'
        );

        await this.context.globalState.update('hasAskedLoggingPermission', true);

        switch (response) {
            case 'Allow Logging':
                await vscode.workspace.getConfiguration('gitCommitAI').update('enableLogging', true, vscode.ConfigurationTarget.Global);
                this.enableLogging();
                vscode.window.showInformationMessage('✅ Activity logging enabled. You can disable it anytime in settings.');
                break;
            case 'Learn More':
                await vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo/privacy-policy'));
                break;
            default:
                vscode.window.showInformationMessage('Activity logging disabled. You can enable it later in extension settings.');
        }
    }

    public enableLogging() {
        this.isLoggingEnabled = true;
        this.startFileWatching();
        this.updateStatusBar();
    }

    public disableLogging() {
        this.isLoggingEnabled = false;
        this.stopFileWatching();
        this.updateStatusBar();
    }

    private startFileWatching() {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }

        // Watch for file changes in workspace
        if (vscode.workspace.workspaceFolders) {
            this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
            
            this.fileWatcher.onDidChange(uri => this.logFileActivity('modified', uri));
            this.fileWatcher.onDidCreate(uri => this.logFileActivity('created', uri));
            this.fileWatcher.onDidDelete(uri => this.logFileActivity('deleted', uri));
        }

        // Listen to document save events
        vscode.workspace.onDidSaveTextDocument(doc => {
            this.logDocumentSave(doc);
        });
    }

    private stopFileWatching() {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
    }

    private async logFileActivity(action: string, uri: vscode.Uri) {
        if (!this.isLoggingEnabled || this.shouldIgnoreFile(uri.fsPath)) {
            return;
        }

        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            action,
            fileName: this.getRelativeFilePath(uri.fsPath)
        };

        await this.appendToLog(logEntry);
    }

    private async logDocumentSave(document: vscode.TextDocument) {
        if (!this.isLoggingEnabled || this.shouldIgnoreFile(document.fileName)) {
            return;
        }

        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            action: 'saved',
            fileName: this.getRelativeFilePath(document.fileName),
            content: this.getSafeDocumentContent(document)
        };

        await this.appendToLog(logEntry);
    }

    private shouldIgnoreFile(filePath: string): boolean {
        const relativePath = this.getRelativeFilePath(filePath);
        return this.ignoreFilter.ignores(relativePath) || 
               filePath.includes('node_modules') ||
               filePath.includes('.git') ||
               path.basename(filePath).startsWith('.env');
    }

    private getRelativeFilePath(absolutePath: string): string {
        if (vscode.workspace.workspaceFolders) {
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            return path.relative(workspaceFolder.uri.fsPath, absolutePath);
        }
        return path.basename(absolutePath);
    }

    private getSafeDocumentContent(document: vscode.TextDocument): string {
        // Return only a safe summary of changes to avoid logging sensitive data
        const lineCount = document.lineCount;
        const length = document.getText().length;
        return `Lines: ${lineCount}, Characters: ${length}`;
    }

    private async appendToLog(logEntry: LogEntry) {
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.logFilePath, logLine);
            
            // Rotate log if it gets too large
            await this.rotateLogIfNeeded();
        } catch (error) {
            console.error('Failed to write to log:', error);
        }
    }

    private async rotateLogIfNeeded() {
        const config = vscode.workspace.getConfiguration('gitCommitAI');
        const maxEntries = config.get<number>('maxLogEntries', 100);

        try {
            const logContent = fs.readFileSync(this.logFilePath, 'utf8');
            const lines = logContent.trim().split('\n').filter(line => line.trim());
            
            if (lines.length > maxEntries) {
                const recentLines = lines.slice(-maxEntries);
                fs.writeFileSync(this.logFilePath, recentLines.join('\n') + '\n');
            }
        } catch (error) {
            console.error('Failed to rotate log:', error);
        }
    }

    public async generateCommitMessage(): Promise<void> {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating commit message...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 10, message: "Reading activity log..." });
                
                const recentActivity = await this.getRecentActivity();
                if (!recentActivity || recentActivity.length === 0) {
                    vscode.window.showWarningMessage('No recent activity found. Make some code changes first!');
                    return;
                }

                progress.report({ increment: 40, message: "Analyzing changes..." });
                
                const commitMessage = await this.callOpenAI(recentActivity);
                
                progress.report({ increment: 90, message: "Presenting results..." });
                
                if (commitMessage) {
                    await this.presentCommitMessage(commitMessage);
                } else {
                    vscode.window.showErrorMessage('Failed to generate commit message. Please check your OpenAI API key.');
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating commit message: ${error}`);
        }
    }

    private async getRecentActivity(): Promise<LogEntry[]> {
        if (!fs.existsSync(this.logFilePath)) {
            return [];
        }

        try {
            const logContent = fs.readFileSync(this.logFilePath, 'utf8');
            const lines = logContent.trim().split('\n').filter(line => line.trim());
            
            // Get recent entries (last 50)
            const recentLines = lines.slice(-50);
            return recentLines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(entry => entry !== null);
        } catch (error) {
            console.error('Failed to read activity log:', error);
            return [];
        }
    }

    private async callOpenAI(activityLog: LogEntry[]): Promise<CommitMessageResponse | null> {
        const config = vscode.workspace.getConfiguration('gitCommitAI');
        const apiKey = config.get<string>('openaiApiKey');
        const commitStyle = config.get<string>('commitStyle', 'conventional');
        const customPrompt = config.get<string>('customPrompt', '');

        if (!apiKey) {
            const response = await vscode.window.showErrorMessage(
                'OpenAI API key not configured. Please add your API key in settings.',
                'Open Settings'
            );
            if (response === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'gitCommitAI.openaiApiKey');
            }
            return null;
        }

        try {
            const prompt = this.buildPrompt(activityLog, commitStyle, customPrompt);
            
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert developer who writes clear, concise Git commit messages based on code activity.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.3
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const message = response.data.choices[0]?.message?.content?.trim();
            return {
                message: message || 'Update code',
                confidence: 0.8
            };
        } catch (error: any) {
            console.error('OpenAI API error:', error);
            if (error.response?.status === 401) {
                vscode.window.showErrorMessage('Invalid OpenAI API key. Please check your configuration.');
            } else {
                vscode.window.showErrorMessage('Failed to generate commit message using AI.');
            }
            return null;
        }
    }

    private buildPrompt(activityLog: LogEntry[], style: string, customPrompt: string): string {
        if (customPrompt) {
            return customPrompt.replace('{activity}', JSON.stringify(activityLog, null, 2));
        }

        const activitySummary = this.summarizeActivity(activityLog);
        
        const styleGuides = {
            conventional: 'Use conventional commit format: type(scope): description',
            angular: 'Use Angular commit format with types like feat, fix, docs, style, refactor, test, chore',
            gitmoji: 'Start with an appropriate emoji followed by a clear description',
            custom: 'Write a clear, descriptive commit message'
        };

        return `Based on the following recent coding activity, generate a concise Git commit message.

${styleGuides[style as keyof typeof styleGuides] || styleGuides.custom}

Recent Activity:
${activitySummary}

Generate a single, clear commit message (max 72 characters for the subject line):`;
    }

    private summarizeActivity(activityLog: LogEntry[]): string {
        const fileChanges = new Map<string, string[]>();
        
        activityLog.forEach(entry => {
            if (!fileChanges.has(entry.fileName)) {
                fileChanges.set(entry.fileName, []);
            }
            fileChanges.get(entry.fileName)!.push(entry.action);
        });

        const summary = Array.from(fileChanges.entries()).map(([file, actions]) => {
            const uniqueActions = [...new Set(actions)];
            return `- ${file}: ${uniqueActions.join(', ')}`;
        }).join('\n');

        return summary || 'Recent file modifications';
    }

    private async presentCommitMessage(response: CommitMessageResponse) {
        const message = response.message;
        
        const action = await vscode.window.showInformationMessage(
            `Generated commit message: "${message}"`,
            { modal: false },
            'Copy to Clipboard',
            'Use in Git',
            'Regenerate'
        );

        switch (action) {
            case 'Copy to Clipboard':
                await vscode.env.clipboard.writeText(message);
                vscode.window.showInformationMessage('✅ Commit message copied to clipboard!');
                break;
            case 'Use in Git':
                // Try to open Git view with the message
                try {
                    await vscode.commands.executeCommand('git.openChange');
                    await vscode.env.clipboard.writeText(message);
                    vscode.window.showInformationMessage('📋 Commit message copied! Paste it in the Git commit box.');
                } catch {
                    await vscode.env.clipboard.writeText(message);
                    vscode.window.showInformationMessage('📋 Commit message copied to clipboard!');
                }
                break;
            case 'Regenerate':
                await this.generateCommitMessage();
                break;
        }
    }

    public async toggleLogging(): Promise<void> {
        const config = vscode.workspace.getConfiguration('gitCommitAI');
        const currentState = config.get('enableLogging', false);
        
        await config.update('enableLogging', !currentState, vscode.ConfigurationTarget.Global);
        
        if (!currentState) {
            this.enableLogging();
            vscode.window.showInformationMessage('✅ Activity logging enabled');
        } else {
            this.disableLogging();
            vscode.window.showInformationMessage('🚫 Activity logging disabled');
        }
    }

    public async clearLog(): Promise<void> {
        const response = await vscode.window.showWarningMessage(
            'Are you sure you want to clear the activity log?',
            { modal: true },
            'Clear Log'
        );

        if (response === 'Clear Log') {
            try {
                if (fs.existsSync(this.logFilePath)) {
                    fs.unlinkSync(this.logFilePath);
                }
                vscode.window.showInformationMessage('✅ Activity log cleared');
            } catch (error) {
                vscode.window.showErrorMessage('Failed to clear activity log');
            }
        }
    }

    private updateStatusBar() {
        if (this.isLoggingEnabled) {
            this.statusBarItem.text = "$(record) Git AI";
            this.statusBarItem.tooltip = "Git Commit AI - Logging enabled";
            this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
        } else {
            this.statusBarItem.text = "$(circle-slash) Git AI";
            this.statusBarItem.tooltip = "Git Commit AI - Logging disabled";
            this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.foreground');
        }
        
        this.statusBarItem.command = 'gitCommitAI.toggleLogging';
        this.statusBarItem.show();
    }

    public dispose() {
        this.statusBarItem.dispose();
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Git Commit AI Generator is now active!');

    const provider = new GitCommitAIProvider(context);

    // Register commands
    const generateCommand = vscode.commands.registerCommand('gitCommitAI.generateCommitMessage', () => {
        provider.generateCommitMessage();
    });

    const toggleLoggingCommand = vscode.commands.registerCommand('gitCommitAI.toggleLogging', () => {
        provider.toggleLogging();
    });

    const clearLogCommand = vscode.commands.registerCommand('gitCommitAI.clearLog', () => {
        provider.clearLog();
    });

    const showSettingsCommand = vscode.commands.registerCommand('gitCommitAI.showSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'gitCommitAI');
    });

    context.subscriptions.push(
        generateCommand,
        toggleLoggingCommand,
        clearLogCommand,
        showSettingsCommand,
        provider
    );

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('gitCommitAI.enableLogging')) {
            const config = vscode.workspace.getConfiguration('gitCommitAI');
            const isEnabled = config.get('enableLogging', false);
            
            if (isEnabled) {
                provider.enableLogging();
            } else {
                provider.disableLogging();
            }
        }
    });
}

export function deactivate() {
    console.log('Git Commit AI Generator is now deactivated!');
}