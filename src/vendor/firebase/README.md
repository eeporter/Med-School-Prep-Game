# Firebase JavaScript SDK (vendored)

`firebase-app.js` and `firebase-auth.js` are the browser builds from the
`firebase` npm package, version 11.10.0. The only changes: `firebase-auth.js`
imports `./firebase-app.js` instead of the same file on www.gstatic.com, and
the source-map comment at the end of each file is removed. (`firebase-app.js`
still mentions its gstatic address in two text strings; nothing loads it.) Kept here so the game loads only its
own scripts (plus Google's sign-in helper) and needs no build step.

License: Apache License 2.0, Copyright Google LLC.
https://www.apache.org/licenses/LICENSE-2.0
