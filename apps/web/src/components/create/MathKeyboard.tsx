import { useState, useMemo } from "react"
import { cn } from "../../lib/utils"
import { renderCommandToHtml } from "../../lib/latex"

interface MathKeyboardProps {
  onInsert: (symbol: string) => void
}

interface SymbolEntry {
  insert: string
  display: string
  description?: string
}

interface Category {
  id: string
  label: string
  variant: "symbol" | "template" | "formula"
  symbols: SymbolEntry[]
}

const CATEGORIES: Category[] = [
  {
    id: "greek",
    label: "Greek",
    variant: "symbol",
    symbols: [
      { insert: "\\alpha", display: "α" },
      { insert: "\\beta", display: "β" },
      { insert: "\\gamma", display: "γ" },
      { insert: "\\delta", display: "δ" },
      { insert: "\\epsilon", display: "ε" },
      { insert: "\\zeta", display: "ζ" },
      { insert: "\\eta", display: "η" },
      { insert: "\\theta", display: "θ" },
      { insert: "\\iota", display: "ι" },
      { insert: "\\kappa", display: "κ" },
      { insert: "\\lambda", display: "λ" },
      { insert: "\\mu", display: "μ" },
      { insert: "\\nu", display: "ν" },
      { insert: "\\xi", display: "ξ" },
      { insert: "\\omicron", display: "ο" },
      { insert: "\\pi", display: "π" },
      { insert: "\\rho", display: "ρ" },
      { insert: "\\sigma", display: "σ" },
      { insert: "\\tau", display: "τ" },
      { insert: "\\upsilon", display: "υ" },
      { insert: "\\phi", display: "φ" },
      { insert: "\\chi", display: "χ" },
      { insert: "\\psi", display: "ψ" },
      { insert: "\\omega", display: "ω" },
    ],
  },
  {
    id: "greekUpper",
    label: "Greek Upper",
    variant: "symbol",
    symbols: [
      { insert: "\\Alpha", display: "Α" },
      { insert: "\\Beta", display: "Β" },
      { insert: "\\Gamma", display: "Γ" },
      { insert: "\\Delta", display: "Δ" },
      { insert: "\\Epsilon", display: "Ε" },
      { insert: "\\Zeta", display: "Ζ" },
      { insert: "\\Eta", display: "Η" },
      { insert: "\\Theta", display: "Θ" },
      { insert: "\\Iota", display: "Ι" },
      { insert: "\\Kappa", display: "Κ" },
      { insert: "\\Lambda", display: "Λ" },
      { insert: "\\Mu", display: "Μ" },
      { insert: "\\Nu", display: "Ν" },
      { insert: "\\Xi", display: "Ξ" },
      { insert: "\\Omicron", display: "Ο" },
      { insert: "\\Pi", display: "Π" },
      { insert: "\\Rho", display: "Ρ" },
      { insert: "\\Sigma", display: "Σ" },
      { insert: "\\Tau", display: "Τ" },
      { insert: "\\Upsilon", display: "Υ" },
      { insert: "\\Phi", display: "Φ" },
      { insert: "\\Chi", display: "Χ" },
      { insert: "\\Psi", display: "Ψ" },
      { insert: "\\Omega", display: "Ω" },
    ],
  },
  {
    id: "operators",
    label: "Operators",
    variant: "symbol",
    symbols: [
      { insert: "\\sum", display: "∑" },
      { insert: "\\int", display: "∫" },
      { insert: "\\prod", display: "∏" },
      { insert: "\\partial", display: "∂" },
      { insert: "\\nabla", display: "∇" },
      { insert: "\\sqrt", display: "√" },
      { insert: "\\infty", display: "∞" },
      { insert: "\\oint", display: "∮" },
    ],
  },
  {
    id: "relations",
    label: "Relations",
    variant: "symbol",
    symbols: [
      { insert: "\\neq", display: "≠" },
      { insert: "\\approx", display: "≈" },
      { insert: "\\equiv", display: "≡" },
      { insert: "\\cong", display: "≅" },
      { insert: "\\sim", display: "∼" },
      { insert: "\\propto", display: "∝" },
      { insert: "\\leq", display: "≤" },
      { insert: "\\geq", display: "≥" },
      { insert: "\\ll", display: "≪" },
      { insert: "\\gg", display: "≫" },
    ],
  },
  {
    id: "arrows",
    label: "Arrows",
    variant: "symbol",
    symbols: [
      { insert: "\\to", display: "→" },
      { insert: "\\gets", display: "←" },
      { insert: "\\uparrow", display: "↑" },
      { insert: "\\downarrow", display: "↓" },
      { insert: "\\leftrightarrow", display: "↔" },
      { insert: "\\Rightarrow", display: "⇒" },
      { insert: "\\Leftarrow", display: "⇐" },
      { insert: "\\Leftrightarrow", display: "⇔" },
      { insert: "\\mapsto", display: "↦" },
    ],
  },
  {
    id: "sets",
    label: "Sets/Logic",
    variant: "symbol",
    symbols: [
      { insert: "\\in", display: "∈" },
      { insert: "\\notin", display: "∉" },
      { insert: "\\emptyset", display: "∅" },
      { insert: "\\cup", display: "∪" },
      { insert: "\\cap", display: "∩" },
      { insert: "\\subset", display: "⊂" },
      { insert: "\\supset", display: "⊃" },
      { insert: "\\subseteq", display: "⊆" },
      { insert: "\\supseteq", display: "⊇" },
      { insert: "\\forall", display: "∀" },
      { insert: "\\exists", display: "∃" },
      { insert: "\\neg", display: "¬" },
      { insert: "\\land", display: "∧" },
      { insert: "\\lor", display: "∨" },
      { insert: "\\oplus", display: "⊕" },
      { insert: "\\otimes", display: "⊗" },
      { insert: "\\therefore", display: "∴" },
      { insert: "\\because", display: "∵" },
    ],
  },
  {
    id: "misc",
    label: "Misc",
    variant: "symbol",
    symbols: [
      { insert: "\\pm", display: "±" },
      { insert: "\\mp", display: "∓" },
      { insert: "\\times", display: "×" },
      { insert: "\\div", display: "÷" },
      { insert: "\\angle", display: "∠" },
      { insert: "\\parallel", display: "∥" },
      { insert: "\\perp", display: "⊥" },
      { insert: "\\circ", display: "°" },
      { insert: "\\prime", display: "′" },
      { insert: "\\hbar", display: "ℏ" },
      { insert: "\\aleph", display: "ℵ" },
      { insert: "\\nabla", display: "∇" },
    ],
  },
  {
    id: "templates",
    label: "Templates",
    variant: "template",
    symbols: [
      { insert: "\\frac{}{}", display: "\\frac{}{}" },
      { insert: "\\sqrt{}", display: "\\sqrt{}" },
      { insert: "\\sum_{}^{}", display: "\\sum_{}^{}" },
      { insert: "\\int_{}^{}", display: "\\int_{}^{}" },
      { insert: "\\lim_{}", display: "\\lim_{}" },
      { insert: "\\prod_{}^{}", display: "\\prod_{}^{}" },
      { insert: "\\binom{}{}", display: "\\binom{}{}" },
      { insert: "\\overline{}", display: "\\overline{}" },
      { insert: "\\underline{}", display: "\\underline{}" },
      { insert: "\\boxed{}", display: "\\boxed{}" },
    ],
  },
  {
    id: "calculus",
    label: "Calculus",
    variant: "template",
    symbols: [
      { insert: "\\frac{d}{dx}", display: "\\frac{d}{dx}" },
      { insert: "\\frac{d^2}{dx^2}", display: "\\frac{d^2}{dx^2}" },
      { insert: "\\frac{\\partial}{\\partial x}", display: "\\frac{\\partial}{\\partial x}" },
      { insert: "\\int_{a}^{b}", display: "\\int_{a}^{b}" },
      { insert: "\\iint", display: "\\iint" },
      { insert: "\\iiint", display: "\\iiint" },
      { insert: "\\oint", display: "\\oint" },
      { insert: "\\lim_{x \\to \\infty}", display: "\\lim_{x \\to \\infty}" },
      { insert: "\\sum_{i=1}^{n}", display: "\\sum_{i=1}^{n}" },
      { insert: "\\prod_{i=1}^{n}", display: "\\prod_{i=1}^{n}" },
      { insert: "\\sum_{i=1}^{\\infty}", display: "\\sum_{i=1}^{\\infty}" },
      { insert: "\\iint_{D}", display: "\\iint_{D}" },
    ],
  },
  {
    id: "formulas",
    label: "Formulas",
    variant: "formula",
    symbols: [
      {
        insert: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        display: "Quadratic formula",
        description: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      },
      {
        insert: "e^{i\\pi} + 1 = 0",
        display: "Euler's formula",
        description: "e^{i\\pi} + 1 = 0",
      },
      {
        insert: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
        display: "Bayes' theorem",
        description: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
      },
      {
        insert: "(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k",
        display: "Binomial theorem",
        description: "(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k",
      },
      {
        insert: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
        display: "Derivative definition",
        description: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
      },
      {
        insert: "\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}",
        display: "Gaussian integral",
        description: "\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}",
      },
      {
        insert: "\\int u \\, dv = uv - \\int v \\, du",
        display: "Integration by parts",
        description: "\\int u \\, dv = uv - \\int v \\, du",
      },
      {
        insert: "\\sin^2 \\theta + \\cos^2 \\theta = 1",
        display: "Pythagorean identity",
        description: "\\sin^2 \\theta + \\cos^2 \\theta = 1",
      },
      {
        insert: "a^2 + b^2 = c^2",
        display: "Pythagorean theorem",
        description: "a^2 + b^2 = c^2",
      },
      {
        insert: "\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}",
        display: "Gauss's law",
        description: "\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}",
      },
    ],
  },
  {
    id: "distributions",
    label: "Distributions",
    variant: "formula",
    symbols: [
      {
        insert: "X \\sim \\mathcal{N}(\\mu, \\sigma^2)",
        display: "Normal",
        description: "X \\sim \\mathcal{N}(\\mu, \\sigma^2)",
      },
      {
        insert: "X \\sim \\text{Bin}(n, p)",
        display: "Binomial",
        description: "X \\sim \\text{Bin}(n, p)",
      },
      {
        insert: "X \\sim \\text{Pois}(\\lambda)",
        display: "Poisson",
        description: "X \\sim \\text{Pois}(\\lambda)",
      },
      {
        insert: "X \\sim \\text{U}(a, b)",
        display: "Uniform",
        description: "X \\sim \\text{U}(a, b)",
      },
      {
        insert: "X \\sim \\text{Exp}(\\lambda)",
        display: "Exponential",
        description: "X \\sim \\text{Exp}(\\lambda)",
      },
      {
        insert: "X \\sim \\text{Ber}(p)",
        display: "Bernoulli",
        description: "X \\sim \\text{Ber}(p)",
      },
      {
        insert: "X \\sim \\text{Geo}(p)",
        display: "Geometric",
        description: "X \\sim \\text{Geo}(p)",
      },
      {
        insert: "X \\sim \\chi^2(k)",
        display: "Chi-squared",
        description: "X \\sim \\chi^2(k)",
      },
      {
        insert: "X \\sim t(k)",
        display: "Student's t",
        description: "X \\sim t(k)",
      },
      {
        insert: "X \\sim F(d_1, d_2)",
        display: "F-distribution",
        description: "X \\sim F(d_1, d_2)",
      },
    ],
  },
]

