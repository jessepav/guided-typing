// US_QWERTY_DEF {{{1

const US_QWERTY_DEF = {
    layout: [ // rows from top to bottom
        [
            // [string, string, number]: [plain, shifted, size (in relative numeric units)]
            ['`', '~', 1],
            ['1', '!', 1],
            ['2', '@', 1],
            ['3', '#', 1],
            ['4', '$', 1],
            ['5', '%', 1],
            ['6', '^', 1],
            ['7', '&', 1],
            ['8', '*', 1],
            ['9', '(', 1],
            ['0', ')', 1],
            ['-', '_', 1],
            ['=', '+', 1],
            ['Backspace', 2],   // [string, number]: same key plain and shifted
        ],
        [
            ['Tab', 1.5],
            ['q', 'Q', 1],
            ['w', 'W', 1],
            ['e', 'E', 1],
            ['r', 'R', 1],
            ['t', 'T', 1],
            ['y', 'Y', 1],
            ['u', 'U', 1],
            ['i', 'I', 1],
            ['o', 'O', 1],
            ['p', 'P', 1],
            ['[', '{', 1],
            [']', '}', 1],
            ['\\', '|', 1.5],
        ],
        [
            ['Caps', 1.8],
            ['a', 'A', 1],
            ['s', 'S', 1],
            ['d', 'D', 1],
            ['f', 'F', 1],
            ['g', 'G', 1],
            ['h', 'H', 1],
            ['j', 'J', 1],
            ['k', 'K', 1],
            ['l', 'L', 1],
            [';', ':', 1],
            ["'", '"', 1],
            ['Enter', 2.2],
        ],
        [
            // [string, number, string]: [displayed name, size, canonical name]
            ['Shift', 2.5, 'Shift_L'],
            ['z', 'Z', 1],
            ['x', 'X', 1],
            ['c', 'C', 1],
            ['v', 'V', 1],
            ['b', 'B', 1],
            ['n', 'N', 1],
            ['m', 'M', 1],
            [',', '<', 1],
            ['.', '>', 1],
            ['/', '?', 1],
            ['Shift', 2.5, 'Shift_R'],
        ],
        [
            ['Ctrl', 1.2, 'Ctrl_L'],
            ['', 1.2],  // empty name: ignored for mappings
            ['Alt', 1.2, 'Alt_L'],
            ['Space', 6.6],
            ['Alt', 1.2, 'Alt_R'],
            ['', 1.2],
            ['', 1.2],
            ['Ctrl', 1.2, 'Ctrl_R'],
        ],
    ],
    leftHandKeys: [  // the canonical names of the keys one would press with the left hand
        '`', '1', '2', '3', '4', '5', '6',
        'Tab', 'q', 'w', 'e', 'r', 't',
        'Caps', 'a', 's', 'd', 'f', 'g',
        'Shift_L', 'z', 'x', 'c', 'v', 'b',
        'Ctrl_L', 'Alt_L',
    ],
    rightHandKeys: [ // ...and the right hand
        '7', '8', '9', '0', '-', '=', 'Backspace',
        'y', 'u', 'i', 'o', 'p', '[', ']', '\\',
        'h', 'j', 'k', 'l', ';', "'", 'Enter',
        'n', 'm', ',', '.', '/', 'Shift_R',
        'Alt_R', 'Ctrl_R',
    ],
};

/* processKeyboardDef() {{{1

processKeyboardDef() reads a keyboard definition and returns an object with
these properties:

  canonicalNameMap:

    a Map from each key's canonical name to an object of this form:
       {
           plain: [string of the key's plain name],
           shifted: [string of the key's shifted name],
           hand: 'l', 'r', or ' ' indicating if the key should be pressed with
                 the left, right, or either hand.
           id: [string ID of the element in the generated HTML]
       }

  plainNameMap:

    a Map from each key's plain name to its canonical name

  shiftedNameMap:

    a Map from each key's shifted name to its canonical name. A key is included
    only if its shifted name is different from its plain name.

  keyboardHTML:

    HTML implementing the keyboard layout

*/

