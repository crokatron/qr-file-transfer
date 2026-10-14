# QR File Transfer: maintainer handover

[One-screen summary](START-HERE.md) · [User manual](USER-MANUAL.md) · [Feature overview](../README.md) · [Recorded validation](../VALIDATION.md)

## Purpose and behaviour to preserve

Move original files across an optical link by displaying a sequence of QR frames on one screen and reconstructing those frames in a receiving browser. The receiver accepts camera frames, images or a recording. The prepared browser candidate is shared here; the original NAS installation additionally has owner backup functions and native sender packages, which are not included in this candidate.

- **File preservation:** Transfer documents, archives, images and arbitrary binary files; reconstruction verifies the original bytes. (Browser candidate.)
- **Animated sender:** Prepare selected files and display repeated encoded frames; controls support timing and presentation. (Browser candidate.)
- **Receiver inputs:** Read through a camera or supported image/video input. (Browser candidate.)
- **Loss recovery:** Redundant frames allow progress despite missed, reordered or duplicate frames. (Browser candidate.)
- **Resume:** Retain partial progress in browser storage for the same transfer identity. (Browser candidate.)
- **NAS backup:** Owner-only resumable file backup into protected NAS storage. (Original hosted implementation only.)
- **Native senders:** Python and PowerShell alternatives for an already permitted runtime. (Original hosted implementation only.)

The [demo](../demo.html) is a smaller, labelled simulation with fictional data. It explains cause and effect without the real service; it is not evidence of a working production installation. Numbered screenshots in the user manual distinguish actual-app captures from demo captures.

## Files and sources of truth

| Actual package path | Maintainer role |
| --- | --- |
| [projects-host/site/qr-transfer](../projects-host/site/qr-transfer) | Built sender and receiver |
| [projects-host/qr-transfer-dev](../projects-host/qr-transfer-dev) | Protocol, scanner worker, build and tests |
| [reference/README.md](../reference/README.md) | Retained candidate notes |
| [demo-source](../demo-source) | Editable demo HTML/CSS/runtime and embedded screenshot tour |
| [SOURCE-MANIFEST.json](../SOURCE-MANIFEST.json) | Original copied-source paths and SHA-256 checkpoint values |

The original working source is under C:/Users/lamon/Desktop/AI TOOLS/NAS for NAS modules; adjacent CAD/watch source locations are recorded by the full backup’s reviewed source manifest. This package contains only the explicitly copied source, not an automatic mirror. The main private nas-projects backup retains the broader shared host context. This package comes from the separately prepared private release candidate. Do not silently replace its portable paths/build with raw installation-specific NAS files.

## Setup, run and tests

Run commands from this repository root unless a `cd` is shown. Use a disposable checkout and fictional data for first setup. Dependencies, SDKs, signing material and personal data are not bundled. The following are continuation instructions grounded in the retained source, **not commands executed or newly certified by this handover**.

```powershell
cd projects-host/qr-transfer-dev
npm install
npm test
npm run build
```

Built sender.html and receiver.html under projects-host/site/qr-transfer; receiver camera use needs an appropriate secure context and browser permission.

Selected project check:

```powershell
cd projects-host/qr-transfer-dev
node test-protocol.mjs
node test-timing.mjs
```

For the documentation demo alone, serve this repository on loopback with `python -m http.server 8765 --bind 127.0.0.1` and open `/demo.html`. Choose a free port if another preview is running. JavaScript syntax can be checked with `node --check demo-source/runtime.js`. `python demo-source/rebuild.py` rewrites demo.html, so run it only in a disposable checkout or an authorised demo-editing session. A local server cannot provide missing HA/CAD/NAS functions. Inspect browser tests for installed dependencies, fixture requirements and network targets before running them with the approved browser tooling.

## Data, configuration and backup boundaries

Browser progress is local. Preserve original files until the saved received bytes are verified. Optical visibility exposes transmitted content; encoding is not encryption. Camera recordings, received files and resumable state are user data, not source backup.

The browser candidate stores progress locally; it does not silently send files to a cloud service. A camera recording or someone else’s view of the sender screen can expose the transmitted content: encoding and recovery are not encryption. Keep source files until the received copies are verified and saved.

Git preserves reviewed source and documentation. It does not copy browser storage, application databases, uploaded models/photos, accepted device settings, SDKs or credentials. Maintain independent recovery copies of the data identified above, including matching configuration and asset versions. Never add real secrets to examples, issues or logs. Private source copies on GitHub are not proof of a complete NAS/offsite data backup.

## Current verification and Git state

Before these documentation edits on 14 October 2026, this package was clean on branch `main` at `6c669429cac4e6f7183dd47e99346ffbb4db44f4` and its private upload was verified. All 32 manifest-listed source entries matched their stored checksums before editing. The upload follow-up has completed all 17 repositories and is paused; it does not run this tool or back up its live data.

These handover pages and README links accompany the source package. Preserve them when continuing; stage only reviewed changes. Recheck current `git status --short --branch` and `git diff` before starting. No project-specific background schedule was inspected or changed in this documentation pass. Any service schedules in older notes are historical claims to verify in the actual deployment.

Earlier package checks and limits are recorded in [VALIDATION.md](../VALIDATION.md). This handover adds documentation/link/whitespace/secret and source-preservation checks only. No current NAS release, real hardware state, fresh installation, complete data restoration or offsite-backup freshness was verified here.

## Recovery approach

1. Preserve the current installation/data before changing it. Identify the exact code commit and data snapshot required; do not assume this package matches the running service.
2. Recover source into a new folder. Verify the source manifest and restore the project-specific configuration/assets described above separately. Recreate dependencies from the retained project files and guides.
3. Restore user data into an isolated instance or clean test browser. Check a representative editable record, associated files and save/reload behaviour, then compare to the original. Do not test recovery by overwriting production.
4. Record what actually restored and what remains missing. A demo opening or a passing syntax check is not a production recovery drill. Real deployment/device actions need the existing authorised workflow.

## Known limits and next work

Protocol tests reconstructed 2,337,225 bytes across three files with dropped, reversed and duplicate frames. Build and timing tests passed. Physical camera throughput, cross-phone compatibility and a 4 GB transfer have not been validated. Public sharing of this project was authorised on 14 October 2026.

**Priority:** Validate real sender/receiver phones, camera permissions, loss/resume and throughput using harmless samples. Public sharing was authorised on 14 October 2026. Keep credentials and real transfer payloads out of the repository.

Common symptoms to check for this tool:

- Camera unavailable: use HTTPS, check browser permission and ensure another application is not holding the camera.
- No progress: improve framing/focus and reduce frame speed.
- Resume missing: check the exact browser/origin and whether site data was cleared.
- Storage warning: free space or use a smaller transfer; do not repeatedly reload and discard recoverable progress.

Keep [the release checklist](../RELEASE-CHECKLIST.md) and [third-party notes](../THIRD-PARTY.md) with the package. Original contributions use MIT; bundled/upstream code and assets keep their own licences. Public publication is a separate decision; preparing documentation is not permission to publish.
