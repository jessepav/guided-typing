import { DisplayKeyboard, addKeyboardDef, getLayoutNames } from './display-keyboard.mjs';

const HELP_URL = "doc/formatting-help.md";
const INITIAL_STORY_URL = "samples/initial-sample.md";
const STORY_STORAGE_KEY = "guided-typing-story";
const CONFIG_STORAGE_KEY = "guided-typing-config";
const DEFAULT_MDTEXT = `
# First Time Instructions

<p style="font-size: 95%;">
Click on the document icon<img alt="document" src="img/document-icon.png"
                               style="width: 20px; vertical-align: -0.2em; margin-left: 0.5ch;">
at the top right of the page to edit your story,
or click on this text to see how typing works.
</p>

---

You can also load a [sample kids' story](?story=samples/stories.md&replace)
to play around with that.
`;

const siteBaseUrl = location.origin + location.pathname;

const documentHolder = document.getElementById('document-holder');
const settingsHolder = document.getElementById('settings-holder');
const docIcon = document.getElementById('doc-icon');
const keyboardIcon = document.getElementById('keyboard-icon');
const settingsStoryTextarea = document.getElementById('settings-story-textarea');
const settingsTextHelp = document.getElementById('settings-text-help');
const settingsButtonHolder = document.getElementById('settings-button-holder');
const settingsSaveButton = settingsHolder.querySelector("[data-command='save']");
const settingsCancelButton = settingsHolder.querySelector("[data-command='cancel']");
const layoutDialog = document.getElementById('keyboard-layout-dialog');
const layoutSelect = document.getElementById('layout-select');
const layoutButtonHolder = document.getElementById('layout-button-holder');
const wpmCheck = document.getElementById('wpm-check');

const mdit = window.markdownit({
    html: true,
    typographer: false,
});

let keyboard;  // our single instance of DisplayKeyboard

let showWPM;

let siteNameEl;
let displayedText;

function showDocumentText(mdText) {
    if (!siteNameEl) {
        const siteName = siteBaseUrl.replace("https://", "").replace(/\/(?:index\.html)?$/, "");
        siteNameEl = document.createElement('div');
        siteNameEl.className = "site-name";
        siteNameEl.innerHTML = `<a href="${siteBaseUrl}">${siteName}</a>`;
    }
    const docDiv = parseMarkdownDoc(mdText);
    documentHolder.replaceChildren(docDiv);
    documentHolder.prepend(siteNameEl);
    displayedText = mdText;
}

function inSettingsScreen() {
    return document.body.classList.contains("settings");
}

async function showSettingsScreen() {
    if (!settingsTextHelp.hasChildNodes()) {
        const response = await fetch(HELP_URL);
        const helpMd = await response.text();
        settingsTextHelp.innerHTML = mdit.render(helpMd);
    }
    const mdText = !displayedText || Object.is(displayedText, DEFAULT_MDTEXT)
                        ? await fetch(INITIAL_STORY_URL).then(response => response.text())
                        : displayedText;
    settingsStoryTextarea.value = mdText;
    document.body.classList.add("settings");
}

function settingsButtonClicked(ev) {
    const command = ev.target.dataset.command;
    if (!command)
        return;
    switch (command) {
      case 'save':
        let mdText = settingsStoryTextarea.value;
        if (mdText)
            localStorage.setItem(STORY_STORAGE_KEY, mdText);
        else
            mdText = DEFAULT_MDTEXT;
        showDocumentText(mdText);
        break;
      case 'cancel':
        break;
    }
    document.body.classList.remove("settings");
}

function showLayoutDialog() {
    if (layoutSelect.childElementCount == 0) {
        const layouts = getLayoutNames();
        layouts.sort();
        for (const layout of layouts) {
            const option = document.createElement('option');
            option.value = layout;
            option.innerText = layout;
            if (layout == keyboard.layoutName)
                option.selected = true;
            layoutSelect.append(option);
        }
    } else {
        for (const option of layoutSelect.children) {
            if (option.value == keyboard.layoutName) {
                option.selected = true;
                break;
            }
        }
    }
    layoutDialog.showModal();
}

