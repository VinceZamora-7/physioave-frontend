export const controlBase =
  "h-10 rounded-xl " +
  "bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] " +
  "border border-[rgb(var(--app-border))] " +
  "shadow-sm focus:ring-0 focus:shadow-none outline-none"

export const ptInputText = {
  root: {
    class:
      controlBase +
      " pl-10 pr-3 text-sm placeholder:opacity-60 " +
      "focus:border-[rgba(var(--app-fg),0.35)]",
  },
}

export const ptSelect = {
  root: {
    class:
      "h-12 rounded-xl " +
      "bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))] " +
      "border border-[rgb(var(--app-border))] shadow-sm " +
      "focus:ring-0 focus:shadow-none outline-none " +
      "flex items-center",
  },
  label: {
    class:
      "flex items-center h-10 px-3 text-sm leading-none " +
      "text-[rgb(var(--app-fg))] truncate",
  },
  trigger: {
    class: "flex items-center h-10 px-3 opacity-80",
  },
  panel: {
    class:
      "mt-1 rounded-xl overflow-hidden " +
      "bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))] " +
      "border border-[rgb(var(--app-border))] shadow-lg",
  },
  item: {
    class: "px-3 py-2 text-sm hover:bg-[rgba(var(--app-fg),0.06)]",
  },
}

export const ptOutlinedBtn = {
  root: {
    class:
      "h-10 rounded-xl px-4 text-sm font-semibold " +
      "border border-[rgb(var(--app-border))] " +
      "text-[rgb(var(--app-fg))] bg-transparent " +
      "hover:bg-[rgba(var(--app-fg),0.06)] " +
      "active:scale-[0.99] transition " +
      "focus:ring-0 focus:shadow-none",
  },
}

export const ptPrimaryBtn = {
  root: {
    class:
      "app-primary-action h-10",
  },
}

export const ptModalPrimaryBtn = {
  root: {
    class:
      "app-primary-action",
  },
}