function processKeyboardDef(def) {
    const leftkeys = new Set(def.leftHandKeys);
    const rightkeys = new Set(def.rightHandKeys);

    function sizeCSS(size) {
        return `flex: ${size} 0px`;
    }

    // Returns [canonical name, plain name, shifted name, size]
    function readKey(keydef) {
        let cname, pname, sname, size;
        if (keydef.length == 2) {
            cname = pname = sname = keydef[0];
            size = keydef[1];
        } else if (typeof keydef[2] == 'number') {
            cname = pname = keydef[0];
            sname = keydef[1];
            size = keydef[2];
        } else {
            cname = keydef[2];
            pname = sname = keydef[0];
            size = keydef[1];
        }
        return [cname, pname, sname, size];
    }

    let idCntr = 0;
    const genId = () => `key-${String(++idCntr).padStart(3, '0')}`;

    const canonicalNameMap = new Map();
    const plainNameMap = new Map();
    const shiftedNameMap = new Map();
    const htmlParts = [];

    htmlParts.push("<div class='keyboard'>");
    for (const row of def.layout) {
        htmlParts.push("<div class='keyboard-row'>");
        for (const key of row) {
            const [cname, pname, sname, size] = readKey(key);
            if (!cname) {  // a blank key
                htmlParts.push(`<div class='key' style='${sizeCSS(size)};'></div>`);
            } else {
                const keyId = genId();
                const hand = leftkeys.has(cname) ? 'l' :
                             rightkeys.has(cname) ? 'r' :
                             ' ';
                canonicalNameMap.set(cname, {
                    plain: pname,
                    shifted: sname,
                    hand: hand,
                    id: keyId
                });
                plainNameMap.set(pname, cname);
                if (pname != sname)
                    shiftedNameMap.set(sname, cname);

                htmlParts.push(`<div id='${keyId}' class='key' style='${sizeCSS(size)};'>`);
                if (pname.toUpperCase() == sname.toUpperCase()) {  // one of the letter keys or a single-name key
                    let extraClasses = '';
                    if (pname == 'Backspace')
                        extraClasses += ' small-label';
                    htmlParts.push(`<span class='key-label single${extraClasses}'>${sname}</span>`);
                } else {
                    htmlParts.push(`<span class='key-label shifted'>${sname}</span>`);
                    htmlParts.push(`<span class='key-label plain'>${pname}</span>`);
                }
                htmlParts.push("</div>");
            }
        }
        htmlParts.push("</div>");
    }
    htmlParts.push("</div>");

    // Some whitespace keys get special treatment
    [[' ', 'Space'], ['\n', 'Enter'], ['\t', 'Tab'], ['\b', 'Backspace']]
        .forEach(([c,v]) => { plainNameMap.set(c, v); });

    return {
        canonicalNameMap,
        plainNameMap,
        shiftedNameMap,
        keyboardHTML: htmlParts.join('\n')
    };
}

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

// }}}
// keyboard maps and getKeyboardData() {{{1

// Maps the name of a layout to its definition
const keyboardDefMap = new Map();

// Maps the name of a layout to its data object (lazily populated):
//  { canonicalNameMap, plainNameMap, shiftedNameMap, templateEl }
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
        const { canonicalNameMap, plainNameMap, shiftedNameMap, keyboardHTML } =
            processKeyboardDef(keyboardDefMap.get(layoutName));
        const templateEl = document.createElement('template');
        templateEl.innerHTML = COMPONENT_CSS + keyboardHTML;
        keyboardData = { canonicalNameMap, plainNameMap, shiftedNameMap, templateEl };
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
        const cname = this.shiftedNameMap.get(char);
        if (cname) {
            const hand = this.canonicalNameMap.get(cname).hand;
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
