---
title: Test
hide:
  - navigation
  - toc
---


# Experiment Online

??? warning "Browser Performance Warning"

    When you hit `run` in this playground it compiles the BNF down to WASM,
    then it uses that wasm to parse the input string,
    then finally the result is shown

    This is not indicative of the performance you can expect by actually using this library properly,
    and the entire compilation step is skipped at runtime as it's already been completed during pre-compilation.

<iframe src="/static/playground.html" style="width: 100%; min-height: 600px; height: 90vh; border: none; border-radius: 10px;"></iframe>