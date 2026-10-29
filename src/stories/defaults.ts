/** Values used when the free-story form (SPEC §7.2) leaves a field empty. Client-safe. */
export const FORM_DEFAULTS = {
  place: "Egypt", // {{place}} is always Egypt: the form no longer asks where the family lives (U1)
  bully: "Sam", // bullied tale: the unkind child, only when left empty
  companion: "Zuzu", // other tales: "Who should join … in the story?" skipped
  sidekick: "Riri",
  power_word: "I can do this!",
  need: "Can I have a big hug?",
} as const;
