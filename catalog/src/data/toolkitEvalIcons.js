/**
 * Preset evaluation icons for toolkit technologies (workbench detail + editor).
 * `label` is persisted on technology `pros` / `cons` string arrays.
 */
export const TOOLKIT_EVAL_PRO_OPTIONS = [
  { icon: '/eval_icons/low-cost.png', label: 'Low Cost' },
  { icon: '/eval_icons/cncf.png', label: 'CNCF' },
  { icon: '/eval_icons/containerized.png', label: 'Containerized' },
  { icon: '/eval_icons/fast.png', label: 'Fast' },
  { icon: '/eval_icons/modular.png', label: 'Modular' },
  { icon: '/eval_icons/quality.png', label: 'High Quality' },
  { icon: '/eval_icons/scalable.png', label: 'Scalable', invert: true, size: 'large' },
  { icon: '/eval_icons/secure.png', label: 'Secure' },
  { icon: '/eval_icons/supports-many.png', label: 'Supports Many' },
  { icon: '/eval_icons/tested.png', label: 'Tested' },
];

export const TOOLKIT_EVAL_CON_OPTIONS = [
  { icon: '/eval_icons/high-cost.png', label: 'High Cost' },
  { icon: '/eval_icons/not-scalable.png', label: 'Not Scalable', invert: true },
  { icon: '/eval_icons/not-secure.png', label: 'Not Secure' },
  { icon: '/eval_icons/poor-quality.png', label: 'Poor Quality' },
  { icon: '/eval_icons/slow.webp', label: 'Slow' },
  { icon: '/eval_icons/supports-one.png', label: 'Supports One' },
];

/** Programming languages — same interaction model as pros/cons (label persisted on `technology.languages`). */
export const TOOLKIT_LANGUAGE_OPTIONS = [
  { icon: '/python.svg', label: 'Python' },
  { icon: '/javascript.svg', label: 'JavaScript' },
  { icon: '/javascript.svg', label: 'TypeScript' },
  { icon: '/java.svg', label: 'Java' },
  { icon: '/ruby.svg', label: 'Ruby' },
  { icon: '/code.svg', label: 'Go' },
  { icon: '/code.svg', label: 'Rust' },
  { icon: '/code.svg', label: 'C#' },
  { icon: '/code.svg', label: 'C++' },
  { icon: '/code.svg', label: 'Kotlin' },
  { icon: '/code.svg', label: 'Scala' },
  { icon: '/code.svg', label: 'SQL' },
  { icon: '/code.svg', label: 'Shell' },
];

/** Shape expected by ToolkitDetailPage `getTechIcons` fallbacks */
export const TOOLKIT_EVAL_ICONS = {
  pros: TOOLKIT_EVAL_PRO_OPTIONS,
  cons: TOOLKIT_EVAL_CON_OPTIONS,
  languages: TOOLKIT_LANGUAGE_OPTIONS,
};
