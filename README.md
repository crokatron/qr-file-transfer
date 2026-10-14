# QR File Transfer

**Maintaining this project? [Start here](docs/START-HERE.md) · [Detailed handover](docs/HANDOVER.md)**

Move original files across an optical link by displaying a sequence of QR frames on one screen and reconstructing those frames in a receiving browser. The receiver accepts camera frames, images or a recording. The prepared browser candidate is private; the original NAS installation additionally has owner backup functions and native sender packages, which are not included in this candidate.

**Private preview · not published.**

[Open the visual manual](docs/USER-MANUAL.md) · [Download the self-contained demo](demo.html) · [Release notes](CHANGELOG.md)

Download `demo.html` using GitHub’s Download raw file control, then open it in your browser. GitHub displays HTML source; it does not run the demo on this page. The demo is an offline simulation with fictional data and makes no network requests.

## See it

### Actual tool · controls at a glance

Actual application screenshot. Numbered boxes point to the controls described below.

![QR File Transfer — numbered controls](docs/images/guide-1.jpg)

1. **Choose a small sample.** Start with harmless files and check the total size before preparing.
2. **Choose a readable pace.** Faster frames are not always faster receiving; focus and framing matter.
3. **Prepare, then send.** Preparation creates the QR sequence. Start sending when the receiver is ready.

### Try the working offline example

Screenshot of this project’s interactive demo. Side-by-side services are explicitly simulated.

![QR File Transfer — numbered controls](docs/images/guide-2.jpg)

1. **Prepare harmless text.** Split this short message into example chunks.
2. **Receive out of order.** The last chunk can arrive before the first. Try Duplicate too.
3. **Watch unique progress.** Only new chunks increase progress; this is not the production optical protocol.

## What this tool does

| Feature | What it lets you do | Where |
| --- | --- | --- |
| File preservation | Transfer documents, archives, images and arbitrary binary files; reconstruction verifies the original bytes. | Browser candidate |
| Animated sender | Prepare selected files and display repeated encoded frames; controls support timing and presentation. | Browser candidate |
| Receiver inputs | Read through a camera or supported image/video input. | Browser candidate |
| Loss recovery | Redundant frames allow progress despite missed, reordered or duplicate frames. | Browser candidate |
| Resume | Retain partial progress in browser storage for the same transfer identity. | Browser candidate |
| NAS backup | Owner-only resumable file backup into protected NAS storage. | Original hosted implementation only |
| Native senders | Python and PowerShell alternatives for an already permitted runtime. | Original hosted implementation only |

## A first useful workflow

### Prepare a small first transfer

1. Open the sender page on the sending computer. Use the included harmless hello.txt example before trying a large archive.
2. Select the intended files and prepare the transfer. Check the filenames and total size; preparation and actual optical transfer are separate stages.
3. Keep the receiver ready before starting the animation. Set a display size and pace that remain sharp and legible on the receiving camera.
4. Start the QR sequence. Avoid window overlap, screen dimming and reflection. Esc stops presentation; restarting the display is not the same as changing the file set.

## Saving and outputs

The browser candidate stores progress locally; it does not silently send files to a cloud service. A camera recording or someone else’s view of the sender screen can expose the transmitted content: encoding and recovery are not encryption. Keep source files until the received copies are verified and saved.

## Running the actual tool

Open projects-host/site/qr-transfer/sender.html and receiver.html; read the HTTPS camera guidance.

The demo has no prerequisites; the real tool may need the services described in the manual and retained source notes.

## Current boundaries

Protocol tests reconstructed 2,337,225 bytes across three files with dropped, reversed and duplicate frames. Build and timing tests passed. Physical camera throughput, cross-phone compatibility and a 4 GB transfer have not been validated. This project must remain private until separately authorised.

## Licence and sharing

MIT applies to original project contributions. Bundled/upstream software and assets retain their own terms; see [third-party notes](THIRD-PARTY.md). Keep this repository private until its own [release checklist](RELEASE-CHECKLIST.md) is complete and the owner authorises publication.
