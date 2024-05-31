# guided-typing

A web-app to guide new typists through keying in texts with an on-screen
keyboard showing which keys should be pressed next.

https://guidedtyping.com/

**Note**: the app is intended for use on a device that has a physical keyboard.

## Why this app?

As I was attempting to teach my child to type, I found that her greatest
frustration was hunting around the keyboard for each character. Additionally,
most typing apps don't allow you to easily set up your own texts that are
interesting for the student.

In the below screenshot, you see how the app shows which keys need to be pressed
next, taking into account the left and right shift keys, to continue typing the
active text section.

![App screenshot](https://github.com/jessepav/guided-typing/blob/master/doc/guided-typing-screenshot.png)

## Entering Your Own Text

"Stories" are entered using a simple subset of Markdown, completely described in
the app itself. The first time the app is loaded, it will provide instructions
for entering your own text.

Alternately, you can add a `story=URL` search parameter when you load the page,
and the story will be populated from that URL. Ex:

```
https://guidedtyping.com/?story=https://mydomain.com/docs/story.md
```

## Keyboard Layouts

The app supports changing keyboard layouts at runtime, though currently I only
have a definition written for `US_QWERTY`. 

The `DisplayKeyboard` web component in
[`js/display-keyboard.mjs`](https://github.com/jessepav/guided-typing/blob/master/js/display-keyboard.mjs)
already has the infrastructure in place to (relatively) easily add new layouts
for Latin-script keyboards, and I'm happy to merge PRs. Take a look at the
`US_QWERTY_DEF` layout for a sample and documentation.
