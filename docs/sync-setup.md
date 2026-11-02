# The game's address, sign-in and sync

The game lives at **https://medschool-sync.web.app** (free Firebase Hosting, in the `medschool-sync` Google Firebase project). Progress is saved in the browser on each device. **Signing in with Google** keeps every device in step: each signed-in account has one private copy of its progress in Cloud Firestore, and only the Google accounts named in the rules below can read or write theirs.

## One-time setup in the Firebase console (Emily, about 5 minutes, no Terminal)

Open <https://console.firebase.google.com> and click the **medschool-sync** project.

1. **Turn on Google sign-in.** In the left menu, open **Build** > **Authentication**, click **Get started** if it shows, then the **Sign-in method** tab. Click **Google**, switch **Enable** on, pick your email as the **support email**, and click **Save**.
2. **Register the game as a web app.** Click the gear icon next to **Project Overview** > **Project settings**. Under **Your apps**, click the web icon (`</>`). Type the nickname `Med School Prep Game`, tick **Also set up Firebase Hosting for this app**, and click **Register app**. Click **Next** and **Continue to console** on the remaining screens (Claude does those steps).
3. **Lock it to your two accounts.** Open **Build** > **Firestore Database** > **Rules**, delete everything in the box, paste the rules below with your two Gmail addresses typed in (lowercase), and click **Publish**.

### Rules to paste

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only these Google accounts can sync. Type them in lowercase.
    function allowed() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email in ['FIRST@gmail.com', 'SECOND@gmail.com'];
    }

    // One progress document per signed-in account, for that account only.
    match /users/{uid} {
      allow get: if allowed() && request.auth.uid == uid;
      allow create, update: if allowed() && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['data'])
        && request.resource.data.data is string
        && request.resource.data.data.size() < 900000;
      allow list, delete: if false;
    }

    // One-time hand-over copies from the old address (a 20-character random
    // code each, too many to guess; nobody can list them).
    match /progress/{code} {
      allow get: if code.size() == 20;
      allow create, update: if code.size() == 20
        && request.resource.data.keys().hasOnly(['data'])
        && request.resource.data.data is string
        && request.resource.data.data.size() < 900000;
      allow list, delete: if false;
    }
  }
}
```

To let another Google account sync later, add its address to the list and click **Publish** again.

## Publishing the site (Claude does this once, from Emily's Mac)

The workflow `.github/workflows/deploy.yml` publishes the game to Firebase Hosting after every merge to `main`, once the question bank and tests pass. It needs one GitHub secret, `FIREBASE_SERVICE_ACCOUNT_MEDSCHOOL_SYNC`, and does nothing until that exists.

1. `npx firebase-tools login` (Emily clicks **Allow** in the browser that opens).
2. In a copy of the repository: `npx firebase-tools init hosting:github`, choose the repository `eeporter/Med-School-Prep-Game`. It asks GitHub for permission (Emily clicks **Authorize**), creates a deploy key and saves it as the secret above. Answer **No** if it asks to overwrite `firebase.json`, and do not commit the workflow files it offers to write; `deploy.yml` already does that job.
3. Let Google accept sign-ins that return to the game's own address. In the Google Cloud console for `medschool-sync`, open **APIs & Services** > **Credentials**, click the OAuth client named **Web client (auto created by Google Service)**, and under **Authorized redirect URIs** add `https://medschool-sync.web.app/__/auth/handler`, then **Save**. (The game runs sign-in from its own address so Safari's cookie blocking cannot break it; without this entry Google shows "Error 400: redirect_uri_mismatch".)
4. Run the **Deploy to Firebase Hosting** workflow once from the repository's **Actions** tab (or merge any pull request), then open https://medschool-sync.web.app and check that it opens on the Welcome screen with **Sign in with Google**.

`firebase.json` publishes only the game itself (`index.html`, `styles.css`, `src/`, `data/`). The docs, study guides, tests and scripts are not put on the website.

## Moving from the old address

The game used to be at `https://eeporter.github.io/Med-School-Prep-Game/`, and each device's progress was saved under that address. When `MOVED_TO` in `src/sync-config.js` is set to the new address, opening the old address carries that device's progress across by itself: it saves a one-time copy under a random code, opens the new address, and the new address merges it in and blanks the copy. Open the old address once on every device that has progress **before** the repository is made private (a private repository on a free GitHub account turns the old address off). This only works while the old address is still up, that is, before the repository is made private.

**After the move (closing step).** Once every device has moved and the repository is private, the hand-over copies are no longer needed. In the Firestore rules, replace the whole `match /progress/{code} { ... }` block with:

```
    match /progress/{code} {
      allow read, write: if false;
    }
```

and click **Publish**. Then, in **Firestore Database** > **Data**, open the `progress` collection and delete it (the three-dot menu > **Delete collection**). It holds only old sync-code copies and blanked hand-overs.

## Using sync (Elissa)

The game's own address opens on a Welcome screen with **Sign in with Google**; nothing else shows until she signs in. On each device she taps it once and picks the same Google account every time. After that the game opens straight to the home screen, and syncing is automatic, with no button: it syncs when the game opens, when she comes back to it, when she leaves it (switches app, locks the phone or closes the tab), and 3 seconds after she answers. An answer given while a sync is on its way is merged into the next one, never overwritten. Progress from every device is merged, so nothing is lost if she studied on two devices before they synced:

- each question keeps its most recent review;
- every answer is kept once in her history;
- XP earned on each device is added up (never counted twice);
- the streak follows the most recent study day;
- exams and question reports are combined, and anything removed or cleared on one device stays removed everywhere.

**Sign out** stops syncing on that device and goes back to the Welcome screen; the progress already there stays.

A Google account that is not in the rules is signed straight out again, with the message "... is not one of the accounts set up for this game." If Google cannot be reached (no internet, or Google's sign-in helper is blocked), the Welcome screen offers **Study without signing in**: answers are saved on the device and sync once she taps **Sign in with Google** at the top of the screen. A device that signed in before keeps working offline and syncs when it is back online.

## Limits

Everything here is on Firebase's free plan. Firestore allows 50,000 reads and 20,000 writes a day, and each sync uses one of each. Hosting allows 360 MB of downloads a day. The game is about 4 MB the first time a device opens it, and after that the browser only checks for changes, so daily use on a few devices stays well below that. If the sync service cannot be reached, the game keeps working and saving on the device and syncs the next time it can.
