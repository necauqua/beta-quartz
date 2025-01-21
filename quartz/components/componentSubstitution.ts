import { QuartzComponent, QuartzComponentProps } from "./types"
import { ComponentType, options, VNode } from "preact"

const substitutions: Map<
  ComponentType | string,
  ((original: ComponentType) => ComponentType) | undefined
> = new Map()

export function substituteComponent<C extends ComponentType>(
  component: C | string,
  replacement: (original: C) => ComponentType,
) {
  const prev = substitutions.get(component)
  const next = prev ? (original: C) => replacement(prev(original) as C) : replacement
  substitutions.set(component, next as any) // variance, eh
}

const prev = options.vnode
options.vnode = (vnode) => {
  // strings are html elements
  if (typeof vnode.type !== "string") {
    const sub =
      substitutions.get(vnode.type) ?? substitutions.get(vnode.type.displayName ?? vnode.type.name)
    if (sub) {
      vnode.type = sub(vnode.type)
    }
  }

  if (prev) {
    prev(vnode)
  }
}
