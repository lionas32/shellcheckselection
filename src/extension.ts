// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawnSync } from 'child_process';


interface ShellCheckResult {
	file: string,
	line: number,
	endLine: number,
	column: number,
	endColumn: number,
	level: string,
	code: number,
	message: string,
	fix: any,
}

namespace CommandIds {
	export const lintBash = "shellcheckselection.bash"
	export const lintDash = "shellcheckrelection.dash"
	export const lintBourne = "shellcheckrelection.bourne"
	export const lintKorn = "shellcheckselection.korn"
	export const clearDiagnostics = "shellcheckselection.clear"
}

export function activate(context: vscode.ExtensionContext) {


	const diagnosticCollection = vscode.languages.createDiagnosticCollection('ShellCheckSelection')

	function lintShell(shell: string) {
		const options: string[] = ["-f", "json", "-s", shell, "-"]
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			diagnosticCollection.clear()
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			if (selectedText.trim() == "") {
				console.log("[INFO] No text selected. Returning early.")
				return
			}
			const childProcess = spawnSync("shellcheck", options, { input: selectedText, encoding: "utf-8" })
			const results: ShellCheckResult[] = JSON.parse(childProcess.stdout)



			
			const diagnostics = results.map((result) =>
				new vscode.Diagnostic(
					new vscode.Range(
						new vscode.Position(
							result.line + selection.start.line - 1,
							selection.start.character + result.column - 1,
						),
						new vscode.Position(
							result.endLine + selection.start.line - 1,
							selection.start.character + result.endColumn - 1,
						)
					),
					`${result.message} (SC${result.code})`,
					vscode.DiagnosticSeverity.Information
				)
			)
			diagnosticCollection.set(editor.document.uri, diagnostics)
		} else {
			vscode.window.showInformationMessage('ShellCodeCheck: No active text editor.');
		}
	}

	context.subscriptions.push(
		// commands
		vscode.commands.registerCommand(CommandIds.lintBash, () => lintShell("bash")),
		vscode.commands.registerCommand(CommandIds.lintBourne, () => lintShell("sh")),
		vscode.commands.registerCommand(CommandIds.lintKorn, () => lintShell("ksh")),
		vscode.commands.registerCommand(CommandIds.lintDash, () => lintShell("dash")),
		vscode.commands.registerCommand(CommandIds.clearDiagnostics, () => diagnosticCollection.clear()),
		// other stuff
		diagnosticCollection,
	)
}

// This method is called when your extension is deactivated
export function deactivate() { }
