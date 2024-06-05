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

Also, this app is free, runs no ads, and doesn't store cookies on your device.
It's just something I made for my own kid that I thought might be useful.

In the below screenshot, you see how the app shows which keys need to be pressed
next, taking into account the left and right shift keys, to continue typing the
active text section.

<img alt="App screenshot" src="https://github.com/jessepav/guided-typing/blob/master/doc/guided-typing-screenshot.png" width="600">

#### Why not show which finger presses each key?

I found that small kids have a number of issues using the "correct" (according
to standard keyboarding pedagogy) fingers for each key: their hands are small
and they cannot type all the letters without moving their hands anyway. For my
child, it took the fun out of typing, and more than anything I wanted her to
enjoy writing on a computer and develop a mental map of where the keys are.

And it's a personal preference for me too: I'm a moderate typist (~110 WPM), and
I found in trying to push my speed higher that I needed to deviate from standard
finger placement to adapt to the surrounding context of the words I type.

Incidentally, typing legend Sean Wrona has his own unorthodox finger usage
scheme:

* https://seanwrona.com/typing.php
* https://www.reddit.com/r/typing/comments/13833mr/question_about_sean_wronas_finger_placing/

## Entering Your Own Text

"Stories" are entered using a simple subset of Markdown (very similar to plain
text), completely described in the app itself.  The first time the app is
loaded, it will provide instructions for entering your own text.

#### Hosting your own documents (technical users)

You can add a `story=URL` search parameter when you load the page, and the
story will be populated from that URL. Ex:

```
https://guidedtyping.com/?story=https://mydomain.com/docs/story.md
```

If you add a `replace` search parameter, at page load the browser URL will be
rewritten to remove all search parameters. Ex.
`?story=https://mydomain.com/docs/story.md&replace`.

This is useful if you want to send someone a document, but don't want to have
them *always* load the document if they bookmark your link.

## Keyboard Layouts

The app supports changing keyboard layouts at runtime, though currently I only
have a definition written for `US_QWERTY`.

The `DisplayKeyboard` web component in
[`js/display-keyboard.mjs`](https://github.com/jessepav/guided-typing/blob/master/js/display-keyboard.mjs)
already has the infrastructure in place to (relatively) easily add new layouts
for Latin-script keyboards, and I'm happy to merge PRs. Take a look at the
`US_QWERTY_DEF` layout for a sample and documentation.