function layoutButtonClicked(ev) {
    const command = ev.target.dataset.command;
    if (!command)
        return;
    switch (command) {
      case 'ok':
        const newLayoutName = layoutSelect.selectedOptions[0].value;
        if (newLayoutName != keyboard.layoutName) {
            const newKeyboard = new DisplayKeyboard(newLayoutName);
            if (keyboard.parentElement)
                keyboard.replaceWith(newKeyboard);
            keyboard = newKeyboard;
            saveConfig();
        }
        break;
      case 'cancel':
        break;
    }
    layoutDialog.close();
}

const wpmTimeStartMap = new WeakMap();
const matchLenMap = new WeakMap();  // stores the length of the most recent successful match for each textarea

function processTextInput(textarea, expandedText, successCheck, keyboard, isInsert = true) {
    let t = textarea.value;
    // Trim off whitespace following the cursor position. This prevents invisible
    // whitespace from causing a match failure.
    const trimmedText = t.slice(0, textarea.selectionEnd) + t.slice(textarea.selectionEnd).trimEnd();
    if (t != trimmedText)
        t = textarea.value = trimmedText;

    // isInsert == false would indicate we arrived here via a backspace or delete or such
    if (showWPM && t.length == 1 && isInsert)
        wpmTimeStartMap.set(textarea, Date.now());

    // Perform some ergonic autocorrections on characters typed after a successful match
    const lastSuccessfulMatchLen = matchLenMap.get(textarea) ?? 0;
    if (isInsert && t.length == lastSuccessfulMatchLen + 1) {
        // If the character the user was supposed to type is a newline, and the user typed a
        // space, replace the space with anewline.
        if (t.at(-1) == ' ' && expandedText[t.length - 1] == '\n') {
            t = t.slice(0, t.length - 1) + '\n';
            textarea.value = t;
        } else if (t.at(-1) == '\n' && expandedText.slice(t.length - 1, t.length + 1) == '\n\n') {
            // If the user typed a newline at a break between paragraphs, add an extra newline
            // to move directly to the next paragraph.
            t += '\n';
            textarea.value = t;
        }
    }

    if (!expandedText.startsWith(t)) {
        textarea.style.setProperty("color", "var(--error-color)");
        successCheck.style.removeProperty("display");
        keyboard.highlightKeys(['\b']);
        matchLenMap.delete(textarea);  // you'll need to match again to get autocorrect
    } else {
        matchLenMap.set(textarea, t.length);
        if (t.length == expandedText.length) {
            textarea.style.setProperty("color", "var(--success-color)");
            successCheck.style.display = "block";
            if (showWPM && wpmTimeStartMap.has(textarea)) {
                const elapsedMs = Date.now() - wpmTimeStartMap.get(textarea);
                const wpm = Math.round(((t.length - 1) / 5) / (elapsedMs / 1000) * 60);
                wpmTimeStartMap.delete(textarea);  // you'll need to start from the beginning to get a new WPM
                successCheck.innerText = `(${wpm} wpm)`;
            }
            keyboard.highlightKeys();
        } else {
            textarea.style.removeProperty("color");
            successCheck.style.removeProperty("display");
            const nextChar = String.fromCodePoint(expandedText.codePointAt(t.length));
            const keys = keyboard.keysForChar(nextChar);
            if (keys)  // the keyboard can produce this character
                keyboard.highlightKeys(keys);
            else {
                keyboard.highlightKeys();
                if (isInsert) {  // type it for the user
                    setTimeout(() => {
                        textarea.value = t + nextChar;
                        processTextInput(textarea, expandedText, successCheck, keyboard);
                    }, 250);
                }
            }
        }
    }
}

