---
title: Getting Started
hide:
  - navigation
---

# CLI Usage

```bash
npx bnf-compile ./bnf/
```

Once you have `bnf-parser` installed simply run `npx bnf-compile ./bnf/` where `./bnf/` is actually the folder where your bnfs are stored.
After running this you will notice multiple artifacts will be generated which is what you will then `import`/`require` into your project.

Please note that by default this command will generate javascript modules using the `import`/`export` syntax, if you are running an environment which **does not support** `import`/`export`, the CLI will not currently be able export artifacts useable in your project.