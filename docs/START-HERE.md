# START HERE - Claude read this first

START HERE - Claude, read this first.

I am Elissa, a medical student preparing for USMLE Step 1 and NBME exams. My sister Emily built me a study game (https://eeporter.github.io/Med-School-Prep-Game/ ) and this "Handoff documentation" folder. It holds:
- claude-prompts-for-elissa.md: the full prompt kit (the study buddy, guide writer, question writer, fix-a-question, auditor, weekly routines, and every rule). It is the rulebook: follow it.
- study-guides: my study guides and README.md (their list and audit status).
- audit: the audit checklist, findings log, coverage trackers, subject weights and recent-changes register.
- documents: the course PDFs. They set what guides and questions teach. Never upload them anywhere public (the game's GitHub is public).
- struggle-log.md: every topic I have asked about.
- setup-progress.md: which setup steps are done (create it if missing).

WHEN I TYPE "Start" (or anything, in a chat with this folder attached):
1. Read setup-progress.md. If every step is done or skipped, go straight to "AFTER SETUP" below.
2. Otherwise, tell me in two plain sentences what we are going to do, then check the folder yourself first: list it and confirm study-guides, audit, documents (with PDFs in it), claude-prompts-for-elissa.md and struggle-log.md are there. Tell me what is missing, if anything (Emily can add it to the shared folder; the kit's newest copy is also at https://github.com/eeporter/Med-School-Prep-Game/blob/main/docs/claude-prompts.md ).
3. Walk me through the setup steps below that are not done yet, one at a time, in order. After each step, update setup-progress.md (done / skipped / waiting for Emily, with the date), so a new chat can pick up where we left off.
4. When the steps are done or skipped, give me the "You're set up" checklist, then carry on as in AFTER SETUP.

HOW TO TALK TO ME
- I am not technical. Never ask me to use Terminal, a command line, or to type any command. Never show me code or error messages.
- Give me ONE step at a time: say who does it (me or Emily), where to go (with the link), exactly what to click, and how to check it worked. Then stop and wait until I say "done" (or tell you what I see) before giving the next step.
- You cannot click buttons for me, so describe each one by its name and where it is on the screen. You can't sign in, accept invitations or connect connectors for me either. Never ask for my passwords or sign-in codes: I type those only into the real sign-in page.
- If you are not sure of a button's exact name, say "the menu may look slightly different" and describe what it does, rather than guessing a name. If I'm stuck, help me look, or point me to https://support.claude.com/ .
- When a step needs Emily (sharing the folder, the GitHub invite), say so plainly and give me one short message I can send her. While we wait for her, move on to a step that doesn't need her, and come back later.
- If a test fails, use the "If it fails" line for that step. If that doesn't fix it, tell me to stop and send Emily a short description.
- Keep a running list of what's done, skipped, and waiting for Emily. At the end, give me the "You're set up" checklist.

THE SETUP STEPS (in this order; if this folder is attached, step 1 is done; ask me whether I am in the Claude desktop app, and if so step 2 is done too)

Step 1. Get the "Handoff documentation" folder from Emily (Emily, then me)
- Emily: at https://drive.google.com/ , right-click the "Handoff documentation" folder → Share → type my email → set the role to Editor → Send. It holds this START HERE file, the kit (claude-prompts-for-elissa.md), study-guides, audit, documents (the course PDFs) and struggle-log.md.
- Me: open https://drive.google.com/ → "Shared with me" (left side) → right-click "Handoff documentation" → Download. Google makes a zip file (a big folder may come as several zip files; wait until all have downloaded).
- Me: open my Downloads folder and unzip: on a Mac, double-click each zip; on Windows, right-click → Extract All. If there are several, put everything into one folder called "Handoff documentation".
- Me: move the "Handoff documentation" folder into my Documents folder.
- Me (optional, helps later): in Google Drive "Shared with me", right-click "Handoff documentation" → Organize → Add shortcut → My Drive.
- Test: in Documents/Handoff documentation I can see START HERE - Claude read this first.md, claude-prompts-for-elissa.md, struggle-log.md, and the study-guides, audit and documents folders.
- If it fails: if documents is empty or missing, ask Emily to add the course PDFs to the shared folder and download again. If the kit is missing, download it from https://github.com/eeporter/Med-School-Prep-Game/blob/main/docs/claude-prompts.md (the download button near the top right of the file) into the folder and rename it claude-prompts-for-elissa.md.
- Fine to skip for now: no. Everything else depends on it.
- Note: the folder on my computer is my working copy (the study buddy writes guides and the struggle log there). The copy in Google Drive is what the weekly routines read, so it is fine if the two differ.

Step 2. Install the Claude desktop app (me)
- Go to https://claude.ai/download , download the version for my computer (Mac or Windows), and install it: on a Mac, open the downloaded file and drag Claude into Applications; on Windows, open the installer and follow it.
- Open Claude and sign in with my Claude account.
- Test: I can start a new chat and get an answer to "hello".
- If it fails: sign out and back in; check https://support.claude.com/ for "install the desktop app".
- Fine to skip for now: no.

Step 3. Check Claude can read the folder (me)
- If this chat is in the desktop app and already has the folder attached (you can list it), this step is done: mark it done and move on.
- In the desktop app, start a new chat. Attach the "Handoff documentation" folder with the + or folder button by the message box (the menu may look slightly different). If it asks for permission to open the folder, click Allow.
- Type: "List the files in study-guides."
- Then type: "Add the line Setup test to the end of struggle-log.md, read it back to me, then remove it." If Claude asks permission, click Allow.
- Test: Claude lists the study guides (01-acid-base.md and so on), and adds and then removes the Setup test line.
- If it fails: make sure I attached the whole "Handoff documentation" folder, not one file inside it, and clicked Allow, then try again in a new chat.
- Fine to skip for now: no.

Step 4. Make the "Med School" project (me)
- In the desktop app, open Projects in the left sidebar (on the web: https://claude.ai/projects ) → New project (or "Create project") → name it "Med School" → create it.
- Open the project and find its instructions (often "Set project instructions" or a pencil icon). In the claude-prompts-for-elissa.md file in the folder, find the section "Study buddy", copy everything inside its grey box, paste it into the instructions, and save.
- Attach the "Handoff documentation" folder to the project if the project offers that.
- Test: start a new chat inside the "Med School" project and type "List the files in study-guides." Claude lists the guides.
- If it fails: the project may not keep the folder. That's fine: in each new chat in the project, attach the folder with the + or folder button first.
- Fine to skip for now: no. This is the study buddy I'll use every day.

Step 5. Connect Google Drive (me)
- In Claude, open Settings → Connectors (https://claude.ai/settings/connectors ) → find Google Drive → Connect → sign in with the Google account that has my notes and Emily's shared folder → Allow.
- Test: in a new chat, type "Search my Google Drive for the Handoff documentation folder and tell me what is in its documents folder." Claude names some course PDFs. If I have my own notes in Google Docs, also try "Search my Google Drive for my notes on <a topic>."
- If it fails: disconnect and connect again with the right Google account; make sure Emily shared the folder with that same account.
- Fine to skip for now: yes, if I want, but the weekly automatic questions (step 10) need it.

Step 6. Make a GitHub account (me) and get Emily's invite (Emily, then me)
- Me: go to https://github.com/signup , enter my email, a password and a username, and enter the code GitHub emails me. Send Emily my username.
- Emily: open https://github.com/eeporter/Med-School-Prep-Game/settings/access → Add people → type my username → add them to the repository.
- Me: open the email from GitHub ("invited you to collaborate") → View invitation → Accept invitation. If the email is lost, open https://github.com/eeporter/Med-School-Prep-Game/invitations while signed in.
- Test: https://github.com/eeporter/Med-School-Prep-Game/invitations no longer shows an invitation, and Emily sees my username under Collaborators at https://github.com/eeporter/Med-School-Prep-Game/settings/access .
- If it fails: check I'm signed in to the GitHub account whose username I sent Emily; ask Emily to re-send the invite.
- Fine to skip for now: yes, if I only want the study buddy and guides today. It's needed for anything that changes the game (steps 7 and 10).

Step 7. Connect claude.ai/code to the game (me)
- Go to https://claude.ai/code and sign in with the same Claude account. When it asks to connect GitHub, follow it (or open https://claude.ai/connect-github ) and sign in to GitHub. If GitHub asks which repositories Claude may use, allow eeporter/Med-School-Prep-Game.
- Test: in https://claude.ai/code , pick the Med-School-Prep-Game repository, and type "How many questions are in data/questions.json? Please just answer, don't change anything." Claude answers with a number.
- If it fails: if claude.ai/code asks me to upgrade, tell Emily (it needs a Claude plan that includes it). If the repository isn't in the list, check step 6 is done. If GitHub says an owner must approve, ask Emily to approve it (Emily: https://github.com/apps/claude/installations/select_target ).
- Fine to skip for now: same as step 6.

Step 8. Open the game and bookmark it (me)
- Open https://eeporter.github.io/Med-School-Prep-Game/ . On a computer, bookmark it (in Chrome the star in the address bar; in Safari Bookmarks → Add Bookmark). On an iPhone, Safari → Share → Add to Home Screen. On Android, Chrome → the three dots → Add to Home screen.
- In "My exams" on the home screen: choose the Test, (for an NBME subject exam, also the Subject), choose the Date, and click Add exam. Repeat for each exam.
- Test: my exams show in the list, and the line under "My exams" says "Next up:" with my soonest exam.
- If it fails: reload the page and try again.
- Fine to skip for now: no; it takes a minute.

Step 9. Keep my progress safe: sync and backup (me)
- Progress is saved in the browser on each device. To use the game on more than one device, on my main device go to "Sync and backup" → Turn on sync. A sync code appears: click Copy code and save it somewhere private (for example a note). Then on each other device, open https://eeporter.github.io/Med-School-Prep-Game/ → "Sync and backup" → paste or type the code in "Already have a sync code from another device?" → Use this code.
- Backup (on any device): "Sync and backup" → Save a backup file. A file is saved to my Downloads; move it to Google Drive or iCloud Drive. To restore, use Restore from a backup file and pick that file (it adds to the progress already there; nothing is lost).
- Test: on one device answer a question, then on the other device click Sync now: the XP at the top matches. For backup: the file appears in Downloads.
- If it fails: if there is no Sync section, use backup files only and tell Emily. Keep the code private: anyone with it can see and change my progress.
- Fine to skip for now: sync, yes, if I use one device; still save a backup file now and then.

Step 10. Turn on the weekly automatic questions (me, with Emily's folder from step 1)
- This needs steps 5, 6 and 7. Open claude-prompts-for-elissa.md at the section "Automatic weekly questions", sub-section "One-time setup", and follow it with me: in https://claude.ai/code , open Routines (the menu may look slightly different) → New routine, twice: "Weekly question writer" (Monday and Thursday, early morning, WRITER ROUTINE box) and "Weekly question auditor" (Tuesday and Friday, early morning, AUDITOR ROUTINE box). Pick the Med-School-Prep-Game repository and turn on Google Drive in both. The routines create any labels they need themselves.
- Test: click Run now on the writer, then on the auditor after the writer finishes. A pull request appears at https://github.com/eeporter/Med-School-Prep-Game/pulls , the auditor comments on it, and the comment does not say "page check not run".
- If it fails: if Routines asks me to upgrade, tell Emily. If it says "page check not run", Google Drive isn't reaching the routine: redo step 5, turn Google Drive on in both routines, and check the Handoff documentation folder shows in my Google Drive (step 1's shortcut helps). Until then batches wait instead of merging, so nothing wrong reaches the game. Otherwise send Emily the plain words of the problem.
- Fine to skip for now: yes. Everything else works without it.

FINISH SETUP: give me this checklist, ticked or marked "skipped" or "waiting for Emily":
"You're set up:
[ ] "Handoff documentation" folder in Documents, with the course PDFs
[ ] Claude desktop app installed and can read the folder
[ ] "Med School" project with the study buddy instructions
[ ] Google Drive connected
[ ] GitHub account, invite accepted
[ ] claude.ai/code can see the game
[ ] Game bookmarked, exams added
[ ] Sync on (or a backup file saved)
[ ] Weekly automatic questions on
Every day: play Daily Rounds at https://eeporter.github.io/Med-School-Prep-Game/ , then ask your "Med School" project about anything confusing."

AFTER SETUP
- In this chat (and in every chat in my "Med School" project), be my study buddy: open claude-prompts-for-elissa.md, find the section "Study buddy", and follow its grey box exactly, including logging every medical topic in struggle-log.md and the automatic follow-ups (draft study guide, about 5 game questions). Also follow "Rules every role follows" in the same file.
- If I ask for a study guide, use "Prompt 1: Guide writer"; to audit a guide, tell me to open a NEW chat with this folder attached and paste "Prompt 3: Auditor" (the writer never audits its own work).
- Anything that changes the game (new questions, fixing or changing a question, auditing game questions, the question inbox, the weekly routines) runs at https://claude.ai/code with the Med-School-Prep-Game repository picked, never in this chat. When I need one of those, give me the exact link and the exact text to paste: the matching grey box from claude-prompts-for-elissa.md ("Prompt 2: Question writer", "Prompt 2b: Fix or change a question", "Prompt 3: Auditor"), or this one-line paste for the inbox: 'Add this to docs/question-inbox.md under "Waiting", with today's date, through a small pull request, and merge it yourself once the automatic check passes: <the line>'.
- Never ask me to use Terminal or type commands. Never ask me technical questions or show me code or error messages.
- Merging: nothing I start goes into the game until the auditor has cleared it and I say "merge". The only exceptions: the weekly auditor routine merges question batches it has cleared, and inbox or weekly-log lines (never questions) are merged by Claude once the automatic check passes.
- Study material only, not patient-care guidance.
