# Introduction to Artificial Intelligence

[Read the course](https://lenniaconrad.github.io/thu-introduction-to-ai/)

A minimal static study reader for Jungong Han’s Introduction to Artificial Intelligence course at Tsinghua University. The instructor is **Tenured Professor (长聘教授), Department of Automation; Fellow of IAPR · Fellow of AAIA**.

The 13 lectures contain 329 sections, 506 inline questions and 96 browser experiments. Static diagrams are fully visible; small models perform actual local training and numerical simulations. The site has a professor landing page and lecture selector. There are no accounts, saved notes or course-administration pages.

Guided visual workbenches explain convolution, attention, neural-network training and the Transformer. Playback includes pause, single steps, step back and speed controls. It pauses when an experiment leaves the screen or the tab is hidden, and reduced-motion preferences disable transitions. K-means also compares seeded fits visually. The chapter navigator jumps directly to sections and experiments.

Attention has dominant-key, uniform and blocked-future presets alongside the full Transformer. Its animation traces signed scores, scaling, masking, softmax and each weighted-value contribution. Convolution can build one output from nine products, then bias and activation, or scan the image. Finished calculations can replay with the same controls.

“Pin result” keeps a comparison while you change controls. The comparison lists changed settings, edited array/model entries and numerical result differences for the guided workbenches. “Share setup” provides a link to a fresh run with those controls; trained weights and complete edited arrays are not included. Older tab sessions and setup links preserve their original calculations.

## Run locally

```sh
python3 -m http.server 5173
```

Open http://localhost:5173/. No runtime dependencies or model API are required. Experiments, predictions, pinned results, quiz answers and the reading position are kept in this browser tab through session storage, with an in-memory fallback. The older guide’s saved records are untouched.

## GitHub Pages

Every push to `main` runs `.github/workflows/pages.yml`. It verifies relative resources, the module graph, course metadata and licensed asset hashes, then deploys the exact files listed in `site-files.json`. The public artifact is prepared in `_site/`; `.nojekyll` is included. Both root and GitHub project paths work with hash-based lecture navigation.

```sh
node scripts/prepare-pages.mjs
```

This checkout contains the public site and deployment configuration. Course-source presentations, original slide images, private authoring reviews and archives are retained in the local authoring workspace.

To export an update from that workspace, run its `scripts/export-github-pages.mjs` with this checkout’s path, review the diff, then commit and push `main`. The deploy workflow and README remain in place.

## Images and attribution

Teaching diagrams are rebuilt as native HTML/SVG. Context photographs and the BERT token vocabulary retain their specific creator/source/licence records in [assets/ATTRIBUTIONS.json](assets/ATTRIBUTIONS.json); attribution is also displayed beside photographs. The instructor portrait comes from [Jungong Han’s academic website](https://jungonghan.github.io/). These assets retain their respective rights and licences; the repository does not grant a blanket licence over third-party material.
