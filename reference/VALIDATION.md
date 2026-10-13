# Private release candidate checks

Prepared 13 October 2026. This package is not authorised for public upload.

- Browser build completed using a separate locked dependency installation.
- Protocol round trip passed for 3 sample files and 2,337,225 exact bytes across
  37 independent windows, with dropped, reversed and duplicated frames.
- Corruption, size, path and stable-resume-identity checks passed.
- Transfer estimates, storage limits and resume-budget tests passed.
- No 4 GB payload, physical camera throughput or cross-phone compatibility test
  was performed. Those checks remain part of the eventual public release gate.

The prepared package excludes owner-only NAS backup functions and native sender
packages. The full original implementation remains separately backed up in the
private source tree. Do not describe this browser candidate as the entire NAS tool.