function RenderButton({
  sym,
  variant,
  onInsert,
}: {
  sym: SymbolEntry
  variant: Category["variant"]
  onInsert: (text: string) => void
}) {
  const renderedHtml = useMemo(
    () => (variant === "template" ? renderCommandToHtml(sym.insert) : null),
    [variant, sym.insert],
  )

  return (
    <button
      onClick={() => onInsert(sym.insert)}
      className={cn(
        "flex items-center rounded-lg border border-gray-200 bg-white transition-colors",
        "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
        "active:bg-blue-100",
        variant === "symbol" &&
          "aspect-square justify-center text-[15px] font-mono leading-none",
        variant === "template" &&
          "justify-center px-1.5 py-2 text-[13px] font-serif",
        variant === "formula" &&
          "justify-start px-3 py-2.5 text-[12px] font-geist font-medium",
      )}
      title={sym.description ?? sym.insert}
    >
      {renderedHtml ? (
        <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      ) : (
        sym.display
      )}
    </button>
  )
}

export function MathKeyboard({ onInsert }: MathKeyboardProps) {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id)

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab) ?? CATEGORIES[0]

  return (
    <div className="border-t border-gray-200 bg-gray-50/80 animate-in slide-in-from-top-1">
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto scrollbar-none border-b border-gray-100">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={cn(
              "px-3 py-1.5 text-[12px] font-geist font-medium rounded-md transition-colors whitespace-nowrap shrink-0",
              activeTab === cat.id
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "grid gap-1 p-3 max-h-[180px] overflow-y-auto",
          activeCategory.variant === "symbol" && "grid-cols-8 sm:grid-cols-10 md:grid-cols-12",
          activeCategory.variant === "template" && "grid-cols-5 sm:grid-cols-6 md:grid-cols-8",
          activeCategory.variant === "formula" && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5",
        )}
      >
        {activeCategory.symbols.map((sym) => (
          <RenderButton
            key={sym.insert}
            sym={sym}
            variant={activeCategory.variant}
            onInsert={onInsert}
          />
        ))}
      </div>
    </div>
  )
}
