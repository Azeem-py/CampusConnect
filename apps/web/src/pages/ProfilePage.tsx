import { useState } from "react"
import { MapPin, Link as LinkIcon, Calendar, MoreHorizontal } from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { Avatar } from "../components/ui/Avatar"
import { Button } from "../components/ui/Button"
import { Tag } from "../components/ui/Tag"
import { FeedTabs } from "../components/feed/FeedTabs"
import { FeedCard } from "../components/feed/FeedCard"

const tabs = [
  { id: "posts", label: "My Posts" },
  { id: "media", label: "Media" },
  { id: "saved", label: "Saved Questions" },
]

const posts = [
  {
    id: "p1",
    author: { name: "Adebayo S.", handle: "@adebayo_stats" },
    timestamp: "2 hours ago",
    content:
      "Finally finished the derivation for the posterior predictive distribution in the hierarchical model. The trick was recognizing the conditional independence structure. Here is the core update step:",
    latex: "p(\\tilde{y} | y) = \\int p(\\tilde{y} | \\theta) p(\\theta | y) d\\theta",
    stats: { likes: 42, comments: 8, shares: 5 },
  },
]

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts")

  return (
    <div className="min-h-screen bg-surface pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[600px] min-w-0 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary-container/40 to-primary/20" />

            <div className="px-4 pb-4">
              <div className="flex items-end justify-between -mt-10 mb-3">
                <Avatar name="Adebayo S." size="xl" className="border-2 border-surface" />
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                  <Button variant="secondary" size="sm">
                    Edit Profile
                  </Button>
                </div>
              </div>

              <div>
                <h1 className="font-geist font-bold text-display-md text-on-surface">Adebayo S.</h1>
                <p className="text-body-md text-on-surface-variant font-inter">@adebayo_stats</p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Tag variant="department">STAT-MS</Tag>
                <Tag variant="skill">Bayesian</Tag>
              </div>

              <p className="mt-3 text-body-md text-on-surface font-inter leading-relaxed">
                MSc Statistics candidate exploring Bayesian nonparametrics and their applications in climate modeling. Passionate about open-source statistical software and robust inference methods.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-body-sm text-on-surface-variant font-inter">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> Boston, MA
                </span>
                <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <LinkIcon size={13} /> github.com/adebayo-s
                </a>
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> Joined Aug 2021
                </span>
              </div>

              <div className="flex items-center gap-4 mt-4 text-title-md font-geist">
                <span>
                  <strong className="text-on-surface">342</strong>{" "}
                  <span className="text-on-surface-variant font-normal">Following</span>
                </span>
                <span>
                  <strong className="text-on-surface">1.2k</strong>{" "}
                  <span className="text-on-surface-variant font-normal">Followers</span>
                </span>
              </div>
            </div>
          </div>

          <FeedTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <div className="space-y-4">
            {posts.map((post) => (
              <FeedCard
                key={post.id}
                author={post.author}
                timestamp={post.timestamp}
                content={post.content}
                latex={post.latex}
                stats={post.stats}
              />
            ))}
          </div>
        </main>

        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-title-md font-geist font-semibold text-on-surface flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                Institution
              </h3>
              <p className="mt-1 text-title-sm text-on-surface font-geist font-medium">Massachusetts Institute of Technology</p>
              <p className="text-body-sm text-on-surface-variant font-inter">Department of Mathematics</p>
              <p className="text-body-sm text-on-surface-variant font-inter">Advisor: Dr. E. Noether</p>
            </div>

            <div>
              <h3 className="text-title-md font-geist font-semibold text-on-surface flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Top Skills
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["R", "Python", "Stan", "LaTeX", "Bayesian Inference"].map((skill) => (
                  <Tag key={skill} variant="skill">{skill}</Tag>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
