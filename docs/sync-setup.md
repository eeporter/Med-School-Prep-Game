# The game's address, sign-in and sync

The game lives at **https://medschool-sync.web.app** (free Firebase Hosting, in the `medschool-sync` Google Firebase project). Progress is saved in the browser on each device. **Signing in with Google** keeps every device in step: each signed-in account has one private copy of its progress in Cloud Firestore, and only the Google accounts named in the rules below can read or write theirs.

**Backup files** still work with no sign-in: on the home screen, under **Sync and backup**, tap **Save a backup file**, and on another device tap **Restore from a backup file**. Restoring adds the backup to that device's progress, so nothing is lost.

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
2. In a copy of the repository: `npx firebase-tools init hosting:github`, choose the repository `eeporter/Med-School-Prep-Game`. It asks GitHub for permission (Emily clicks **Authorize**), creates a deploy key and saves it as the secret above. Do not commit the workflow files it offers to write; `deploy.yml` already does that job.
3. Run the **Deploy to Firebase Hosting** workflow once from the repository's **Actions** tab (or merge any pull request), then open https://medschool-sync.web.app and check that **Sync and backup** shows **Sign in with Google**.

`firebase.json` publishes only the game itself (`index.html`, `styles.css`, `src/`, `data/`). The docs, study guides, tests and scripts are not put on the website.

## Moving from the old address

The game used to be at `https://eeporter.github.io/Med-School-Prep-Game/`, and each device's progress was saved under that address. When `MOVED_TO` in `src/sync-config.js` is set to the new address, opening the old address carries that device's progress across by itself: it saves a one-time copy under a random code, opens the new address, and the new address merges it in and blanks the copy. Open the old address once on every device that has progress **before** the repository is made private (a private repository on a free GitHub account turns the old address off). If a device misses that, use **Save a backup file** there and **Restore from a backup file** at the new address.

## Using sync (Elissa)

On each device, open https://medschool-sync.web.app, scroll to **Sync and backup**, tap **Sign in with Google**, and pick the same Google account every time. After that it is automatic: the game syncs when it opens, when she comes back to it, and a few seconds after she answers questions. **Sync now** forces it. Progress from every device is merged, so nothing is lost if she studied on two devices before they synced:

- each question keeps its most recent review;
- every answer is kept once in her history;
- XP earned on each device is added up (never counted twice);
- the streak follows the most recent study day;
- exams and question reports are combined, and anything removed or cleared on one device stays removed everywhere.

**Sign out** stops syncing on that device; the progress already there stays.

## Limits

Everything here is on Firebase's free plan. Firestore allows 50,000 reads and 20,000 writes a day, and each sync uses one of each. Hosting allows 10 GB of downloads a month; the game is about 4 MB, so even daily use on several devices stays far below that. If the sync service cannot be reached, the game keeps working and saving on the device and syncs the next time it can.
