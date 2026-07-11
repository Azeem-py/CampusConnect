export function Footer() {
  return (
    <footer className="w-full pt-16 pb-12 border-t border-outline-variant bg-surface-container">
      <div className="max-w-7xl mx-auto px-5 md:px-20 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <div className="col-span-2 lg:col-span-2 mb-8 md:mb-0">
          <div className="font-geist font-bold tracking-tight text-on-surface lp-headline-sm mb-4">
            Logos
          </div>
          <p className="font-mono text-xs text-on-surface-variant mt-8" style={{ letterSpacing: "0.5px", lineHeight: "16px", fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} Logos. All rights reserved. Defined by precision.
          </p>
        </div>

        <div>
          <h4 className="font-geist text-on-surface font-medium mb-4" style={{ fontSize: "22px", lineHeight: "28px" }}>Platform</h4>
          <ul className="space-y-3">
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>Product</a></li>
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>Features</a></li>
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-geist text-on-surface font-medium mb-4" style={{ fontSize: "22px", lineHeight: "28px" }}>Company</h4>
          <ul className="space-y-3">
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>About Us</a></li>
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>Team</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-geist text-on-surface font-medium mb-4" style={{ fontSize: "22px", lineHeight: "28px" }}>Resources</h4>
          <ul className="space-y-3">
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>Support</a></li>
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>FAQ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-geist text-on-surface font-medium mb-4" style={{ fontSize: "22px", lineHeight: "28px" }}>Legal</h4>
          <ul className="space-y-3">
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>Privacy Policy</a></li>
            <li><a href="#" className="font-inter text-on-surface-variant hover:text-on-surface hover:underline transition-all no-underline" style={{ fontSize: "16px", lineHeight: "24px" }}>Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
