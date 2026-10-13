# QR File Transfer

Move a file from one device's screen to another device's camera using an animated
QR stream. Files stay on the participating devices; the optical channel needs no
shared network. This is a private release candidate, not a public release.

![Screen to camera file transfer](docs/images/transfer.svg)

![The private candidate sender screen](docs/images/sender-desktop.png)

## What you need

A computer with a modern browser and a receiving device with a working camera.
Start with a small text file. Large transfers may be extremely slow and require
substantial browser storage. The protocol is MQF1, not a general-purpose decoder
for other animated-QR protocols.

## Send your first file

1. Open `projects-host/site/qr-transfer/sender.html` on the sending device.
2. Choose a small sample file and prepare the transfer. Only selected files are read.
3. Open the receiver page on the other device from a trusted HTTPS host, or use
   a browser-supported local context. Camera access requires a secure context;
   an ordinary phone-to-PC HTTP LAN URL usually will not work.
4. Choose **Start camera** and allow camera access. Point the camera at the QR
   with the whole white border visible. Reduce frame speed if scanning struggles.
5. Keep the receiver visible and wait for verification. Download the reconstructed
   file only when the receiver reports completion.
6. Open the received sample and compare it with the original before trying
   something larger. Keep the sender's original file until you have checked it.

## Pausing, resuming and floating QR

Completed verified groups are stored in the receiver's browser database. Reloading
can resume those groups, but private browsing, cleared site data or storage eviction
can remove them. Unfinished groups need to be rescanned. The sender can repeat or
jump to missing groups. A floating QR window can help on desktop; always-on-top
behaviour depends on browser support. Wake-lock requests are best-effort.

## Privacy and limitations

The QR stream is not encrypted: anyone who records it may reconstruct the files.
Checksums detect corruption, not an untrusted sender. Do not transmit secrets where
someone else can view the screen. Storage quotas, camera focus, glare, frame rate
and supported browser APIs all affect success. Several-gigabyte optical transfers
can take days; no particular speed is promised. This candidate has no NAS upload
or native Python/PowerShell sender package; it includes the browser sender/receiver.

## Develop

The editable protocol, browser UI, storage and worker sources are in
`projects-host/qr-transfer-dev`. Install Node.js 22+ and pnpm. In that folder, run `pnpm install --frozen-lockfile`,
then `pnpm build` and `pnpm test`. The lockfile fixes the dependency versions. No camera throughput claim
is made from automated tests alone. Dependency notices ship in `licenses.txt`.
