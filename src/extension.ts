'use strict';
import { commands, ExtensionContext, window, OverviewRulerLane, workspace, Range, QuickPickItem, ThemableDecorationRenderOptions } from 'vscode';

export function activate(context: ExtensionContext) {
    interface Highlightable {
        expression: string
        wholeWord: boolean
        ignoreCase: boolean
    }

    let words: Highlightable[] = []
    let decorators = []
    enum Modes {
        Default,
        WholeWord,
        IgnoreCase,
        Both
    }    
    let mode = 0

    commands.registerCommand('highlightwords.addRegExpHighlight', function () {
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
        if(!word) {
            const range = editor.document.getWordRangeAtPosition(editor.selection.start)
            if(range) word = editor.document.getText(range)
        }
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
                const ww = mode == Modes.WholeWord || mode == Modes.Both
                const ic = mode == Modes.IgnoreCase || mode == Modes.Both
                
                words.push({ expression: word, wholeWord: ww, ignoreCase: ic });
                updateDecorations()
            }
        }
    }

    commands.registerCommand('highlightwords.addHighlight', function () {
        addSelected()
    });

    commands.registerCommand('highlightwords.addHighlightWithOptions', function () {
        addSelected(true)
    });

    commands.registerCommand('highlightwords.removeHighlight', function () {
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

    commands.registerCommand('highlightwords.removeAllHighlights', function () {
        words = []
        updateDecorations();
    });

    commands.registerCommand('highlightwords.setHighlightMode', function () {
        const modes = ['Default', 'Whole Word', 'Ignore Case', 'Both'].map((s, i) => mode == i ? s+' ✅' : s)
        window.showQuickPick(modes).then(option => {
            if (typeof option == 'undefined') return;

            mode = modes.indexOf(option)
        })
    })
    
    interface HighlightColors {
        light: string
        dark: string
    }

    interface BoxOptions {
        light: boolean,
        dark: boolean
    }

    function getConfigValues() {
        let config = workspace.getConfiguration('highlightwords')
        let colors: HighlightColors[] = <HighlightColors[]>config.get('colors');
        const defaultMode = <number>config.get('defaultMode')
        if(typeof defaultMode != 'undefined') mode = defaultMode
    
        decorators = [];
        colors.forEach(function (color) {
            var dark: ThemableDecorationRenderOptions = {
                // this color will be used in dark color themes
                overviewRulerColor: color.dark,
                backgroundColor: config.get<BoxOptions>('box').dark ? 'inherit' : color.dark,
                borderColor: color.dark
            }
            if(!config.get<BoxOptions>('box').dark) 
                dark.color = '#555555'
            let decorationType = window.createTextEditorDecorationType({
                borderWidth: '2px',
                borderStyle: 'solid',
                overviewRulerLane: OverviewRulerLane.Right,
                light: {
                    // this color will be used in light color themes
                    overviewRulerColor: color.light,
                    borderColor: color.light,
                    backgroundColor: config.get<BoxOptions>('box').light ? 'inherit' : color.light
                },
                dark: dark
            });
            decorators.push(decorationType);
        });
    
        return decorators;  
    }

    decorators = getConfigValues()

    let activeEditor = window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    workspace.onDidChangeConfiguration(() => {
        decorators = getConfigValues()
        updateDecorations()
    })

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