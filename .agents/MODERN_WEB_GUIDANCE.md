# Modern Web Guidance

Development-only skill from [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance), installed with npx skills for Codex and Claude Code. It is not an application dependency or a shipped asset.

- Upstream commit: `4dd968349e54ca45a05dd5c818fb035c9054b022`
- Skill version: `2026_11_09-5bcc021b`
- Unmodified skill-folder SHA-256 (skills v2): `9e69ce00dc314b64f6664031b70295ea46c7de93ac682c624808df6e48e08b66`
- Canonical files: `skills/modern-web-guidance/`; Claude Code uses a symlink.

Use `DISABLE_TELEMETRY=1` for CLI commands. Search for applicable guides before a task. A legacy scan covers only about 20% of the corpus; verify findings and review relevant guides and real app views. Keep Air's approved design, privacy boundaries, cross-browser fallbacks and output fidelity. Propose substantial visual or architectural changes before implementation.

Update with:

```sh
DISABLE_TELEMETRY=1 npx --yes skills@latest add GoogleChrome/modern-web-guidance --skill modern-web-guidance --agent codex claude-code --yes
```

Record the new upstream revision and verify hashes after updating. The installer migrated existing locks to v2; empty hashes on previously modified Vercel skills are the installer’s explicit modified state and remain intact. Existing skill files were not replaced.

## Attribution and licenses

Copyright GoogleChrome/modern-web-guidance contributors. The skill folder is copied without modifications. Software code is under [Apache 2.0](licenses/modern-web-guidance-APACHE-2.0.txt). Guide documentation is under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Portions derive from [MDN Web Docs](https://developer.mozilla.org/) by Mozilla Contributors, and [W3C](https://www.w3.org/), [WHATWG](https://whatwg.org/) and [IETF](https://www.ietf.org/) specifications. See [upstream licensing](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/README.md#license).
