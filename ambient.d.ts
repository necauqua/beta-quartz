declare module "*.scss" {
  const content: string
  export = content
}

declare module "$config" {
  import { QuartzConfig } from "./quartz"

  const config: QuartzConfig
  export = config
}

declare module "$layout" {
  import { SharedLayout, PageLayout } from "./quartz/cfg"

  export const sharedPageComponents: SharedLayout
  export const defaultContentPageLayout: PageLayout
  export const defaultListPageLayout: PageLayout
}

declare module "$styles" {
  const content: string
  export = content
}

declare module "quartz" {
  // without this the export below does nothing for some reason
  // sometimes TS is funn
  import("./quartz")

  export * from "./quartz"
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
