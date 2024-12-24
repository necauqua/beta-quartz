declare module "*.scss" {
  const content: string
  export = content
}

// dom custom event
interface CustomEventMap {
  nav: CustomEvent<{ url: FullSlug }>
  themechange: CustomEvent<{ theme: "light" | "dark" }>
}

type ContentIndex = Record<
  import("./quartz/util/path").FullSlug,
  Omit<import("./quartz/plugins/emitters/contentIndex").ContentDetails, "description" | "date">
>

declare const fetchData: Promise<ContentIndex>
