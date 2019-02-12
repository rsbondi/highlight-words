'use strict';
import  { Highlightable } from './highlight'
import { TreeDataProvider, TreeItem, Event, EventEmitter, Command } from 'vscode'

class HighlightTreeProvider implements TreeDataProvider<HighlightNode> {
	private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    
    constructor(public words: Highlightable[]) {}

    getTreeItem(element: HighlightNode): TreeItem {
		return element;
	}

	getChildren(element?: HighlightNode): Thenable<HighlightNode[]> {
        let nodes: HighlightNode[] = this.words.map(w => {
            return new HighlightNode(w.expression, w)
        })
        return Promise.resolve(nodes)
    }

    public refresh(): any {
		this._onDidChangeTreeData.fire();
	}

}

export class HighlightNode extends TreeItem {

	constructor(
        public readonly label: string,
        public readonly highlight: Highlightable,
		public readonly command?: Command
	) {
		super(label);
    }
    
    private getOpts(): string {
        return this.highlight.ignoreCase && this.highlight.wholeWord ? 'both' :
               this.highlight.ignoreCase ? 'ignoreCase' :
               this.highlight.wholeWord ? 'wholeWord' : 'default'
    }

	get tooltip(): string {
		return `${this.label}-${this.getOpts()}`;
	}

	get description(): string {
		return this.getOpts()
	}

	contextValue = 'highlights';

}

export default HighlightTreeProvider