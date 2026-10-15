# Teaching and interface design

The audience includes students meeting AI for the first time. The site should help them work out an idea, not look like a research dashboard. This direction replaces the old continuous-article default.

## Learning path

- Home gives a concrete experiment before asking for a large commitment. Fit the line, then predict a new input. Explain what the two actions mean.
- A lecture opens on a grouped topic map with three specific learning outcomes. Keep the instructor’s original lecture title visible alongside the shorter display name.
- A topic route shows one topic. Explain the idea, use its diagram or experiment, then offer a short check and a next-topic link. Navigation never requires a correct answer.
- Practice shows one question at a time. Returning to a question preserves its answer. Do not call viewing a topic or answering one question “mastery.”
- “Read the full lecture” remains available for review, browser search, and printing. Keep every topic, question, and experiment accessible there.
- Returning to a lecture overview offers an explicit Continue link. It does not unexpectedly scroll into the middle of the lecture.

## Visual choices

- Main surfaces are white. The user explicitly rejected beige and cream.
- Use a readable sans serif, dark ink for explanations, purple for navigation and selection, and teal for experiments. Use color together with text labels for answer feedback.
- Make one action visually strongest in each area. Additional calculations and controls belong in labeled disclosures.
- Give diagrams enough space to read their labels. A small diagram that merely decorates a card can disappear on a phone; a teaching diagram must remain usable.
- Avoid promotional slogans, badge collections, decorative gradients, and nested panels around ordinary paragraphs.
- Keep the professor’s attribution and profile links near the bottom of the homepage. Keep the student-built credit in the footer.
- The removed floating lecture/experiment toolbar stays removed. Topic navigation is part of the document flow.

## Experiments and motion

- State one concrete first action and what the student should observe.
- Animate the computation or changing quantity. Do not add motion just to make a section look interactive.
- Start playback only after a user action. Keep Previous, Next, pause, and replay available when the computation supports them.
- Pause when the learner leaves a topic, opens an explanation, switches tabs, or moves the experiment offscreen. Retain the current calculation and edited controls.
- Respect reduced motion. Text and feedback must remain understandable without motion or color.
- Mount an experiment when its topic is first shown; keep that instance when navigating within the same lecture. Shared setups must open the correct topic and apply validated controls.
- Keep plot canvases present before their first update. Reserve narrated readouts across their steps at the current container width; allow disclosures to open and close normally. Never clip a result to force a fixed height.
- Mark long plot notes explicitly and render them as captions. Do not move labels between the picture and the document based on their current character count.

## Writing

Use an example before an abstract distinction when it helps. Define the term, show the operation, and explain its consequence. State a relevant limitation once, close to the claim it qualifies. Avoid repeating that every calculation is “actual” or every model is “declared.”

Preserve the lecture’s scientific meaning, numerical examples, source corrections, and original references. Visible warnings about verified source discrepancies remain visible in the relevant topic. A shorter explanation is not permission to remove an assumption.

## Validation

The authoring workspace tests topic navigation, question paging, state retention, shared setups, printing, and browser history. Its DOM audit visits every topic and checks names, labels, and internal links. Separate tests check the numerical models.

These checks do not establish visual quality or teaching effectiveness. Review the actual pages on desktop and phone, and observe a beginner using the first lesson before making those claims.
