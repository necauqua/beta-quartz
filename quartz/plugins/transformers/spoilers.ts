import { QuartzTransformerPlugin } from "../types"
import { spoilerPlugin } from "remark-inline-spoiler"
import { visit } from "unist-util-visit"
import remarkParse from "remark-parse"
import { unified } from "unified"

const basicMdParser = unified().use(remarkParse)

export const DiscordSpoilers: QuartzTransformerPlugin = () => {
  return {
    name: "DiscordSpoilers",
    markdownPlugins: () => [
      spoilerPlugin,
      () => (tree, _file) => {
        visit(tree, "spoiler", (node, index, parent) => {
          // Sadly, remark-inline-spoiler treats spoilers as literals,
          // while in reality they are imo an inline element
          // So we have this hack to allow at least basic markdown in spoilers
          const mdast = basicMdParser.parse(node.value)

          // only allow "inline" markdown
          const insert =
            mdast.children.length === 1 && mdast.children[0].type === "paragraph"
              ? mdast.children[0].children
              : [{ type: "text", value: node.value }]

          parent.children.splice(
            index,
            1,
            {
              type: "html",
              value: `<label class="spoiler"><input type="checkbox"><span><span>`,
            },
            ...insert,
            {
              type: "html",
              value: `</span></span></label>`,
            },
          )
        })
      },
    ],
    externalResources: () => ({
      css: [
        {
          content: `
            .spoiler {
              > span {
                overflow: clip;
                cursor: pointer;
              }
              > span > span {
                background: rgba(83, 83, 83, 0.16);
                transition: filter 0.3s ease;
                filter: blur(0.5rem);
                pointer-events: none;
              }
              > input[type="checkbox"] {
                display: none;
                &:checked + span > span {
                  filter: initial;
                  pointer-events: initial;
                }
              }
            }
          `,
          inline: true,
        },
      ],
    }),
  }
}
