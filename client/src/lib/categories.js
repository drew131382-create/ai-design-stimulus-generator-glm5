export const STIMULUS_GROUPS = [
  {
    key: "near",
    title: "产品本体刺激",
    shortTitle: "near",
    subtitle: "与产品功能、技术方案、性能、结构、产品可用性相关。",
    badgeClass: "bg-near-100 text-near-700 ring-1 ring-inset ring-near-200",
    panelClass: "border-near-200/80 bg-white/80",
    activeClass:
      "border-near-500 bg-near-50 shadow-float ring-2 ring-near-200/80",
    hoverClass: "hover:border-near-300 hover:shadow-panel",
    glowClass: "from-near-100/90 via-white to-white before:bg-near-500"
  },
  {
    key: "medium",
    title: "使用情境刺激",
    shortTitle: "medium",
    subtitle: "与用户场景、使用情境、用户体验、交互行为、服务触点相关。",
    badgeClass: "bg-medium-100 text-medium-700 ring-1 ring-inset ring-medium-200",
    panelClass: "border-medium-200/80 bg-white/80",
    activeClass:
      "border-medium-500 bg-medium-50 shadow-float ring-2 ring-medium-200/80",
    hoverClass: "hover:border-medium-300 hover:shadow-panel",
    glowClass: "from-medium-100/90 via-white to-white before:bg-medium-500"
  },
  {
    key: "far",
    title: "机制迁移刺激",
    shortTitle: "far",
    subtitle: "来自不同领域，采用隐喻或类比，鼓励跨领域创新。",
    badgeClass: "bg-far-100 text-far-700 ring-1 ring-inset ring-far-200",
    panelClass: "border-far-200/80 bg-white/80",
    activeClass: "border-far-500 bg-far-50 shadow-float ring-2 ring-far-200/80",
    hoverClass: "hover:border-far-300 hover:shadow-panel",
    glowClass: "from-far-100/90 via-white to-white before:bg-far-500"
  }
];

export const GROUP_MAP = Object.fromEntries(
  STIMULUS_GROUPS.map((group) => [group.key, group])
);
