import { Fragment } from "react"
import { InlineMath, BlockMath } from "react-katex"
import katex from "katex"
import "katex/dist/katex.min.css"


export interface Segment {
  type: "text" | "inline" | "block"
  value: string
}

export function parseLatex(text: string): Segment[] {
  const segments: Segment[] = []
  let remaining = text

  while (remaining.length > 0) {
    const blockMatch = remaining.match(/\$\$(.+?)\$\$/s)
    const inlineMatch = remaining.match(/\$(.+?)\$/)

    if (!blockMatch && !inlineMatch) {
      segments.push({ type: "text", value: remaining })
      break
    }

    const blockIdx = blockMatch ? blockMatch.index! : Infinity
    const inlineIdx = inlineMatch ? inlineMatch.index! : Infinity

    const useBlock = blockIdx <= inlineIdx && blockMatch

    if (useBlock) {
      if (blockIdx > 0) {
        segments.push({ type: "text", value: remaining.slice(0, blockIdx) })
      }
      segments.push({ type: "block", value: blockMatch![1] })
      remaining = remaining.slice(blockIdx + blockMatch![0].length)
    } else {
      if (inlineIdx > 0) {
        segments.push({ type: "text", value: remaining.slice(0, inlineIdx) })
      }
      segments.push({ type: "inline", value: inlineMatch![1] })
      remaining = remaining.slice(inlineIdx + inlineMatch![0].length)
    }
  }

  return segments
}

export function renderLatexSegments(segments: Segment[]) {
  return segments.map((seg, i) => {
    switch (seg.type) {
      case "block":
        return <BlockMath key={i} math={seg.value} />
      case "inline":
        return <InlineMath key={i} math={seg.value} />
      case "text":
        return <Fragment key={i}>{seg.value}</Fragment>
    }
  })
}

export function collectLatexCommand(
  text: string,
  start: number,
): { cmd: string; end: number } | null {
  if (text[start] !== "\\") return null
  let i = start + 1
  if (i >= text.length || !/[a-zA-Z]/.test(text[i])) return null
  while (i < text.length && /[a-zA-Z]/.test(text[i])) i++

  while (i < text.length) {
    const ch = text[i]
    if (ch === "{") {
      let depth = 1
      let j = i + 1
      while (j < text.length && depth > 0) {
        if (text[j] === "{") depth++
        else if (text[j] === "}") depth--
        j++
      }
      if (depth > 0) break
      i = j
    } else if (ch === "[") {
      let depth = 1
      let j = i + 1
      while (j < text.length && depth > 0) {
        if (text[j] === "[") depth++
        else if (text[j] === "]") depth--
        j++
      }
      if (depth > 0) break
      i = j
    } else if (ch === "^" || ch === "_") {
      i++
      if (i < text.length && text[i] === "{") {
        let depth = 1
        let j = i + 1
        while (j < text.length && depth > 0) {
          if (text[j] === "{") depth++
          else if (text[j] === "}") depth--
          j++
        }
        if (depth > 0) break
        i = j
      }
    } else {
      break
    }
  }

  return { cmd: text.slice(start, i), end: i }
}

function hasNestedBraces(text: string): boolean {
  const withoutArgs = text.replace(/\{[^}]*\}/g, "")
  return withoutArgs.includes("{")
}

export function renderCommandToHtml(command: string): string | null {
  try {
    return katex.renderToString(command, {
      throwOnError: true,
      output: "html",
    })
  } catch {
    return null
  }
}

function renderInlineContent(text: string, key: number | string) {
  const hasExplicitMath = /\$/.test(text)
  if (!hasExplicitMath) {
    return <FormattedText key={key} text={text} />
  }
  const segments = parseLatex(text)
  return segments.map((seg, i) => {
    switch (seg.type) {
      case "block":
        return <BlockMath key={`${key}-${i}`} math={seg.value} />
      case "inline":
        return <InlineMath key={`${key}-${i}`} math={seg.value} />
      case "text":
        return <FormattedText key={`${key}-${i}`} text={seg.value} />
    }
  })
}

