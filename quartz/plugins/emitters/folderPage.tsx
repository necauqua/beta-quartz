import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import path from "path"
import {
  FilePath,
  FullSlug,
  SimpleSlug,
  stripSlashes,
  joinSegments,
  pathToRoot,
  simplifySlug,
} from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "$layout"
import { FolderContent } from "../../components"
import { write } from "./helpers"
import { i18n } from "../../i18n"
import DepGraph from "../../depgraph"

interface FolderPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

export const FolderPage: QuartzEmitterPlugin<Partial<FolderPageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: FolderContent({ sort: userOpts?.sort }),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "FolderPage",
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
    async getDependencyGraph(_ctx, content, _resources) {
      // Example graph:
      // nested/file.md --> nested/index.html
      // nested/file2.md ------^
      const graph = new DepGraph<FilePath>()

      content.map(([_tree, vfile]) => {
        const slug = vfile.data.slug
        const folderName = path.dirname(slug ?? "") as SimpleSlug
        if (slug && folderName !== "." && folderName !== "tags") {
          graph.addEdge(vfile.data.filePath!, joinSegments(folderName, "index.html") as FilePath)
        }
      })

      return graph
    },
    async emit(ctx, content, resources): Promise<FilePath[]> {
      const fps: FilePath[] = []
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      const folderNames: Record<SimpleSlug, string> = {}

      const folders: Set<SimpleSlug> = new Set(
        allFiles.flatMap((data) => {
          if (!data.slug || !data.relativePath) {
            return []
          }
          let folderSlug = path.dirname(data.slug) as SimpleSlug
          let folderFs = path.dirname(data.relativePath) as SimpleSlug
          folderNames[folderSlug] = folderFs

          const folders = [folderSlug]
          while (folderSlug !== ".") {
            folderSlug = path.dirname(folderSlug) as SimpleSlug
            folders.push(folderSlug)

            folderFs = path.dirname(folderFs) as SimpleSlug
            folderNames[folderSlug] = folderFs
          }

          return folders.filter((f) => f !== "." && f !== "tags")
        }),
      )

      const folderDescriptions: Record<string, ProcessedContent> = Object.fromEntries(
        [...folders].map((folder) => [
          folder,
          defaultProcessedContent({
            slug: joinSegments(folder, "index") as FullSlug,
            relativePath: joinSegments(folderNames[folder], "index.html") as FilePath, // this is used by breadcrumbs
            frontmatter: {
              title: `${i18n(cfg.locale).pages.folderContent.folder}: ${folderNames[folder]}`,
              tags: [],
            },
          }),
        ]),
      )

      for (const [tree, file] of content) {
        const slug = stripSlashes(simplifySlug(file.data.slug!)) as SimpleSlug
        if (folders.has(slug)) {
          if (file.data.frontmatter?.title === "index") {
            // sadly we need to avoid changing the original file title for things like explorer to work
            const clonedFile = structuredClone(file)
            clonedFile.data.frontmatter!.title = `${i18n(cfg.locale).pages.folderContent.folder}: ${folderNames[slug]}`
            folderDescriptions[slug] = [tree, clonedFile]
          } else {
            folderDescriptions[slug] = [tree, file]
          }
        }
      }

      for (const folder of folders) {
        const slug = joinSegments(folder, "index") as FullSlug

        const desc = folderDescriptions[folder]
        content.push(desc) // make sure index knows about those pages
        const [tree, file] = desc

        const externalResources = pageResources(pathToRoot(slug), file.data, resources)
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
      return fps
    },
  }
}
