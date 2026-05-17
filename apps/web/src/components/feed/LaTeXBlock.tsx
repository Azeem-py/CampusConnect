import "katex/dist/katex.min.css"
import { InlineMath, BlockMath } from "react-katex"

interface LaTeXBlockProps {
  children: string
  block?: boolean
}

export function LaTeXBlock({ children, block = true }: LaTeXBlockProps) {
  if (block) {
    return (
      <div className="my-3 pl-4 border-l-2 border-primary bg-surface-container/50 py-3 pr-4 rounded-r-md overflow-x-auto">
        <BlockMath math={children} />
      </div>
    )
  }

  return <InlineMath math={children} />
}
