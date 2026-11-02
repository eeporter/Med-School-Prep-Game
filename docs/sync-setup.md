# Turning on sync between devices

The game has no server. Progress (which questions are due, what was missed, XP, streak, exam dates and question reports) is saved in the browser on each device. **Backup files** work with no setup: on the home screen, under **Sync and backup**, tap **Save a backup file**, and on another device tap **Restore from a backup file**. Restoring adds the backup to that device's progress, so nothing is lost.

**Sync** keeps devices in step automatically. It needs a free place on the internet to keep one shared copy. The game uses Google Firebase (Cloud Firestore) on its free plan. Setting it up is a one-time job in a web browser, about 10 minutes, with no Terminal.

## One-time setup (the project owner does this once)

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. Click **Create a project**. Name it something like `med-prep-sync`. You can turn Google Analytics off. Click **Create project**, then **Continue**.
3. In the left menu, open **Build** > **Firestore Database** and click **Create database**.
   - If asked for an edition, pick **Standard**.
   - Pick a location near you (for example `nam5 (United States)`). This cannot be changed later.
   - Pick **Start in production mode**, then **Create**.
4. Open the **Rules** tab, delete everything in the box, paste the rules below, and click **Publish**.
5. Click the gear icon next to **Project Overview** > **Project settings**. Copy the **Project ID** and send it to Claude. Claude puts it in `src/sync-config.js` and opens a pull request; once it is merged, the Sync controls appear in the game.

You do not need a credit card, Firebase Hosting, sign-in methods, or any app installed.

### Rules to paste

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // One document per sync code. A code is 20 random characters, too many to
    // guess, so the code itself is the key. Nobody can list the codes.
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

## Using sync (Elissa)

1. On the device she uses most, open the game, scroll to **Sync and backup**, and tap **Turn on sync**. A sync code like `ABCDE-12345-FGHJK-67890` appears.
2. On each other device, open the game, type that code under **Already have a sync code**, and tap **Use this code**.

After that it is automatic: the game syncs when it opens, when she comes back to it, and a few seconds after she answers questions. **Sync now** forces it. Progress from every device is merged, so nothing is lost if she studied on two devices before they synced:

- each question keeps its most recent review;
- every answer is kept once in her history;
- XP earned on each device is added up (never counted twice);
- the streak follows the most recent study day;
- exams and question reports are combined, and anything removed or cleared on one device stays removed everywhere.

Keep the code private: anyone with it can see and change that progress. If it leaks, tap **Stop syncing on this device** on every device, then **Turn on sync** again for a new code.

## Limits

The free plan allows 50,000 reads and 20,000 writes a day; each sync uses one of each, far below that. If the sync service cannot be reached, the game keeps working and saving on the device and syncs the next time it can.
