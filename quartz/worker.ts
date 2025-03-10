import sourceMapSupport from "source-map-support"
sourceMapSupport.install(options)
import { Argv, BuildCtx } from "./util/ctx"
import { FilePath, FullSlug } from "./util/path"
import {
  createFileParser,
  createHtmlProcessor,
  createMarkdownParser,
  createMdProcessor,
} from "./processors/parse"
import { options } from "./util/sourcemap"
import { MarkdownContent, ProcessedContent } from "./plugins/vfile"

import cfg from "$config"

// only called from worker thread
export async function parseMarkdown(
  buildId: string,
  quartzRoot: string,
  argv: Argv,
  fps: FilePath[],
): Promise<[MarkdownContent[], FullSlug[]]> {
  // this is a hack
  // we assume markdown parsers can add to `allSlugs`,
  // but don't actually use them
  const allSlugs: FullSlug[] = []
  const ctx: BuildCtx = {
    buildId,
    cfg,
    argv,
    allSlugs,
    quartzRoot,
  }
  return [await createFileParser(ctx, fps)(createMdProcessor(ctx)), allSlugs]
}

// only called from worker thread
export function processHtml(
  buildId: string,
  quartzRoot: string,
  argv: Argv,
  mds: MarkdownContent[],
  allSlugs: FullSlug[],
): Promise<ProcessedContent[]> {
  const ctx: BuildCtx = {
    buildId,
    cfg,
    argv,
    allSlugs,
    quartzRoot,
  }
  return createMarkdownParser(ctx, mds)(createHtmlProcessor(ctx))
}
