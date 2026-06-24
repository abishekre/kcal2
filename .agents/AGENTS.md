# Testing & UX Requirements

- **Rigorous Testing:** Always create tests for each functionality or component created. Write unit tests for logic and component tests for UX. 
- **Run Tests:** Ensure tests are run after each development step to verify correctness.
- **Prioritize UX:** A key objective is to reduce friction and improve the user experience continuously. Ensure your tests explicitly cover UX scenarios like interactions, accessible inputs, and visual states.
- **Think Deeply:** Always think through deeply on every change done. Validate syntax and structure in your head to avoid trivial parse errors.
- **Strict Test Coverage:** DO NOT skip tests. For every functionality or component modified or added, you MUST write an accompanying test.
- **CRITICAL: RUN TESTS EVERY TIME:** You must physically run detailed tests (e.g. `npm run test` or `npm run build`) EVERY SINGLE TIME you make a change, before you ever communicate back to the user. Never assume a change works without verifying it. Failure to do so leads to trivial syntax/import errors.
- **App Identity:** The name of the app is strictly "Kcal" (NOT "Kcal AI"). Always use this precise name in UI, metadata, and manifests.
- **Design & Aesthetics:** Pay extreme attention to colors and contrast on screens. Text must be perfectly legible against its background. Do not create UIs with poor contrast. Use the established design system tokens.
- **Parallelize via Subagents:** Use subagents whenever possible to run tasks in parallel. As the parent agent, you MUST provide them with highly detailed instructions and strictly ensure their tasks do not conflict with each other.
