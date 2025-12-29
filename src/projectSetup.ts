import * as vscode from 'vscode';
import * as path from 'path';

export class ProjectSetup {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('DBT Project Setup');
    }

    async setupProject() {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const config = vscode.workspace.getConfiguration('dbtRunner');
        const dbtProjectPath = config.get<string>('dbtProjectPath', 'dbt');
        const fullDbtPath = path.join(workspaceRoot, dbtProjectPath);

        this.outputChannel.clear();
        this.outputChannel.show();
        this.outputChannel.appendLine('Setting up DBT project...');
        this.outputChannel.appendLine(`Workspace: ${workspaceRoot}`);
        this.outputChannel.appendLine(`DBT Path: ${fullDbtPath}`);
        this.outputChannel.appendLine('---\n');

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Setting up DBT project",
            cancellable: false
        }, async (progress: vscode.Progress<{ message?: string; increment?: number }>) => {
            progress.report({ increment: 0, message: "Running poetry lock..." });
            await this.runCommand(workspaceRoot, 'poetry lock');

            progress.report({ increment: 33, message: "Running poetry install..." });
            await this.runCommand(workspaceRoot, 'poetry install');

            progress.report({ increment: 66, message: "Running dbt deps..." });
            await this.runCommand(fullDbtPath, 'poetry run dbt deps');

            progress.report({ increment: 100, message: "Complete!" });
        });

        vscode.window.showInformationMessage('DBT project setup complete!');
    }

    private async runCommand(cwd: string, command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.outputChannel.appendLine(`Running: ${command}`);
            this.outputChannel.appendLine(`Working directory: ${cwd}\n`);

            const terminal = vscode.window.createTerminal({
                name: 'DBT Setup',
                cwd: cwd
            });

            terminal.show();
            terminal.sendText(command);

            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }
}
