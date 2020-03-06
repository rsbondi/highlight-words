'use strict';
import { window, TextEditorDecorationType, Range, QuickPickItem, TextEditor, DecorationOptions} from 'vscode';
import HighlightTreeProvider from './tree'

export interface Highlightable {
    expression: string
    wholeWord: boolean
    ignoreCase: boolean
}

export interface SearchLocation {
    index: number
    count: number
}

enum Modes {
    Default,
    WholeWord,
    IgnoreCase,
    Both
}    

const qpOptions = ['ignore case', 'whole word', 'both']

class Highlight {
    private words: Highlightable[]
    private decorators: TextEditorDecorationType[]
    private mode: number
    private treeProvider: HighlightTreeProvider
    private ranges: {}
    private currentWord: string
    private currentSelection: string

    constructor() {
        this.words = []
        this.decorators = []
        this.treeProvider = new HighlightTreeProvider(this.getWords());
        this.ranges = {}
        this.currentWord = ""
        this.currentSelection = ""
        window.registerTreeDataProvider('hilightWordsExplore', this.treeProvider);
    }

    public setMode(m) { this.mode = m }
    public getMode() { return this.mode }
    public getWords() { return this.words }
    public setDecorators(d) { this.decorators = d }

    public getLocationIndex(expression: string, range: Range) {
        this.treeProvider.currentExpression = expression
        this.treeProvider.currentIndex = {index: 0, count: 0}
        Object.keys(this.ranges[expression]).some((r, i) => {
            const thisrange:Range = this.ranges[expression][i]
            if(thisrange.start.character == range.start.character && thisrange.start.line == range.start.line) {
                this.treeProvider.currentIndex = {index: i+1, count: this.ranges[expression].length}
                return true
            }
        })
        this.treeProvider.refresh()
    }

    private decorateWord(editor: TextEditor, decs, w: Highlightable, n: number) {
        const text = editor.document.getText();
        let match;
        const opts = w.ignoreCase ? 'gi' : 'g'
        const expression = w.wholeWord ? '\\b' + w.expression + '\\b' : w.expression
        const regEx = new RegExp(expression, opts);
        this.ranges[w.expression] = []
        while (match = regEx.exec(text)) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            if (w.expression == this.currentSelection 
                && editor.document.getText(editor.document.getWordRangeAtPosition(startPos)) 
                == this.currentWord ) continue;
            const decoration = { range: new Range(startPos, endPos) };
            decs[n % decs.length].push(decoration);
            this.ranges[w.expression].push(decoration.range)
        }
    }

    public updateDecorations(active?) {
        window.visibleTextEditors.forEach(editor => {
            if (active && editor.document != window.activeTextEditor.document) return;
            let decs = [];
            this.decorators.forEach(function () {
                let dec = [];
                decs.push(dec);
            });
            this.words.forEach((w, n) => this.decorateWord(editor, decs, w, n));
            if (this.currentSelection) {
                this.decorateWord(editor, decs, {
                    expression: this.currentSelection, ignoreCase: true, wholeWord: false}, 1)
            }
            if (this.currentWord) {
                this.decorateWord(editor, decs, {
                    expression: this.currentWord, ignoreCase: false, wholeWord: true}, 0)
            }
            this.decorators.forEach(function (d, i) {
                editor.setDecorations(d, decs[i]);
            });
            this.treeProvider.words = this.words
            this.treeProvider.refresh()

        })

    }

    public clearAll() {
        this.words = []
        this.updateDecorations()
    }

    public remove(word: QuickPickItem) {
        if (!word) return;
        if (word.label == '* All *') this.words = []
        else {
            const highlights = this.words.filter(w => w.expression == word.label)
            if (highlights && highlights.length) {
                this.words.splice(this.words.indexOf(highlights[0]), 1);
            }
        }
        this.updateDecorations();
    }

    public updateActive() {
        this.updateDecorations(true)
    }

    public updateOptions(word) {
        window.showQuickPick(["default"].concat(qpOptions)).then(option => {
            if (!option) return;

            const theword = this.words.map(w => w.expression).indexOf(word)

            this.words[theword] = {
                expression: word,
                wholeWord: option == 'whole word' || option == 'both',
                ignoreCase: option == 'ignore case' || option == 'both'
            }
            this.updateDecorations()
        })
    }

    public addCurrentWord() {
        const word = this.getWordAtCurrentLocation()
        this.currentWord = word
        this.updateDecorations()
    }

    public addCurrentSelection() {
        this.currentSelection = window.activeTextEditor.document.getText(window.activeTextEditor.selection)
        this.updateDecorations()
    }

    private getSelection() {
        const editor = window.activeTextEditor;
        let sel
        const range = editor.document.getWordRangeAtPosition(editor.selection.start)
        if(range) sel = editor.document.getText(range)
        return sel
    }

    public getWordAtCurrentLocation(): string {
        const editor = window.activeTextEditor;
        let word = editor.document.getText(editor.selection);
        if(!word) {
            word = this.getSelection()
        }
        return word
    }

    public addSelected(withOptions?: boolean) {
        let word = this.getWordAtCurrentLocation()
        if (!word) {
            window.showInformationMessage('Nothing selected!')
            return;
        }
        word = word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") // raw selected text, not regexp
        const highlights = this.words.filter(w => w.expression == word) // avoid duplicates
        if (!highlights || !highlights.length) {
            if (withOptions) {
                window.showQuickPick(qpOptions).then(option => {
                    if (!option) return;

                    this.words.push({
                        expression: word,
                        wholeWord: option == 'whole word' || option == 'both',
                        ignoreCase: option == 'ignore case' || option == 'both'
                    });
                    this.updateDecorations()
                })
            }
            else {
                const ww = this.mode == Modes.WholeWord || this.mode == Modes.Both
                const ic = this.mode == Modes.IgnoreCase || this.mode == Modes.Both
                
                this.words.push({ expression: word, wholeWord: ww, ignoreCase: ic });
                this.updateDecorations()
            }
        } else if(highlights.length) {
            this.words.splice(this.words.indexOf(highlights[0]),1)
            this.updateDecorations()
        }

    }

    public addRegExp(word: string) {
        try {
            let opts = ''
            if (word.indexOf('/') == 0) {
                const slashes = word.split('/')
                opts = slashes[slashes.length - 1]
                word = word.slice(1, word.length - opts.length - 1)
            }
            new RegExp(word)
            const highlights = this.words.filter(w => w.expression == word)
            if (!highlights || !highlights.length) {
                this.words.push({
                    expression: word,
                    wholeWord: false,
                    ignoreCase: !!~opts.indexOf('i')
                });
                this.updateDecorations();
            }
        } catch (e) {
            window.showInformationMessage(word + ' is an invalid expression')
        }

    }
}

export default Highlight