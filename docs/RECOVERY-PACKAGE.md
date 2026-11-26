# Portable recovery package

The final archive is generated locally after the implementation/evidence commits. It contains a Git bundle for `reconstruction/hilltop-v4`, restore instructions and a manifest identifying the exact commit/tree and archive checksums. The bundle includes its complete committed ancestry, reconstructed documents, v4 reference compositions, actual screenshots, code, tests and font licence. It excludes working directories, node_modules, build output, environment files and remote-only commit 141caf2.

Restore from the extracted archive:

```sh
git bundle list-heads hilltop-v4.bundle
git clone --branch reconstruction/hilltop-v4 hilltop-v4.bundle hilltop-restored
cd hilltop-restored
git bundle verify ../hilltop-v4.bundle
git status --short
git fsck --full
npm ci
npm run ci
npm run test:e2e
npm run test:integration
```

Use the manifest's full commit hash to confirm `git rev-parse HEAD`. The browser configurations currently expect `/usr/bin/chromium`; configure a local Chromium executable when restoring on another operating system. No real Supabase service is required for isolated UI tests. Mock integration tests use an explicit `.invalid` domain and synthetic key. Real backend/security/portal verification still needs authorised staging.

Bundle creation, archive inspection, fresh extraction/clone, object integrity and restored commit/tree equality are checked after the final commit; results belong in the archive manifest so it can identify the final hash without a self-referential commit.

The prescribed `/codex/browser/projectless/0013-files-pasted-by-the-user-uploaded-pasted-text-po/output` directory is not writable/creatable by this environment's OS user. The archive is retained in the ignored local `work/reconstruction/recovery/` workspace. This is an output-delivery limitation, not missing committed implementation history. No remote upload or deployment is used as a substitute.
