declare module "react-katex" {
  import { ReactNode } from "react"

  interface KatexProps {
    math: string
    block?: boolean
    errorColor?: string
    renderError?: (error: Error) => ReactNode
    settings?: Record<string, unknown>
  }

  export const InlineMath: (props: KatexProps) => ReactNode
  export const BlockMath: (props: KatexProps) => ReactNode
}
