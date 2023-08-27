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
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			diagnosticCollection.clear()
			const selection = editor.selection;
			let selectedText = editor.document.getText(selection);

			if (selectedText.trim() === "") {
				console.log("[INFO] No text selected. Returning early.")
				return
			}

			// If the selections first column is not the first column of the line,
			// we pad the beginning of the selected string.
			// Allows us to avoid dealing with offsets later on.
			if (selection.start.character !== 0) {
				console.log("[INFO] Padding selected text.")
				selectedText = " ".repeat(selection.start.character).concat(selectedText)
			}

			const childProcess = spawnSync("shellcheck", options, { input: selectedText, encoding: "utf-8" })
			const results: ShellCheckResult[] = JSON.parse(childProcess.stdout)

			const diagnostics = results.map((result) => {
				const startPosition =
					new vscode.Position(
						selection.start.line + result.line - 1,
						result.column - 1,
					)
				const endPosition =
					new vscode.Position(
						selection.start.line + result.endLine - 1,
						result.endColumn - 1,
					)
				return new vscode.Diagnostic(
					new vscode.Range(startPosition, endPosition),
					`${result.message} (SC${result.code})`,
					vscode.DiagnosticSeverity.Information,
				)
			})
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
