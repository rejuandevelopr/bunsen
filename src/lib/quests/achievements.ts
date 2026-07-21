export const ACHIEVEMENTS = [
  { id: 'chapter-welcome', label: 'First Experiment', detail: 'Completed Welcome to Bunsen', icon: 'flask' },
  { id: 'chapter-measure', label: 'Careful Measure', detail: 'Completed The Measure of Things', icon: 'flask' },
  { id: 'chapter-eyes', label: 'Sky Watcher', detail: 'Completed Eyes on the Sky', icon: 'flask' },
  { id: 'chapter-scholar', label: 'Evidence Scholar', detail: "Completed The Scholar's Path", icon: 'flask' },
  { id: 'chapter-researcher', label: 'Bunsen Researcher', detail: 'Completed Your Own Question', icon: 'flask' },
  { id: 'curious-mind', label: 'Curious Mind', detail: 'Asked three specialists a question', icon: 'trophy' },
  { id: 'field-researcher', label: 'Field Researcher', detail: 'Read all four Field Notes', icon: 'trophy' },
] as const;

export const ACHIEVEMENT_BY_ID = Object.fromEntries(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
) as Record<(typeof ACHIEVEMENTS)[number]['id'], (typeof ACHIEVEMENTS)[number]>;

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];
