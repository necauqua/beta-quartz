import { FullPageLayout } from "../../cfg"
import { pageResources, renderPage } from "../../components/renderPage"
import { QuartzComponentProps } from "../../components/types"
import {
  FilePath,
  FullSlug,
  pathToRoot,
  SimpleSlug,
  simplifySlug,
  stripSlashes,
} from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { defaultProcessedContent } from "../vfile"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { Content } from "../../components"
import { write } from "./helpers"

export const TransientPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: Content(),
    ...userOpts,
  }

  return {
    name: "TransientPage",
    getQuartzComponents: () => [],
    async emit(ctx, content, resources): Promise<FilePath[]> {
      const cfg = ctx.cfg.configuration
      const fps: FilePath[] = []
      const allFiles = content.map(([_, { data }]) => data)

      const existing = new Set(allFiles.map((f) => stripSlashes(simplifySlug(f.slug!))))

      const linkTitles: Record<SimpleSlug, string> = {}
      const missingFiles: SimpleSlug[] = []

      for (const data of allFiles) {
        for (const link of data.links ?? []) {
          if (!link.includes("/") && link !== "index" && !existing.has(link)) {
            missingFiles.push(link)
          }
        }
        Object.assign(linkTitles, data.linkTitles ?? {})
      }

      for (const missingFile of missingFiles) {
        const slug = missingFile as string as FullSlug
        const [tree, file] = defaultProcessedContent({
          slug,
          transient: true,
          frontmatter: {
            title: linkTitles[missingFile] ?? missingFile,
            cssclasses: ["transient"],
          },
        })
        tree.children.push({
          type: "element",
          tagName: "p",
          properties: {},
          children: [
            {
              type: "text",
              value: `This page has been linked but it doesn't actually exist, this is often used to organize backlinks.`,
            },
          ],
        })
        const externalResources = pageResources(pathToRoot(slug), file.data, resources)

        content.push([tree, file])

        const componentData: QuartzComponentProps = {
          ctx,
          fileData: file.data,
          externalResources,
          cfg,
          children: [],
          tree,
          allFiles,
        }

        const rendered = renderPage(cfg, slug, componentData, opts, externalResources)
        const fp = await write({
          ctx,
          content: rendered,
          slug,
          ext: ".html",
        })

        fps.push(fp)
      }

      return []
    },
  }
}

declare module "vfile" {
  interface DataMap {
    transient?: true
  }
}
