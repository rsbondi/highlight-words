"use strict";

var vscode = require('vscode');

function activate(context) {
    console.log('highlight-words is activated');
    var words = [];
    vscode.commands.registerCommand('extension.addRegExpHighlight', function () {
        vscode.window.showInputBox({prompt: 'Enter expression'})
            .then(word => {
                try {
                    new RegExp(word)
                    if (!~words.indexOf(word)) {
                        words.push(word);
                        updateDecorations();
                    }
                } catch (e) {
                    vscode.window.showInformationMessage(word + ' is an invalid expression')
                }
            });
    });

    vscode.commands.registerCommand('extension.addHighlight', function () {
        var editor = vscode.window.activeTextEditor;
        var word = editor.document.getText(editor.selection);
        if (!word) {
            vscode.window.showInformationMessage('Nothing selected!');
            return;
        }
        word = word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") // raw selected text, not regexp
        if (!~words.indexOf(word)) {
            words.push(word);
            updateDecorations();
        }
    });

    vscode.commands.registerCommand('extension.removeHighlight', function () {
        vscode.window.showQuickPick(words.concat(['* All *']))
            .then(word => {
                if(!word) return;
                if(word == '* All *') words = [];
                else words.splice(words.indexOf(word), 1);
                updateDecorations();
            })
    });
    
    var colors = [
        { light: 'darkblue', dark: 'cyan' },
        { light: 'darkred', dark: 'pink' },
        { light: 'darkgreen', dark: 'lightgreen' },
        { light: 'darkpurple', dark: 'magenta' },
        { light: 'darkblue', dark: 'cornflowerblue' },
        { light: 'darkred', dark: 'orange' },
        { light: 'darkgreen', dark: 'green' },
        { light: 'darkpurple', dark: 'red' },
    ];
    var decorators = [];
    colors.forEach(function (color) {
        var decorationType = vscode.window.createTextEditorDecorationType({
            borderWidth: '2px',
            borderStyle: 'solid',
            overviewRulerColor: color.dark,
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            light: {
                // this color will be used in light color themes
                borderColor: color.dark
            },
            dark: {
                // this color will be used in dark color themes
                borderColor: color.dark
            }
        });
        decorators.push(decorationType);
    });
    var activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }
    vscode.window.onDidChangeActiveTextEditor(function (editor) {
        activeEditor = editor;
        if (editor) {
            updateDecorations();
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(function (event) {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    var timeout = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 500);
    }

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        vscode.window.visibleTextEditors.forEach(editor => {
            var text = editor.document.getText();
            var match;
            var decs = [];
            decorators.forEach(function () {
                var dec = [];
                decs.push(dec);
            });
            console.log('highlight words', words);
            words.forEach(function (i, n) {
                var regEx = new RegExp(i, 'g');
                while (match = regEx.exec(text)) {
                    var startPos = editor.document.positionAt(match.index);
                    var endPos = editor.document.positionAt(match.index + match[0].length);
                    var decoration = { range: new vscode.Range(startPos, endPos)};
                    decs[n % decs.length].push(decoration);
                }
            });
            decorators.forEach(function (d, i) {
                editor.setDecorations(d, decs[i]);
            });

        })

    }
}
exports.activate = activate;
