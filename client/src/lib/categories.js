export const STIMULUS_GROUPS = [
  {
    key: "near",
    title: "Near Stimuli",
    shortTitle: "Near",
    subtitle: "产品本体刺激：功能、结构、材料、工艺、人机、维护、效率、安全",
    badgeClass: "bg-near-100 text-near-700 ring-1 ring-inset ring-near-200",
    panelClass: "border-near-200/80 bg-white/80",
    activeClass:
      "border-near-500 bg-near-50 shadow-float ring-2 ring-near-200/80",
    hoverClass: "hover:border-near-300 hover:shadow-panel",
    glowClass:
      "from-near-100/90 via-white to-white before:bg-near-500"
  },
  {
    key: "medium",
    title: "Medium Stimuli",
    shortTitle: "Medium",
    subtitle:
      "使用情境刺激：用户角色、行为流程、空间环境、时间状态、交互方式、体验特征",
    badgeClass:
      "bg-medium-100 text-medium-700 ring-1 ring-inset ring-medium-200",
    panelClass: "border-medium-200/80 bg-white/80",
    activeClass:
      "border-medium-500 bg-medium-50 shadow-float ring-2 ring-medium-200/80",
    hoverClass: "hover:border-medium-300 hover:shadow-panel",
    glowClass:
      "from-medium-100/90 via-white to-white before:bg-medium-500"
  },
  {
    key: "far",
    title: "Far Stimuli",
    shortTitle: "Far",
    subtitle:
      "机制迁移刺激：自然机制、生物启发、物理现象、组织逻辑、系统结构、抽象意象、可迁移原理",
    badgeClass: "bg-far-100 text-far-700 ring-1 ring-inset ring-far-200",
    panelClass: "border-far-200/80 bg-white/80",
    activeClass:
      "border-far-500 bg-far-50 shadow-float ring-2 ring-far-200/80",
    hoverClass: "hover:border-far-300 hover:shadow-panel",
    glowClass:
      "from-far-100/90 via-white to-white before:bg-far-500"
  }
];

export const GROUP_MAP = Object.fromEntries(
  STIMULUS_GROUPS.map((group) => [group.key, group])
);
