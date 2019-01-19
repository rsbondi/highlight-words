'use strict';
import { commands, ExtensionContext, window, workspace } from 'vscode';
import HighlightConfig from './config'
import Highlight from './highlight'

export function activate(context: ExtensionContext) {
    let highlight = new Highlight()

    commands.registerCommand('highlightwords.addRegExpHighlight', function () {
        window.showInputBox({ prompt: 'Enter expression' })
            .then(word => {
                highlight.addRegExp(word)
            });
    });

    commands.registerCommand('highlightwords.addHighlight', function () {
        highlight.addSelected()
    });

    commands.registerCommand('highlightwords.addHighlightWithOptions', function () {
        highlight.addSelected(true)
    });

    commands.registerCommand('highlightwords.removeHighlight', function () {
        window.showQuickPick(highlight.getWords().concat([{ expression: '* All *', wholeWord: false, ignoreCase: false }]).map(w => {
            return {
                label: w.expression,
                description: (w.ignoreCase ? 'i' : '') + (w.wholeWord ? 'w' : ''),
                detail: ''
            }
        }))
            .then(word => {
                highlight.remove(word)
            })
    });

    commands.registerCommand('highlightwords.removeAllHighlights', function () {
        highlight.clearAll()
    });

    commands.registerCommand('highlightwords.setHighlightMode', function () {
        const modes = ['Default', 'Whole Word', 'Ignore Case', 'Both'].map((s, i) => highlight.getMode() == i ? s+' ✅' : s)
        window.showQuickPick(modes).then(option => {
            if (typeof option == 'undefined') return;

            highlight.setMode(modes.indexOf(option)) 
        })
    })
    
    let configValues = HighlightConfig.getConfigValues()
    highlight.setDecorators(configValues.decorators)

    let activeEditor = window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    workspace.onDidChangeConfiguration(() => {
        let configValues = HighlightConfig.getConfigValues()
        highlight.setDecorators(configValues.decorators)
        if(typeof configValues.defaultMode != 'undefined') highlight.setMode(configValues.defaultMode)
    })

    window.onDidChangeVisibleTextEditors(function (editor) {
        highlight.updateDecorations();
    }, null, context.subscriptions);

    workspace.onDidChangeTextDocument(function (event) {
        activeEditor = window.activeTextEditor;
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    var timeout: NodeJS.Timer = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(highlight.updateActive, 500);
    }

}

// this method is called when your extension is deactivated
export function deactivate() {
}