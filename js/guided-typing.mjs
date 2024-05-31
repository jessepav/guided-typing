import { DisplayKeyboard, addKeyboardDef, getLayoutNames } from './display-keyboard.mjs';

const HELP_URL = "doc/formatting-help.md";
const INITIAL_STORY_URL = "samples/initial-sample.md";
const STORAGE_KEY = "guided-typing-story";
const DEFAULT_MDTEXT = `
# First Time Instructions

Click on the document icon<img alt="document" src="img/document-icon.png"
                               style="width: 20px; vertical-align: -0.2em; margin-left: 0.5ch;">
at the top right of the page to edit your story, or click on this text to
see how typing works.
`;

let keyboard = new DisplayKeyboard('US_QWERTY');

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

const mdit = window.markdownit({
    html: true,
    typographer: false,
});

let displayedText;

function showDocumentText(mdText) {
    const docDiv = parseMarkdownDoc(mdText);
    documentHolder.replaceChildren(docDiv);
    displayedText = mdText;
}

async function showSettingsScreen() {
    if (!settingsTextHelp.hasChildNodes()) {
        const response = await fetch(HELP_URL);
        const helpMd = await response.text();
        settingsTextHelp.innerHTML = mdit.render(helpMd);
    }
    const noDisplayedText = !displayedText || Object.is(displayedText, DEFAULT_MDTEXT);
    const mdText = noDisplayedText ? await fetch(INITIAL_STORY_URL).then(response => response.text())
                                   : displayedText;
    settingsStoryTextarea.value = mdText;
    settingsCancelButton.disabled = noDisplayedText;
    document.body.classList.add("settings");
}

function settingsButtonClicked(ev) {
    const command = ev.target.dataset.command;
    if (command == 'save') {
        const mdText = settingsStoryTextarea.value;
        if (mdText) {
            localStorage.setItem(STORAGE_KEY, mdText);
            showDocumentText(mdText);
            document.body.classList.remove("settings");
        }
    } else if (command == 'cancel') {
        document.body.classList.remove("settings");
    }
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
        }
        break;
      case 'cancel':
        break;
    }
    layoutDialog.close();
}

function processTextInput(textarea, expandedText, successCheck, keyboard) {
    const t = textarea.value;
    if (!expandedText.startsWith(t)) {
        textarea.style.setProperty("color", "var(--error-color)");
        keyboard.highlightKeys('\b');
    } else {
        if (t.length == expandedText.length) {
            textarea.style.setProperty("color", "var(--success-color)");
            successCheck.style.display = "block";
            keyboard.highlightKeys();
        } else {
            textarea.style.removeProperty("color");
            successCheck.style.removeProperty("display");
            const nextChar = expandedText[t.length];
            keyboard.highlightKeysForChar(nextChar);
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

function main() {
    docIcon.addEventListener('click', showSettingsScreen);
    settingsButtonHolder.addEventListener('click', settingsButtonClicked);
    settingsHolder.addEventListener('keydown', ev => {
        if (ev.key == 's' && ev.ctrlKey) {
            ev.stopPropagation();
            ev.preventDefault();
            settingsSaveButton.click();
        }
    });

    keyboardIcon.addEventListener('click', showLayoutDialog);
    layoutButtonHolder.addEventListener('click', layoutButtonClicked);

    const mdText = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MDTEXT;
    showDocumentText(mdText);

    document.body.addEventListener('click', ev => {
        const sectionEl = ev.target.closest("[data-story='section']");
        if (!sectionEl)
            return;
        sectionEl.classList.toggle("selected");
        const selected = sectionEl.classList.contains("selected");
        let nextEl = sectionEl.nextElementSibling;
        if (selected) {
            if (!nextEl || !nextEl.classList.contains("input-holder")) {
                const textarea = document.createElement("textarea");
                textarea.style.height = `${sectionEl.offsetHeight}px`;
                // Use the first two words of the section text as a placeholder
                const sectionText = sectionEl.innerText;
                let breakIdx = sectionText.indexOf(' ');
                if (breakIdx != -1)
                    breakIdx = sectionText.indexOf(' ', breakIdx + 1);
                if (breakIdx != -1)
                    textarea.placeholder = sectionText.slice(0, breakIdx) + ' ...';

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
                    if (textarea.nextElementSibling != keyboard)
                        textarea.after(keyboard);
                    sectionEl.scrollIntoView(true);
                    processTextInput(textarea, expandedText, successCheck, keyboard);
                });
                textarea.addEventListener('input', ev => {
                    processTextInput(textarea, expandedText, successCheck, keyboard);
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
}

window.addEventListener('load', main());
