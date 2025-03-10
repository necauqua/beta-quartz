import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import {
  FilePath,
  FullSlug,
  getAllSegmentPrefixes,
  joinSegments,
  pathToRoot,
  slugTag,
} from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "$layout"
import { TagContent } from "../../components"
import { write } from "./helpers"
import { i18n } from "../../i18n"
import DepGraph from "../../depgraph"
import { Data } from "vfile"

interface TagPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

const getTags = ({ frontmatter, tagLinks }: Data) => [
  ...(frontmatter?.tags ?? []),
  ...(tagLinks ?? []),
]

export const TagPage: QuartzEmitterPlugin<Partial<TagPageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: TagContent({ sort: userOpts?.sort }),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "TagPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async getDependencyGraph(ctx, content, _resources) {
      const graph = new DepGraph<FilePath>()

      for (const [_tree, file] of content) {
        const sourcePath = file.data.filePath!
        const tags = getTags(file.data).flatMap(getAllSegmentPrefixes)
        // if the file has at least one tag, it is used in the tag index page
        if (tags.length > 0) {
          tags.push("index")
        }

        for (const tag of tags) {
          graph.addEdge(
            sourcePath,
            joinSegments(ctx.argv.output, "tags", slugTag(tag) + ".html") as FilePath,
          )
        }
      }

      return graph
    },
    async emit(ctx, content, resources): Promise<FilePath[]> {
      const fps: FilePath[] = []
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      const tags: Set<string> = new Set(allFiles.flatMap(getTags).flatMap(getAllSegmentPrefixes))

      const tagDescriptions: Map<FullSlug, { tag: string; content: ProcessedContent }> = new Map(
        [...tags].map((tag) => {
          const title = `${i18n(cfg.locale).pages.tagContent.tag}: ${tag}`
          const slug = joinSegments("tags", slugTag(tag)) as FullSlug
          const content = defaultProcessedContent({ slug, frontmatter: { title } })
          return [slug, { tag, content }]
        }),
      )

      // add base tag
      tagDescriptions.set("tags/index" as FullSlug, {
        tag: "index",
        content: defaultProcessedContent({
          slug: "tags/index" as FullSlug,
          frontmatter: {
            title: i18n(cfg.locale).pages.tagContent.tagIndex,
          },
        }),
      })

      let tagFolder: string | undefined

      for (const [tree, file] of content) {
        const slug = file.data.slug!
        if (!slug.startsWith("tags/")) {
          continue
        }
        const desc = tagDescriptions.get(slug)
        if (!desc) {
          continue
        }
        desc.content = [tree, file]

        // if the title was *not* set explicitly, update it to be consistent with virtual tag pages
        // (to have the `Tag: ` prefix)
        if (!file.data.frontmatterRaw?.title && !file.data.tagTitleFixed) {
          file.data.tagTitleFixed = true
          const f = (file.data.frontmatter ||= {} as any)
          f.title = `${i18n(cfg.locale).pages.tagContent.tag}: ${f.title ?? desc.tag}`
        }
        if (!tagFolder && file.data.relativePath) {
          tagFolder = file.data.relativePath.split("/").at(0)
        }
      }

      // this is a hack to make sure our virtual tag pages have the same folder as the other tag pages
      // so that the breadcrumbs render consistent capitalization etc
      if (tagFolder) {
        const path = tagFolder as FilePath
        tagDescriptions.forEach((value) => {
          const [_, { data }] = value.content
          if (!data.relativePath) {
            data.relativePath = path
          }
        })
      }

      for (const [slug, desc] of tagDescriptions.entries()) {
        content.push(desc.content) // make sure index knows about those pages
        const [tree, file] = desc.content
        const externalResources = pageResources(pathToRoot(slug as FullSlug), file.data, resources)
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
          slug: file.data.slug!,
          ext: ".html",
        })

        fps.push(fp)
      }
      return fps
    },
  }
}

declare module "vfile" {
  interface DataMap {
    tagTitleFixed?: true
  }
}
