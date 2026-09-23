# Quick Start Guide screenshots

Add PNG captures for [QUICK_START_GUIDE.md](../QUICK_START_GUIDE.md):

| File | Suggested capture |
| --- | --- |
| `01-sign-in.png` | Signed-out landing / Continue with Google |
| `02-calling-number.png` | Onboarding — calling number form |
| `03-contacts-empty.png` | Contacts — no contacts yet |
| `04-contact-added.png` | Contacts — at least one contact in the list |
| `05-calls-home.png` | Calls — Bat Phone utility + call history |
| `06-call-detail.png` | Call detail — metadata and recording |
| `07-transcript.png` | Call detail — transcript section |

All seven PNGs for the quick-start guide are captured and linked from [QUICK_START_GUIDE.md](../QUICK_START_GUIDE.md).

After changing screenshots or guide copy, regenerate the printable PDF:

```bash
npm run docs:quick-start-pdf
```

Source layout: [quick-start-print.html](../quick-start-print.html) (7 pages, app branding).
