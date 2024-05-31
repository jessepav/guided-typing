// COMPONENT_CSS {{{1

const COMPONENT_CSS = `
    <style>
    :host {
        display: block;
        contain: content;
    }

    :host([hidden]) {
        display: none;
    }

    div.keyboard {
        width: 97%;
        margin: auto;
        height: auto;
        aspect-ratio: 11 / 3.5;
        border: 1px solid black;
        font-weight: bold;
        font-family: sans-serif;

        display: flex;
        flex-flow: column nowrap;
        align-items: stretch;

        container: keyboard / size;
    }

    div.keyboard-row {
        height: 20%;

        display: flex;
        flex-flow: row nowrap;
        align-items: stretch;
    }

    div.key {
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        justify-content: space-evenly;
        border: 1px solid black;
        background: linear-gradient(to bottom, #f5f3f3, #d5d5d5);
    }

    div.key.highlighted {
        background: #9393ff;
    }

    span.key-label {
        margin: 0;
        padding: 0;
        line-height: 100%;
    }

    @container keyboard (min-width: 1px) {
        span.key-label { font-size: 6cqb; }
        span.key-label.single { font-size: 8cqb; }
        span.key-label.small-label { font-size: 6cqb; }
    }
    </style>
`;

// US_QWERTY_DEF {{{1

const US_QWERTY_DEF = {
    /*
     * The physical layout of the keyboard, given as nested arrays.
     * The outer array lists rows from top to bottom.
     * Within each row, each entry is of the form:
     *
     *   [canonical name, relative width, ...glyphs (0 to 4)]
     *
     * If the canonical name is falsy, the key will be rendered blank
     * in the generated HTML and won't be used for productions.
     */
    layout: [
        [
            ['`', 1, '`', '~'],
            ['1', 1, '1', '!'],
            ['2', 1, '2', '@'],
            ['3', 1, '3', '#'],
            ['4', 1, '4', '$'],
            ['5', 1, '5', '%'],
            ['6', 1, '6', '^'],
            ['7', 1, '7', '&'],
            ['8', 1, '8', '*'],
            ['9', 1, '9', '('],
            ['0', 1, '0', ')'],
            ['-', 1, '-', '_'],
            ['=', 1, '=', '+'],
            ['\b', 2, 'Backspace'],
        ],
        [
            ['\t', 1.5, 'Tab'],
            ['q', 1, 'q', 'Q'],
            ['w', 1, 'w', 'W'],
            ['e', 1, 'e', 'E'],
            ['r', 1, 'r', 'R'],
            ['t', 1, 't', 'T'],
            ['y', 1, 'y', 'Y'],
            ['u', 1, 'u', 'U'],
            ['i', 1, 'i', 'I'],
            ['o', 1, 'o', 'O'],
            ['p', 1, 'p', 'P'],
            ['[', 1, '[', '{'],
            [']', 1, ']', '}'],
            ['\\', 1.5, '\\', '|'],
        ],
        [
            ['Caps', 1.8, 'Caps'],
            ['a', 1, 'a', 'A'],
            ['s', 1, 's', 'S'],
            ['d', 1, 'd', 'D'],
            ['f', 1, 'f', 'F'],
            ['g', 1, 'g', 'G'],
            ['h', 1, 'h', 'H'],
            ['j', 1, 'j', 'J'],
            ['k', 1, 'k', 'K'],
            ['l', 1, 'l', 'L'],
            [';', 1, ';', ':'],
            ["'", 1, "'", '"'],
            ['\n', 2.2, 'Enter'],
        ],
        [
            ['Shift_L', 2.5, 'Shift'],
            ['z', 1, 'z', 'Z'],
            ['x', 1, 'x', 'X'],
            ['c', 1, 'c', 'C'],
            ['v', 1, 'v', 'V'],
            ['b', 1, 'b', 'B'],
            ['n', 1, 'n', 'N'],
            ['m', 1, 'm', 'M'],
            [',', 1, ',', '<'],
            ['.', 1, '.', '>'],
            ['/', 1, '/', '?'],
            ['Shift_R', 2.5, 'Shift'],
        ],
        [
            ['Ctrl_L', 1.2, 'Ctrl'],
            ['', 1.2],
            ['Alt_L', 1.2, 'Alt'],
            [' ', 6.6],
            ['Alt_R', 1.2, 'Alt'],
            ['', 1.2],
            ['', 1.2],
            ['Ctrl_R', 1.2, 'Ctrl'],
        ],
    ],

    // a function that returns an array of the canonical names of the keys that are
    // required to produce a given character.
    keysForChar(c) {
    },

    // a function that expands characters in text which require the use of dead keys
    // into the constituent key presses needed to produce them. For instance, if
    // producing "é" requires pressing "'" and then "e", this function would replace
    // all instance of "é" in text with the two character sequence "'e".
    expandDeadKeysFunc(text) {
        return text;
    }
};

/* generateKeyboardHTML() {{{1
 *
 * generateKeyboardHTML() reads a keyboard definition and returns an object with
 * these properties:
 *
 *   keyboardHTML:  HTML implementing the keyboard layout
 *
 *   nameIdMap:     a map from each key's canonical name to the element ID of
 *                  that key in keyboardHTML
 */

