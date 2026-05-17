import { useRef, useState, useCallback } from "react"
import { isSimpleRenderableCommand, renderCommandToHtml } from "../lib/latex"

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
  if (!(node instanceof HTMLElement)) return ""

  if (node.getAttribute("data-source")) return node.getAttribute("data-source") ?? ""

  const tag = node.tagName.toLowerCase()
  const inner = Array.from(node.childNodes).map(nodeToMarkdown).join("")

  switch (tag) {
    case "b":
    case "strong":
      return `**${inner}**`
    case "i":
    case "em":
      return `*${inner}*`
    case "u":
      return `<u>${inner}</u>`
    case "s":
    case "del":
    case "strike":
      return `~~${inner}~~`
    case "a": {
      const href = node.getAttribute("href") || "url"
      return `[${inner}](${href})`
    }
    case "ul":
      return Array.from(node.children)
        .filter((c) => c.tagName === "LI")
        .map((li) => `- ${nodeToMarkdown(li)}`)
        .join("\n")
    case "ol":
      return Array.from(node.children)
        .filter((c) => c.tagName === "LI")
        .map((li, i) => `${i + 1}. ${nodeToMarkdown(li)}`)
        .join("\n")
    case "li":
      return inner
    case "div":
    case "p":
      return `${inner}\n\n`
    case "br":
      return "\n"
    default:
      return inner
  }
}

export function useContentEditable() {
  const editorRef = useRef<HTMLDivElement>(null)
  const [plainContent, setPlainContent] = useState("")
  const renderTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isRenderingRef = useRef(false)

  const extractPlainContent = useCallback((): string => {
    const div = editorRef.current
    if (!div) return ""
    return Array.from(div.childNodes).map(nodeToMarkdown).join("")
  }, [])

  const doRenderPass = useCallback(() => {
    const div = editorRef.current
    if (!div || isRenderingRef.current) return
    isRenderingRef.current = true

    const sel = window.getSelection()
    const cursorNode = sel?.anchorNode ?? null

    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null)
    const nodesToProcess: Text[] = []

    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text
      if (textNode === cursorNode) continue
      if (!textNode.textContent || !textNode.textContent.includes("\\")) continue
      if (/\\[a-zA-Z]/.test(textNode.textContent)) nodesToProcess.push(textNode)
    }

    for (const textNode of nodesToProcess) {
      const text = textNode.textContent!
      const fragment = document.createDocumentFragment()
      const remaining = text
      let lastIndex = 0

      const cmdRegex = /\\[a-zA-Z]+/g
      let match: RegExpExecArray | null

      while ((match = cmdRegex.exec(remaining)) !== null) {
        const cmdStart = match.index
        const cmdText = match[0]

        if (cmdStart > lastIndex) {
          fragment.appendChild(document.createTextNode(remaining.slice(lastIndex, cmdStart)))
        }

        const html = isSimpleRenderableCommand(cmdText)
        if (html) {
          const span = document.createElement("span")
          span.contentEditable = "false"
          span.className = "math-rendered"
          span.setAttribute("data-source", cmdText)
          span.innerHTML = html
          fragment.appendChild(span)
        } else {
          fragment.appendChild(document.createTextNode(cmdText))
        }

        lastIndex = cmdStart + cmdText.length
      }

      if (lastIndex < remaining.length) {
        fragment.appendChild(document.createTextNode(remaining.slice(lastIndex)))
      }

      const hasMathSpan = Array.from(fragment.childNodes).some(
        (n) => n.nodeType !== Node.TEXT_NODE,
      )
      if (hasMathSpan) {
        textNode.parentNode?.replaceChild(fragment, textNode)
      }
    }

    setPlainContent(extractPlainContent())
    isRenderingRef.current = false
  }, [extractPlainContent])

  const handleInput = useCallback(() => {
    setPlainContent(extractPlainContent())
    clearTimeout(renderTimerRef.current)
    renderTimerRef.current = setTimeout(() => {
      doRenderPass()
    }, 350)
  }, [extractPlainContent, doRenderPass])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        let node = sel.getRangeAt(0).startContainer
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode!
        const li = node instanceof HTMLElement ? node.closest("li") : null
        if (li) {
          e.preventDefault()
          const list = li.parentElement!
          const isEmpty = !li.textContent?.trim() && li.querySelectorAll("span.math-rendered").length === 0

          if (isEmpty) {
            const listParent = list.parentElement!
            const listNext = list.nextSibling

            li.remove()

            const newBlock = document.createElement("div")
            newBlock.innerHTML = "<br>"

            const range = document.createRange()
            if (list.querySelector("li")) {
              listParent.insertBefore(newBlock, listNext)
              range.setStart(newBlock, 0)
            } else {
              list.remove()
              listParent.insertBefore(newBlock, listNext)
              range.setStart(newBlock, 0)
            }
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          } else {
            const newLi = document.createElement("li")
            newLi.innerHTML = "<br>"
            li.parentNode!.insertBefore(newLi, li.nextSibling)
            const range = document.createRange()
            range.setStart(newLi, 0)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }

          editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }))
          return
        }
      }
    }

    const isCtrl = e.ctrlKey || e.metaKey
    if (!isCtrl) return

    switch (e.key.toLowerCase()) {
      case "b":
        e.preventDefault()
        document.execCommand("bold")
        break
      case "i":
        e.preventDefault()
        document.execCommand("italic")
        break
      case "u":
        e.preventDefault()
        document.execCommand("underline")
        break
      case "s":
        if (e.shiftKey) {
          e.preventDefault()
          document.execCommand("strikeThrough")
        }
        break
      case "k":
        e.preventDefault()
        document.execCommand("createLink", false, prompt("Enter URL:", "https://") || undefined)
        break
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const mathSpan = target.closest("[data-source]")
    if (!mathSpan) return

    e.preventDefault()
    const source = mathSpan.getAttribute("data-source") || ""
    const textNode = document.createTextNode(source)
    mathSpan.parentNode?.replaceChild(textNode, mathSpan)

    const range = document.createRange()
    range.setStart(textNode, source.length)
    range.collapse(true)
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }, [])

  const insertAtCursor = useCallback(
    (text: string) => {
      const div = editorRef.current
      if (!div) return
      div.focus()

      const sel = window.getSelection()
      if (!sel) return

      let range: Range
      if (sel.rangeCount > 0) {
        range = sel.getRangeAt(0)
      } else {
        range = document.createRange()
        range.selectNodeContents(div)
        range.collapse(false)
      }

      range.deleteContents()

      const html = renderCommandToHtml(text)
      if (html) {
        const span = document.createElement("span")
        span.contentEditable = "false"
        span.className = "math-rendered"
        span.setAttribute("data-source", text)
        span.innerHTML = html
        range.insertNode(span)
        range.setStartAfter(span)
      } else {
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
      }

      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)

      setPlainContent(extractPlainContent())
    },
    [extractPlainContent],
  )

  const isEmpty = plainContent.trim().length === 0

  return {
    editorRef,
    plainContent,
    insertAtCursor,
    handleInput,
    handleKeyDown,
    handleMouseDown,
    isEmpty,
  }
}