function parseMarkdownDoc(mdText) {
    // Ensure that we don't need blank lines around a line of -'s
    mdText = mdText.replaceAll(/\n(-{3,})\n/g, `\n\n$1\n\n`);
    const htmlText = mdit.render(mdText);

    const mdDiv = document.createElement('div');
    mdDiv.innerHTML = htmlText;
    const mdElements = Array.from(mdDiv.children);

    const docDiv = document.createElement('div');
    let currentDetails, currentSection;
    for (const el of mdElements) {
        switch (el.tagName) {
          case 'H1':
          case 'H2':
            if (currentDetails)
                docDiv.append(currentDetails);
            currentDetails = document.createElement('details');
            currentDetails.open = el.tagName == 'H1';
            const summaryEl = document.createElement('summary');
            summaryEl.append(...el.childNodes);
            currentDetails.append(summaryEl);
            currentSection = undefined;  // guarantees that the first <p> creates a new section
            break;
          case 'HR':
            currentSection = undefined;
            break;
          case 'P':
            if (!currentDetails) {
                currentDetails = document.createElement('details');
                currentDetails.open = true;
                currentDetails.innerHTML = `<summary>Story</summary>`;
            }
            if (!currentSection) {
                currentSection = document.createElement('section');
                currentSection.dataset.story = 'section';
                currentDetails.append(currentSection);
            }
            currentSection.append(el);
            break;
          default:
            // ignore all other tags
            break;
        }
    }
    if (currentDetails)
        docDiv.append(currentDetails);
    return docDiv;
}

function loadConfig() {
    const jsonConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    const config = jsonConfig ? JSON.parse(jsonConfig) : {};
    return {
        keyboardLayout: config.keyboardLayout ?? 'US_QWERTY',
        showWPM: config.showWPM ?? false,
    };
}

