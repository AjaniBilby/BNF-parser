---
title: Getting Started
hide:
  - navigation
---

# Getting Started


## Installation

We recommend for most people installing `bnf-parser` as purely a dev dependency, and then you never `import`/`require` it into your project. However if for some reason you want to generate syntax parsers for a bnf which is unknown at compile time, then you will need to install `bnf-parser` as a regular dependency.

```bash
npm install bnf-parser --save-dev
```

Optionally if you want to be able to use the cli commands anywhere without setting up a whole npm dependecy environment you can install globally using:
```bash
npm install bnf-parser -g
```