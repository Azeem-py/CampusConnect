import { Image, Sigma, Vote } from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar } from "../ui/Avatar"
import { Button } from "../ui/Button"

export function PostComposer() {
  return (
    <Link
      to="/create"
      className="block bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 space-y-3 hover:border-primary/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Avatar name="You" size="md" />
        <input
          type="text"
          placeholder="Post your research, question, or update..."
          className="flex-1 bg-transparent border-none outline-none text-body-md font-inter text-on-surface placeholder:text-on-surface-variant/50 pointer-events-none"
          readOnly
        />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant px-2 py-1 rounded">
            <Image size={15} />
            Media
          </span>
          <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant px-2 py-1 rounded">
            <Sigma size={15} />
            LaTeX
          </span>
          <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant px-2 py-1 rounded">
            <Vote size={15} />
            Poll
          </span>
        </div>
        <Button variant="primary" size="sm">
          Post
        </Button>
      </div>
    </Link>
  )
}