function saveConfig() {
    const config = {
        keyboardLayout: keyboard.layoutName,
        showWPM,
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function checkBrowserFeatures() {
    if (!CSS.supports("(selector(&))")) {
        const warningDiv = document.querySelector(".browser-feature-warning");
        warningDiv.style.removeProperty("display");
        warningDiv.querySelector("span:first-child").addEventListener('click', () => {
            warningDiv.style.display = "none";
        });
    }
}

function sizeTextarea(sectionEl, textarea, keyboard) {
    const ELEMENT_SPACING_HEIGHT = 25,  // height of padding and borders around elements
          TEXTAREA_MIN_HEIGHT = 50;     // empirically, one comfortable line of text
    const viewportHeight = document.documentElement.clientHeight;
    const remainingHeight = viewportHeight - sectionEl.offsetHeight - keyboard.offsetHeight - ELEMENT_SPACING_HEIGHT;
    const textareaHeight = Math.max(TEXTAREA_MIN_HEIGHT, Math.min(sectionEl.offsetHeight, remainingHeight));
    textarea.style.height = `${textareaHeight}px`;
}

async function main() {
    checkBrowserFeatures();

    docIcon.addEventListener('click', showSettingsScreen);
    settingsButtonHolder.addEventListener('click', settingsButtonClicked);

    keyboardIcon.addEventListener('click', showLayoutDialog);
    layoutButtonHolder.addEventListener('click', layoutButtonClicked);

    let mdText;
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("story")) {
        const response = await fetch(searchParams.get("story"));
        mdText = await response.text();
        if (searchParams.has("replace"))
            history.replaceState(null, "", siteBaseUrl);
    } else {
        mdText = localStorage.getItem(STORY_STORAGE_KEY) ?? DEFAULT_MDTEXT;
    }
    showDocumentText(mdText);

    const config = loadConfig();
    keyboard = new DisplayKeyboard(config.keyboardLayout);
    showWPM = config.showWPM;

    wpmCheck.checked = showWPM;
    wpmCheck.addEventListener('change', () => {
        showWPM = wpmCheck.checked;
        saveConfig();
        if (!showWPM)
            document.querySelectorAll(".success-check").forEach(el => { el.innerText = ''; });
    });

    let currentSectionEl;   // the section element that we most recently typed under

    documentHolder.addEventListener('click', ev => {
        if (ev.target.tagName == 'A')  // don't do anything if the user clicked a link
            return;
        const sectionEl = ev.target.closest("[data-story='section']");
        if (!sectionEl)
            return;
        let selected = sectionEl.classList.contains("selected");
        if (selected && sectionEl === currentSectionEl) {
            // don't collapse current section - instead, refocus text area
            currentSectionEl.nextElementSibling.querySelector("textarea").focus();
            return;
        }
        sectionEl.classList.toggle("selected");
        selected = !selected;
        let nextEl = sectionEl.nextElementSibling;
        if (selected) {
            if (!nextEl || !nextEl.classList.contains("input-holder")) {
                const textarea = document.createElement("textarea");
                // Use the first two words of the section text as a placeholder
                const sectionText = sectionEl.innerText;
                let breakIdx = sectionText.indexOf(' ');
                if (breakIdx != -1)
                    breakIdx = sectionText.indexOf(' ', breakIdx + 1);
                textarea.placeholder = breakIdx != -1 ? sectionText.slice(0, breakIdx) + ' ...'
                                                      : sectionText;  // otherwise all of it

                const inputHolder = document.createElement("div");
                inputHolder.className = "input-holder";
                inputHolder.append(textarea);
                inputHolder.append(keyboard);
                const successCheck = document.createElement("span");
                successCheck.className = 'success-check';
                sectionEl.after(inputHolder);    // inputHolder will be the sibling of sectionEl
                sectionEl.append(successCheck);  // successCheck is a child of sectionEl

                const expandedText = keyboard.expandDeadKeys(sectionText);

                // When the textarea is focused, place the keyboard below it and scroll to its section
                textarea.addEventListener('focus', ev => {
                    currentSectionEl = sectionEl;
                    if (textarea.nextElementSibling != keyboard)
                        textarea.after(keyboard);
                    sectionEl.scrollIntoView(true);
                    sizeTextarea(sectionEl, textarea, keyboard);
                    processTextInput(textarea, expandedText, successCheck, keyboard);
                });
                textarea.addEventListener('input', ev => {
                    processTextInput(textarea, expandedText, successCheck, keyboard,
                                     ["insertText", "insertLineBreak"].includes(ev.inputType));
                });

                textarea.focus();
            } else {
                nextEl.style.removeProperty("display");
                nextEl.querySelector("textarea").focus();
            }
        } else {
            if (nextEl.classList.contains("input-holder"))
                nextEl.style.display = "none";
        }
        sectionEl.scrollIntoView(true);
    });
    documentHolder.addEventListener('keydown', ev => {
        if (ev.key == "Escape") {
            const focusedEl = document.activeElement;
            if (focusedEl?.tagName == 'TEXTAREA') {
                ev.preventDefault();
                ev.stopPropagation();
                focusedEl.value = '';
                focusedEl.dispatchEvent(new InputEvent('input', { bubbles: true, data: null }));
            }
        }
    });
    document.body.addEventListener('keydown', ev => {
        const inSettings = inSettingsScreen();
        let eatEvent = true;
        if (inSettings && ev.key == 's' && ev.ctrlKey) {
            settingsSaveButton.click();
        } else if (!inSettings && ev.key == 'd' && ev.ctrlKey) {
            showSettingsScreen();
        } else {
            eatEvent = false;
        }
        if (eatEvent) {
            ev.stopPropagation();
            ev.preventDefault();
        }
    });
    window.addEventListener('resize', () => {
        if (keyboard.parentElement) {
            const textarea = keyboard.previousElementSibling;
            const sectionEl = textarea.parentElement.previousElementSibling;
            sizeTextarea(sectionEl, textarea, keyboard);
        }
    });
}

window.addEventListener('load', main());
