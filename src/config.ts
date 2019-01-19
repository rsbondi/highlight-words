'use strict';
import { window, OverviewRulerLane, workspace, ThemableDecorationRenderOptions, TextEditorDecorationType } from 'vscode';

interface HighlightColors {
    light: string
    dark: string
}

interface BoxOptions {
    light: boolean
    dark: boolean
}

interface ConfigValues {
    decorators: TextEditorDecorationType[]
    defaultMode?: number,
    showSidebar?: boolean
}

class HighlightConfig {
    static getConfigValues() :ConfigValues {
        let config = workspace.getConfiguration('highlightwords')
        let colors: HighlightColors[] = <HighlightColors[]>config.get('colors');
        let box = config.get<BoxOptions>('box')
        const defaultMode = <number>config.get('defaultMode')
        const showSidebar = <boolean>config.get('showSidebar')
    
        let decorators: TextEditorDecorationType[] = [];
        colors.forEach(function (color) {
            var dark: ThemableDecorationRenderOptions = {
                // this color will be used in dark color themes
                overviewRulerColor: color.dark,
                backgroundColor: box.dark ? 'inherit' : color.dark,
                borderColor: color.dark
            }
            if(!box.dark) 
                dark.color = '#555555'
            let decorationType = window.createTextEditorDecorationType({
                borderWidth: '2px',
                borderStyle: 'solid',
                overviewRulerLane: OverviewRulerLane.Right,
                light: {
                    // this color will be used in light color themes
                    overviewRulerColor: color.light,
                    borderColor: color.light,
                    backgroundColor: box.light ? 'inherit' : color.light
                },
                dark: dark
            });
            decorators.push(decorationType);
        });
    
        return {decorators, defaultMode, showSidebar}  
    }
}

export default HighlightConfig