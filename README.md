# highlight-words

![screencast](https://github.com/rsbondi/highlight-words/raw/master/images/highlight.gif)

This extension is adapted from the sample VS code extension decorator-sample, inspired by atom-quick-highlight.

The sample creates a decoration for each selected word that appears in all editors. 

# Usage

* You can add words by selecting text in the editor and chosing "Highlight Selection" from the command pallet.  
* To stop highlighting, choose "Highlight Remove", then the desired word or expression, or all
* You may also remove all from the command "Highlight Remove All" without the prompt for selection
* To highlight using regular expression choose "Highlight Expression" and enter expression(slashes optional, can ignore case with `/expression/i`(g flag is automatic, i flag accepted, all others ignored).  
* To highlight with options choose "Highlight Selection with Options" and choose `whole word`, `ignore case` or `both` when presented

# Configuration

The following options can be configured

`highlightwords.colors`: this is an array of light/dark pairs for respective theme types, you can have as few or as many as you like

`highlightwords.box`: show highlights as a box around the selections if true, set highlight as background color if false

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
],"highlightwords.box": {
    "light": false,
    "dark": true
}
```


