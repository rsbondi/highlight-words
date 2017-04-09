'use strict';
import { commands, ExtensionContext, window, OverviewRulerLane, workspace, Range, QuickPickItem } from 'vscode';

export function activate(context: ExtensionContext) {
    interface Highlightable {
        expression: string
        wholeWord: boolean
        ignoreCase: boolean
    }

    let words: Highlightable[] = []

    commands.registerCommand('extension.addRegExpHighlight', function () {
        window.showInputBox({ prompt: 'Enter expression' })
            .then(word => {
                try {
                    let opts = ''
                    if (word.indexOf('/') == 0) {
                        const slashes = word.split('/')
                        opts = slashes[slashes.length - 1]
                        word = word.slice(1, word.length - opts.length - 1)
                    }
                    new RegExp(word)
                    const highlights = words.filter(w => w.expression == word)
                    if (!highlights || !highlights.length) {
                        words.push({
                            expression: word,
                            wholeWord: false,
                            ignoreCase: !!~opts.indexOf('i')
                        });
                        updateDecorations();
                    }
                } catch (e) {
                    window.showInformationMessage(word + ' is an invalid expression')
                }
            });
    });

    function addSelected(withOptions?: boolean) {
        const editor = window.activeTextEditor;
        let word = editor.document.getText(editor.selection);
        if (!word) {
            window.showInformationMessage('Nothing selected!')
            return;
        }
        word = word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") // raw selected text, not regexp
        const highlights = words.filter(w => w.expression == word) // avoid duplicates
        if (!highlights || !highlights.length) {
            if (withOptions) {
                window.showQuickPick(['ignore case', 'whole word', 'both']).then(option => {
                    if (!option) return;

                    words.push({
                        expression: word,
                        wholeWord: option == 'whole word' || option == 'both',
                        ignoreCase: option == 'ignore case' || option == 'both'
                    });
                    updateDecorations()
                })
            }
            else {
                words.push({ expression: word, wholeWord: false, ignoreCase: false });
                updateDecorations()
            }
        }
    }

    commands.registerCommand('extension.addHighlight', function () {
        addSelected()
    });

    commands.registerCommand('extension.addHighlightWithOptions', function () {
        addSelected(true)
    });

    commands.registerCommand('extension.removeHighlight', function () {
        window.showQuickPick(words.concat([{ expression: '* All *', wholeWord: false, ignoreCase: false }]).map(w => {
            return {
                label: w.expression,
                description: (w.ignoreCase ? 'i' : '') + (w.wholeWord ? 'w' : ''),
                detail: ''
            }
        }))
            .then(word => {
                if (!word) return;
                if (word.label == '* All *') words = []
                else {
                    const highlights = words.filter(w => w.expression == word.label)
                    if (highlights && highlights.length) {
                        words.splice(words.indexOf(highlights[0]), 1);
                    }
                }
                updateDecorations();
            })
    });

    interface HighlightColors {
        light: string
        dark: string
    }

    let colors: HighlightColors[] = [
        { light: '#b3d9ff', dark: 'cyan' },
        { light: '#e6ffb3', dark: 'pink' },
        { light: '#b3b3ff', dark: 'lightgreen' },
        { light: '#ffd9b3', dark: 'magenta' },
        { light: '#ffb3ff', dark: 'cornflowerblue' },
        { light: '#b3ffb3', dark: 'orange' },
        { light: '#ffff80', dark: 'green' },
        { light: '#d1e0e0', dark: 'red' },
    ];

    let decorators = [];
    colors.forEach(function (color) {
        let decorationType = window.createTextEditorDecorationType({
            borderWidth: '2px',
            borderStyle: 'solid',
            overviewRulerLane: OverviewRulerLane.Right,
            light: {
                // this color will be used in light color themes
                overviewRulerColor: color.light,
                borderColor: color.light,
                backgroundColor: color.light
            },
            dark: {
                // this color will be used in dark color themes
                overviewRulerColor: color.dark,
                borderColor: color.dark
            }
        });
        decorators.push(decorationType);
    });

    let activeEditor = window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    window.onDidChangeVisibleTextEditors(function (editor) {
        updateDecorations();
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
        timeout = setTimeout(updateActive, 500);
    }

    function updateActive() {
        updateDecorations(true)
    }

    function updateDecorations(active?) {
        window.visibleTextEditors.forEach(editor => {
            if (active && editor.document != window.activeTextEditor.document) return;
            const text = editor.document.getText();
            let match;
            let decs = [];
            decorators.forEach(function () {
                let dec = [];
                decs.push(dec);
            });
            words.forEach(function (w, n) {
                const opts = w.ignoreCase ? 'gi' : 'g'
                const expression = w.wholeWord ? '\\b' + w.expression + '\\b' : w.expression
                const regEx = new RegExp(expression, opts);
                while (match = regEx.exec(text)) {
                    const startPos = editor.document.positionAt(match.index);
                    const endPos = editor.document.positionAt(match.index + match[0].length);
                    const decoration = { range: new Range(startPos, endPos) };
                    decs[n % decs.length].push(decoration);
                }
            });
            decorators.forEach(function (d, i) {
                editor.setDecorations(d, decs[i]);
            });

        })

    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}