# Introduction to Artificial Intelligence

[Read the course](https://lenniaconrad.github.io/thu-introduction-to-ai/)

An interactive study companion for [Jungong Han’s](https://www.au.tsinghua.edu.cn/en/info/1092/3503.htm) Introduction to Artificial Intelligence course at Tsinghua University. The instructor is **Tenured Professor (长聘教授), Department of Automation; Fellow of IAPR · Fellow of AAIA**.

The 13 lectures contain 329 topics, 506 practice questions and 96 browser experiments. Each lecture opens on a grouped topic map with a short introduction. Read one topic at a time, try its experiment, and answer one practice question at a time. Next-topic links continue through the lecture and into the following lecture. Choose “Read the full lecture” to see everything on one page for review or search. Printing includes the full lecture. There are no accounts, personal notes, or course-administration pages.

The homepage starts with a small line-fitting experiment, then asks for a prediction on a new input. It also links to lecture 1, the three parts of the course, and Prof. Han’s Tsinghua profile and academic website. The opening explanations use concrete examples, and original lecture titles remain visible beside the shorter course labels. Quiz feedback names both the selected and correct answers. See [DESIGN.md](DESIGN.md) for the teaching and interface decisions.

Each course experiment begins with a concrete first action. Its main diagram and result appear first; full calculations, extra controls, and reflection questions open on request. Guided examples cover convolution, attention, backpropagation, neural-network training, PCA, diffusion and the Transformer. Play, Previous and Next sit below the visual. Playback pauses when you leave its topic, the visual leaves the screen, the tab is hidden, or an explanation opens for inspection. Reduced-motion preferences disable transitions. K-means also compares seeded fits visually. Experiments load when their topic is opened and retain their settings during navigation. A collapsible topic map and explicit Continue links support returning to a lecture without a floating toolbar.

Attention has dominant-key, uniform and blocked-future presets alongside the full Transformer. Its animation traces signed scores, scaling, masking, softmax and each weighted-value contribution. Convolution can build one output from nine products, then bias and activation, or scan the image. Finished calculations can replay with the same controls.

Under Options, “Undo change” reverses a parameter edit or training action, while Previous revisits a calculation step. “Pin result” keeps a comparison while you change controls; numerical differences and duplicate result panels open on request. The comparison lists changed settings, edited array/model entries and numerical result differences for the guided workbenches. “Share setup” provides a copyable link to a fresh run with those controls; trained weights and complete edited arrays are not included. Older tab sessions and setup links preserve their original calculations.

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

To export an update from that workspace, run its `scripts/export-github-pages.mjs` with this checkout’s path, review the diff, then commit and push `main`. The deploy workflow, README, and DESIGN.md remain in place.

## Images and attribution

Teaching diagrams are rebuilt as native HTML/SVG. Context photographs and the BERT token vocabulary retain their specific creator/source/licence records in [assets/ATTRIBUTIONS.json](assets/ATTRIBUTIONS.json); attribution is also displayed beside photographs. The instructor portrait comes from [Jungong Han’s academic website](https://jungonghan.github.io/). These assets retain their respective rights and licences; the repository does not grant a blanket licence over third-party material.
