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
        border: 1px solid black;
        background: linear-gradient(to bottom, #f5f3f3, #d5d5d5);

        display: grid;
        align-items: center;
        justify-items: center;
        align-content: space-evenly;
        justify-content: space-evenly;

        &[data-num-glyphs="1"] {
            grid-template:
                "a" 1fr / 1fr;
        }

        &[data-num-glyphs="2"] {
            grid-template:
                "b" 1fr
                "a" 1fr / 1fr;
        }

        &[data-num-glyphs="3"], &[data-num-glyphs="4"] {
            grid-template:
                "b d" 1fr
                "a c" 1fr / 1fr 1fr;
        }

        &.highlighted {
            background: #9393ff;
        }

        & > span.key-label:nth-child(1) { grid-area: a; }
        & > span.key-label:nth-child(2) { grid-area: b; }
        & > span.key-label:nth-child(3) { grid-area: c; }
        & > span.key-label:nth-child(4) { grid-area: d; }
    }

    span.key-label {
        margin: 0;
        padding: 0;
        line-height: 100%;
    }

    @container keyboard (min-width: 1px) {
        span.key-label { font-size: 6cqb; }

        div.key[data-num-glyphs="1"] {
            & > span.key-label { font-size: 8cqb; }
            & > span.key-label.small-label { font-size: 6cqb; }
        }
    }
    </style>
`;

// US_QWERTY_DEF {{{1

// Data for use with keysForChar() below {{{

// These are the characters for which we do not need any modifier keys
const US_QWERTY_PLAIN_CHARS = new Set(
    "`1234567890-=\b" +
    "\tqwertyuiop[]\\" +
    "asdfghjkl;'\n" +
    "zxcvbnm,./" +
    " "
);

// These are the characters for which we need the right shift key
const US_QWERTY_RIGHT_SHIFT_CHARS = new Set(
    '~!@#$%^' +
    'QWERT' +
    'ASDFG' +
    'ZXCVB'
);

// These are the characters for which we need the left shift key
const US_QWERTY_LEFT_SHIFT_CHARS = new Set(
    '&*()_+' +
    'YUIOP{}|' +
    'HJKL:"' +
    'NM<>?'
);

// A map from a char that requires shift to the canonical name of the key
// that needs to be pressed along with shift.
const US_QWERTY_SHIFT_CHARS_CNAME_MAP = (() => {
    const plainChars =
        "`1234567890-=" +
        "qwertyuiop[]\\" +
        "asdfghjkl;'" +
        "zxcvbnm,./";
    const shiftChars =
        '~!@#$%^&*()_+' +
        'QWERTYUIOP{}|' +
        'ASDFGHJKL:"' +
        'ZXCVBNM<>?';
    const m = new Map();
    for (let i = 0; i < shiftChars.length; i++)
        m.set(shiftChars[i], plainChars[i]);
    return m;
})();

// }}}

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
            ['q', 1, 'q'],
            ['w', 1, 'w'],
            ['e', 1, 'e'],
            ['r', 1, 'r'],
            ['t', 1, 't'],
            ['y', 1, 'y'],
            ['u', 1, 'u'],
            ['i', 1, 'i'],
            ['o', 1, 'o'],
            ['p', 1, 'p'],
            ['[', 1, '[', '{'],
            [']', 1, ']', '}'],
            ['\\', 1.5, '\\', '|'],
        ],
        [
            ['Caps', 1.8, 'Caps'],
            ['a', 1, 'a'],
            ['s', 1, 's'],
            ['d', 1, 'd'],
            ['f', 1, 'f'],
            ['g', 1, 'g'],
            ['h', 1, 'h'],
            ['j', 1, 'j'],
            ['k', 1, 'k'],
            ['l', 1, 'l'],
            [';', 1, ';', ':'],
            ["'", 1, "'", '"'],
            ['\n', 2.2, 'Enter'],
        ],
        [
            ['Shift_L', 2.5, 'Shift'],
            ['z', 1, 'z'],
            ['x', 1, 'x'],
            ['c', 1, 'c'],
            ['v', 1, 'v'],
            ['b', 1, 'b'],
            ['n', 1, 'n'],
            ['m', 1, 'm'],
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

    // A function that returns an array of the canonical names of the keys that are
    // required to produce a given character, or undefined if the character cannot be
    // produced with this keyboard.
    keysForChar(c) {
        if (US_QWERTY_PLAIN_CHARS.has(c))
            return [c];
        else if (US_QWERTY_RIGHT_SHIFT_CHARS.has(c))
            return ['Shift_R', US_QWERTY_SHIFT_CHARS_CNAME_MAP.get(c)];
        else if (US_QWERTY_LEFT_SHIFT_CHARS.has(c))
            return ['Shift_L', US_QWERTY_SHIFT_CHARS_CNAME_MAP.get(c)];
        else
            return undefined;
    },

    // a function that expands characters in text which require the use of dead keys
    // into the constituent key presses needed to produce them. For instance, if
    // producing "é" requires pressing "'" and then "e", this function would replace
    // all instance of "é" in text with the two character sequence "'e".
    expandDeadKeys(text) {
        return text;  // US QWERTY has no dead keys
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
            let [cname, size, ...glyphs] = key;
            if (!cname) {  // a blank key
                htmlParts.push(`<div class='key' style='flex: ${size} 0px;'></div>`);
            } else {
                const keyId = genId();
                nameIdMap.set(cname, keyId);
                htmlParts.push(`<div id='${keyId}' class='key' data-num-glyphs='${glyphs.length}' style='flex: ${size} 0px;'>`);
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

        const kdef = keyboardDefMap.get(this.layoutName);
        const kdata = getKeyboardData(this.layoutName);
        this.nameIdMap = kdata.nameIdMap;
        this.expandDeadKeys = kdef.expandDeadKeys;
        this.keysForChar = kdef.keysForChar;

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(kdata.templateEl.content.cloneNode(true));

        this.initialized = true;
    }

    disconnectedCallback() {
    }

    // Clear all highlights and then highlight the keys with the canonical names given in cnames
    highlightKeys(cnames) {
        this.shadowRoot.querySelectorAll("div.key.highlighted").forEach(el => { el.classList.remove('highlighted'); });
        if (cnames) {
            for (const name of cnames) {
                const id = this.nameIdMap.get(name);
                if (id)
                    this.shadowRoot.getElementById(id).classList.add('highlighted');
            }
        }
    }

    // Highlights all the keys necessary to produce a character
    highlightKeysForChar(c) {
        const cnames = this.keysForChar(c);
        this.highlightKeys(cnames);
    }
}

// }}}

customElements.define("display-keyboard", DisplayKeyboard);

export {
    DisplayKeyboard,
    addKeyboardDef,
    getLayoutNames,
};