function generateKeyboardHTML(def) {
    let idCntr = 0;
    const genId = () => `key-${String(++idCntr).padStart(3, '0')}`;

    const nameIdMap = new Map();
    const htmlParts = [];

    htmlParts.push("<div class='keyboard'>");
    for (const row of def.layout) {
        htmlParts.push("<div class='keyboard-row'>");
        for (const key of row) {
            const [cname, size, ...glyphs] = key;
            if (!cname) {  // a blank key
                htmlParts.push(`<div class='key' style='flex: ${size} 0px;'></div>`);
            } else {
                const keyId = genId();
                nameIdMap.set(cname, keyId);
                htmlParts.push(`<div id='${keyId}' class='key' style='flex: ${size} 0px;'>`);
                let extraClasses = '';
                if (cname == '\b') // make the backspace label smaller than it would be
                    extraClasses += ' small-label';
                for (const glyph of glyphs)
                    htmlParts.push(`<span class='key-label${extraClasses}'>${glyph}</span>`);
                htmlParts.push("</div>");
            }
        }
        htmlParts.push("</div>");
    }
    htmlParts.push("</div>");

    return {
        keyboardHTML: htmlParts.join('\n'),
        nameIdMap
    };
}

// keyboard maps and getKeyboardData() {{{1

// Maps the name of a layout to its definition
const keyboardDefMap = new Map();

// Maps the name of a layout to its data object (lazily populated):
//  { nameIdMap, templateEl }
const keyboardDataMap = new Map();

function addKeyboardDef(layoutName, keyboardDef) {
    keyboardDefMap.set(layoutName, keyboardDef);
    keyboardDataMap.delete(layoutName);  // clear any cached data
}

addKeyboardDef('US_QWERTY', US_QWERTY_DEF);

function getLayoutNames() {
    return [...keyboardDefMap.keys()];
}

// Returns the entry in keyboardDataMap corresponding to layoutName if available,
// otherwise generates the entry and puts it in keyboardDataMap before returning it.
function getKeyboardData(layoutName) {
    let keyboardData = keyboardDataMap.get(layoutName);
    if (!keyboardData) {
        const { nameIdMap, keyboardHTML } = generateKeyboardHTML(keyboardDefMap.get(layoutName));
        const templateEl = document.createElement('template');
        templateEl.innerHTML = COMPONENT_CSS + keyboardHTML;
        keyboardData = { nameIdMap, templateEl };
        keyboardDataMap.set(layoutName, keyboardData);
    }
    return keyboardData;
}

// class DisplayKeyboard {{{1

class DisplayKeyboard extends HTMLElement
{
    static observedAttributes = [];

    initialized = false;

    constructor(layoutName) {
        super();
        this.layoutName = layoutName;
    }

    connectedCallback() {
        // We won't go through this initialization process more than once: our layout
        // is fixed upon the first attachment to the DOM.
        if (this.initialized)
            return;

        if (!this.layoutName)
            this.layoutName = this.getAttribute("layout");
        if (!this.layoutName || !keyboardDefMap.has(this.layoutName))
            this.layoutName = 'US_QWERTY';
        this.setAttribute("layout", this.layoutName);

        const keyboardData = getKeyboardData(this.layoutName);
        this.canonicalNameMap = keyboardData.canonicalNameMap;
        this.plainNameMap = keyboardData.plainNameMap;
        this.shiftedNameMap = keyboardData.shiftedNameMap;
        this.expandDeadKeysFunc = keyboardData.expandDeadKeysFunc;

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(keyboardData.templateEl.content.cloneNode(true));

        this.initialized = true;
    }

    disconnectedCallback() {
    }

    // Highlight keys with the given names
    highlightKeys(...names) {
        this.shadowRoot.querySelectorAll("div.key.highlighted").forEach(el => { el.classList.remove('highlighted'); });
        for (const name of names) {
            const canonicalName = this.canonicalNameMap.has(name) ? name :
                                  this.plainNameMap.has(name) ? this.plainNameMap.get(name) :
                                  this.shiftedNameMap.has(name) ? this.shiftedNameMap.get(name) : null;
            if (canonicalName) {
                const keyId = this.canonicalNameMap.get(canonicalName).id;
                this.shadowRoot.getElementById(keyId).classList.add('highlighted');
            }
        }
    }

    // Highlights all the keys necessary to produce a character, taking into account left and right shift
    highlightKeysForChar(char) {
        const keys = [char];
        const cnameShifted = this.shiftedNameMap.get(char);
        if (cnameShifted) {
            const hand = this.canonicalNameMap.get(cnameShifted).hand;
            if (hand == 'l')
                keys.push('Shift_R');
            else if (hand == 'r')
                keys.push('Shift_L');
        }
        this.highlightKeys(...keys);
    }
}

// }}}

customElements.define("display-keyboard", DisplayKeyboard);

export {
    DisplayKeyboard,
    addKeyboardDef,
    getLayoutNames,
};
