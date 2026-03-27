import React, { useState } from 'react';
import { Post } from '../data/mock';
import { twMerge } from 'tailwind-merge';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [voteState, setVoteState] = useState<'up' | 'down' | 'none'>(
    post.hasUpvoted ? 'up' : post.hasDownvoted ? 'down' : 'none'
  );

  const handleUpvote = () => {
    if (voteState === 'up') {
      setUpvotes((prev) => prev - 1);
      setVoteState('none');
    } else {
      setUpvotes((prev) => prev + 1);
      if (voteState === 'down') setDownvotes((prev) => prev - 1);
      setVoteState('up');
    }
  };

  const handleDownvote = () => {
    if (voteState === 'down') {
      setDownvotes((prev) => prev - 1);
      setVoteState('none');
    } else {
      setDownvotes((prev) => prev + 1);
      if (voteState === 'up') setUpvotes((prev) => prev - 1);
      setVoteState('down');
    }
  };

  const voteCount = upvotes - downvotes;

  return (
    <article className="p-6 md:p-8 hover:bg-surface-container-lowest/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group flex gap-4">
      {/* Vote Column */}
      <div className="flex flex-col items-center gap-2 pt-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleUpvote(); }}
            className={twMerge(
              "p-2 rounded-xl transition-all active:scale-95 group/btn",
              voteState === 'up' ? "bg-tertiary-container/10 text-tertiary-container" : "text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800"
            )}
            aria-label="Upvote"
          >
              <span className={twMerge("material-symbols-outlined text-xl leading-none block", voteState === 'up' && "font-variation-settings-'FILL' 1")}>arrow_upward</span>
          </button>
          <span className={twMerge(
            "text-sm font-mono font-bold leading-none",
            voteState === 'up' ? "text-tertiary-container" : voteState === 'down' ? "text-secondary-container" : "text-slate-500"
          )}>
            {voteCount > 0 ? `+${voteCount}` : voteCount}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownvote(); }}
            className={twMerge(
              "p-2 rounded-xl transition-all active:scale-95 group/btn",
              voteState === 'down' ? "bg-secondary-container/10 text-secondary-container" : "text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800"
            )}
            aria-label="Downvote"
          >
              <span className={twMerge("material-symbols-outlined text-xl leading-none block", voteState === 'down' && "font-variation-settings-'FILL' 1")}>arrow_downward</span>
          </button>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
          {/* Header Info */}
          <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=128&q=80" alt="Author avatar" className="w-6 h-6 rounded-full object-cover" />
                  <span className="font-semibold text-sm text-on-surface dark:text-slate-200 hover:underline">{post.author.name}</span>
                  <span className="text-slate-400 text-xs font-mono px-2 py-0.5 rounded bg-surface-container-low dark:bg-slate-800 tracking-tight">
                    {post.author.major} '{post.author.graduationYear.toString().slice(-2)}
                  </span>
              </div>
              <div className="flex items-center gap-3">
                  {/* Contextual Data (JetBrains Mono) */}
                  <span className="text-xs text-slate-400 font-mono tracking-tight bg-surface-container-low dark:bg-slate-800 px-2 py-1 rounded">CS 341</span>
                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">{post.timestamp}</span>
                  <button className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors text-xl">more_horiz</button>
              </div>
          </div>

          {/* Body */}
          <div className="mb-4">
              <p className="text-on-surface dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {post.content}
              </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-6 mt-4">
              <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group/action">
                  <span className="material-symbols-outlined text-xl group-hover/action:bg-primary/10 p-1.5 rounded-full transition-colors">chat_bubble</span>
                  <span className="text-xs font-mono font-medium">{post.comments} Replies</span>
              </button>
              <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group/action ml-auto">
                  <span className="material-symbols-outlined text-xl group-hover/action:bg-primary/10 p-1.5 rounded-full transition-colors">bookmark</span>
              </button>
              <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group/action">
                  <span className="material-symbols-outlined text-xl group-hover/action:bg-primary/10 p-1.5 rounded-full transition-colors">share</span>
              </button>
          </div>
      </div>
    </article>
  );
}
