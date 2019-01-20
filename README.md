# highlight-words

![screencast](https://github.com/rsbondi/highlight-words/raw/master/images/highlight.gif)

This extension is adapted from the sample VS code extension decorator-sample, inspired by atom-quick-highlight.

It creates a decoration for each selected word that appears in all editors. 

# Usage

* You can add words by chosing **Highlight Current** from the command pallet, this will highlight the word at the cursor or the selection.  
* To stop highlighting, choose **Highlight Remove**, then the desired word or expression, or all
* You may also remove all from the command **Highlight Remove All** without the prompt for selection
* To highlight using regular expression choose **Highlight Expression** and enter expression(slashes optional, can ignore case with `/expression/i`(g flag is automatic, i flag accepted, all others ignored).  
* To highlight with options choose **Highlight Selection with Options** and choose `whole word`, `ignore case` or `both` when presented
* You can set the mode for "Highlight Current" from the **Set Highlight Mode** command.  The default can be set in the configuration.
* Sidebar can show in explorer view and can be toggled on and off with **Highlight Toggle Sidebar** command.  This provides features such as navigating highlighted items, context menu for changing options and removing.

# Configuration

The following options can be configured

`highlightwords.colors`: this is an array of light/dark pairs for respective theme types, you can have as few or as many as you like

`highlightwords.box`: show highlights as a box around the selections if true, set highlight as background color if false

`highlightwords.defaultMode`: the initial mode when initialized. 0=default, 1=whole word, 2=ignore case, 3=whole word and ignore case

`highlightwords.showSidebar` provides a view in the explorer window for searching, changing options and removing highlights

defaults shown below

```json
"highlightwords.colors": [
    { "light": "#b3d9ff", "dark": "cyan" },
    { "light": "#e6ffb3", "dark": "pink" },
    { "light": "#b3b3ff", "dark": "lightgreen" },
    { "light": "#ffd9b3", "dark": "magenta" },
    { "light": "#ffb3ff", "dark": "cornflowerblue" },
    { "light": "#b3ffb3", "dark": "orange" },
    { "light": "#ffff80", "dark": "green" },
    { "light": "#d1e0e0", "dark": "red" }                                        
    ...
],
"highlightwords.box": {
    "light": false,
    "dark": true
},
"highlightwords.defaultMode": {
    "default": 0
}

"highlightwords.showSidebar": {
    "default": true
}
```
