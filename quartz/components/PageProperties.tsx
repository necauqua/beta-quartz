import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { ComponentChildren, ComponentType } from "preact"
import { externalLinkRegex, wikilinkRegex } from "../plugins/transformers/ofm"
import style from "./styles/pageProperties.scss"
import { pathToRoot, simplifySlug, slugTag, transformLink } from "../util/path"
import { getFullInternalLink } from "../plugins/transformers/links"

export type FieldComponent = ComponentType<
  QuartzComponentProps & { fieldName: string; fieldValue: any }
>

interface PagePropertiesOptions {
  fieldComponents: {
    [name: string]: FieldComponent
  }
  defaultFieldComponent: FieldComponent
}

// this is ugly, we kind of ripped out what quartz does from ofm.ts
// at least in my earlier commit we separated out the `getFullInternalLink` part
// also hardcoded "shortest" transform strategy
function renderInternalLink(
  value: string,
  rawFp: string,
  rawHeader: string | undefined,
  rawAlias: string | undefined,
  props: QuartzComponentProps,
): ComponentChildren {
  const fp = rawFp?.trim() ?? ""
  const anchor = rawHeader?.trim() ?? ""
  const alias = rawAlias?.slice(1).trim()

  const url = fp + anchor
  const text = alias ?? fp

  const href = transformLink(props.fileData.slug!, url, {
    strategy: "shortest",
    allSlugs: props.ctx.allSlugs,
  })
  const full = getFullInternalLink(href, simplifySlug(props.fileData.slug!))

  return (
    <a class="internal" href={href} data-slug={full}>
      {text}
    </a>
  )
}

export const DefaultFieldComponent: FieldComponent = (props) => {
  const { fieldValue } = props
  if (fieldValue === null) {
    return "null"
  }
  if (fieldValue === undefined) {
    return null
  }
  if (typeof fieldValue === "string") {
    if (fieldValue.match(externalLinkRegex)) {
      return (
        <a class="external" href={fieldValue} target="_blank">
          {fieldValue}
        </a>
      )
    }
    const [match] = [...fieldValue.matchAll(wikilinkRegex)]
    if (match && match[0] === fieldValue && !fieldValue.startsWith("!")) {
      return renderInternalLink(fieldValue, match[1], match[2], match[3], props)
    }
    return fieldValue
  }
  if (Array.isArray(fieldValue)) {
    if (fieldValue.length === 0) {
      return null
    }
    return (
      <ul class="property-list">
        {fieldValue.map((v) => (
          <li>
            <DefaultFieldComponent {...props} fieldValue={v} />
          </li>
        ))}
      </ul>
    )
  }
  if (typeof fieldValue === "object") {
    return <code>{JSON.stringify(fieldValue, null, 2)}</code>
  }
  return fieldValue.toString?.() ?? null
}

export const TagFieldComponent: FieldComponent = ({ fieldValue, fileData }) => {
  const tags = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <ul class="property-list">
      {tags.map((tag) => {
        return (
          <li>
            <a href={`${baseDir}/tags/${slugTag(`${tag}`)}`} class="internal tag-link">
              {tag}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

// A sentinel value that hides a field
export const HIDE = () => null

const defaultOptions: PagePropertiesOptions = {
  fieldComponents: {
    title: HIDE,
    date: HIDE,
    cssclasses: HIDE,
    tags: TagFieldComponent,
    ["hide-props"]: HIDE,
  },
  defaultFieldComponent: DefaultFieldComponent,
}

export default ((opts?: Partial<PagePropertiesOptions>) => {
  const fieldComponents = { ...defaultOptions.fieldComponents, ...opts?.fieldComponents }
  const DefaultFieldComponent = opts?.defaultFieldComponent ?? defaultOptions.defaultFieldComponent

  const PageProperties: QuartzComponent = (props: QuartzComponentProps) => {
    if (!props.fileData.frontmatterRaw) {
      return null
    }

    const hideRaw = props.fileData.frontmatter?.["hide-props"] ?? []
    const hide = Array.isArray(hideRaw) ? hideRaw : [hideRaw]

    const entries = Object.entries(props.fileData.frontmatterRaw).map(([name, value]) => {
      // allow hiding through frontmatter
      if (hide.includes(name)) {
        return null
      }
      const FieldComponent = fieldComponents[name] ?? DefaultFieldComponent
      // allow hiding through config
      if (FieldComponent === HIDE) {
        return null
      }
      return (
        <>
          <dt>{name}</dt>
          <dd>
            <FieldComponent {...props} fieldName={name} fieldValue={value} />
          </dd>
        </>
      )
    })

    // avoid the padding if there's no frontmatter
    return entries.length !== 0 ? (
      <dl class={classNames(props.displayClass, "page-props")}>{entries}</dl>
    ) : null
  }

  PageProperties.css = style

  return PageProperties
}) satisfies QuartzComponentConstructor