export function renderEnhancedPreview(text: string) {
  const blocks = text.split(/\n\n+/)

  return blocks.map((block, i) => {
    const lines = block.split("\n")

    const allUnordered = lines.length > 0 && lines.every((l) => /^[-*]\s/.test(l))
    const allOrdered = lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l))

    if (allUnordered) {
      return (
        <ul key={i} className="list-disc pl-5 space-y-1 my-2">
          {lines.map((line, j) => (
            <li key={j}>{renderInlineContent(line.replace(/^[-*]\s/, ""), `${i}-${j}`)}</li>
          ))}
        </ul>
      )
    }

    if (allOrdered) {
      return (
        <ol key={i} className="list-decimal pl-5 space-y-1 my-2">
          {lines.map((line, j) => (
            <li key={j}>{renderInlineContent(line.replace(/^\d+\.\s/, ""), `${i}-${j}`)}</li>
          ))}
        </ol>
      )
    }

    if (lines.length === 1) {
      return (
        <div key={i} className="min-h-[1em]">
          {renderInlineContent(block, i)}
        </div>
      )
    }

    return (
      <div key={i} className="min-h-[1em]">
        {lines.map((line, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {renderInlineContent(line, `${i}-${j}`)}
          </Fragment>
        ))}
      </div>
    )
  })
}

function renderLatexCommands(text: string): React.ReactNode[] {
  if (!text.includes("\\")) return [text]

  const fullHtml = renderCommandToHtml(text)
  if (fullHtml) {
    return [<span key="full" dangerouslySetInnerHTML={{ __html: fullHtml }} />]
  }

  const parts: React.ReactNode[] = []
  let remaining = text
  let idx = 0

  while (remaining.length > 0) {
    const match = remaining.match(/\\[a-zA-Z]/)
    if (!match || match.index === undefined) {
      parts.push(<Fragment key={idx++}>{remaining}</Fragment>)
      break
    }

    if (match.index > 0) {
      parts.push(<Fragment key={idx++}>{remaining.slice(0, match.index)}</Fragment>)
    }

    const collected = collectLatexCommand(remaining, match.index)
    if (!collected) {
      parts.push(<Fragment key={idx++}>{remaining[match.index]}</Fragment>)
      remaining = remaining.slice(match.index + 1)
      continue
    }

    const { cmd } = collected
    const html = renderCommandToHtml(cmd)
    if (html) {
      parts.push(<span key={idx++} dangerouslySetInnerHTML={{ __html: html }} />)
    } else {
      parts.push(<Fragment key={idx++}>{cmd}</Fragment>)
    }

    remaining = remaining.slice(collected.end)
  }

  return parts
}

function FormattedText({ text }: { text: string }) {
  if (
    !text.includes("\\") &&
    !text.includes("**") &&
    !text.includes("*") &&
    !text.includes("~~") &&
    !text.includes("[") &&
    !text.includes("<u>")
  ) {
    return <>{text}</>
  }

  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldRe = /\*\*(.+?)\*\*/
    const italicRe = /\*(.+?)\*/
    const underlineRe = /<u>(.+?)<\/u>/
    const strikeRe = /~~(.+?)~~/
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/

    let earliest: RegExpExecArray | null = null
    let earliestType = ""
    let earliestIdx = Infinity

    for (const [re, type] of [
      [boldRe, "bold"],
      [italicRe, "italic"],
      [underlineRe, "underline"],
      [strikeRe, "strike"],
      [linkRe, "link"],
    ] as const) {
      const m = re.exec(remaining)
      if (m && m.index < earliestIdx) {
        earliest = m
        earliestType = type
        earliestIdx = m.index
      }
    }

    if (!earliest) {
      parts.push(<Fragment key={key++}>{renderLatexCommands(remaining)}</Fragment>)
      break
    }

    if (earliestIdx > 0) {
      parts.push(<Fragment key={key++}>{renderLatexCommands(remaining.slice(0, earliestIdx))}</Fragment>)
    }

    const content = earliest[1]
    if (earliestType === "bold") {
      parts.push(<strong key={key++}>{renderLatexCommands(content)}</strong>)
    } else if (earliestType === "italic") {
      parts.push(<em key={key++}>{renderLatexCommands(content)}</em>)
    } else if (earliestType === "underline") {
      parts.push(<u key={key++}>{renderLatexCommands(content)}</u>)
    } else if (earliestType === "strike") {
      parts.push(<s key={key++}>{renderLatexCommands(content)}</s>)
    } else if (earliestType === "link") {
      const href = earliest[2]
      parts.push(
        <a key={key++} href={href} className="text-blue-600 underline">
          {renderLatexCommands(content)}
        </a>,
      )
    }

    remaining = remaining.slice(earliestIdx + earliest[0].length)
  }

  return <>{parts}</>
}

export function isSimpleRenderableCommand(text: string): string | null {
  const match = text.match(/^\\([a-zA-Z]+)$/)
  if (!match) return null
  const cmd = match[0]
  const html = renderCommandToHtml(cmd)
  if (html && !hasNestedBraces(cmd)) return html
  return null
}
