import React, { useState } from 'react';
import { Post } from '../data/mock';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, BadgeCheck } from 'lucide-react';
import { clsx } from 'clsx';
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

  return (
    <article className="border-b border-border-base dark:border-border-base-dark p-4 md:p-6 bg-surface dark:bg-surface-dark transition-colors duration-300">
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary dark:text-primary-dark shrink-0">
          {post.author.name.charAt(0)}
        </div>

        {/* Header Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-text-primary dark:text-text-primary-dark truncate hover:underline cursor-pointer">
              {post.author.name}
            </span>
            {post.author.isBusiness && (
              <BadgeCheck className="w-4 h-4 text-primary dark:text-primary-dark shrink-0" />
            )}
            <span className="text-sm text-text-secondary dark:text-text-secondary-dark mx-1">•</span>
            <span className="text-sm text-text-secondary dark:text-text-secondary-dark truncate">
              {post.author.major} '{post.author.graduationYear.toString().slice(-2)}
            </span>
            <span className="text-sm text-text-secondary dark:text-text-secondary-dark mx-1">•</span>
            <span className="text-sm text-text-secondary dark:text-text-secondary-dark whitespace-nowrap">
              {post.timestamp}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pl-[52px] mb-4">
        <p className="text-text-primary dark:text-text-primary-dark whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Action Bar */}
      <div className="pl-[52px] flex items-center gap-6">
        {/* Voting */}
        <div className="flex items-center bg-background dark:bg-background-dark rounded-full border border-border-base dark:border-border-base-dark overflow-hidden transition-colors">
          <button
            onClick={handleUpvote}
            className={twMerge(
              'flex items-center justify-center p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
              voteState === 'up' && 'text-upvote dark:text-upvote-dark'
            )}
            aria-label="Upvote"
          >
            <ArrowBigUp className={twMerge("w-5 h-5", voteState === 'up' && "fill-current")} />
          </button>
          <span className={twMerge(
            "text-sm font-semibold min-w-[20px] text-center",
            voteState === 'up' ? "text-upvote dark:text-upvote-dark" : voteState === 'down' ? "text-downvote dark:text-downvote-dark" : "text-text-primary dark:text-text-primary-dark"
          )}>
             {upvotes - downvotes}
          </span>
          <button
            onClick={handleDownvote}
            className={twMerge(
              'flex items-center justify-center p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
              voteState === 'down' && 'text-downvote dark:text-downvote-dark'
            )}
            aria-label="Downvote"
          >
            <ArrowBigDown className={twMerge("w-5 h-5", voteState === 'down' && "fill-current")} />
          </button>
        </div>

        {/* Comments */}
        <button className="flex items-center gap-2 text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-dark transition-colors p-2 rounded-full hover:bg-primary/5">
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">{post.comments}</span>
        </button>

        {/* Share */}
        <button className="flex items-center gap-2 text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-dark transition-colors p-2 rounded-full hover:bg-primary/5 ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
