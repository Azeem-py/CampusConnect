import React from 'react';

interface PostCardProps {
  post: any;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <article className="bg-surface-container-low rounded-xl p-6 transition-all hover:bg-surface-container shadow-sm border border-outline-variant/10">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <img src={post.author.avatar} alt={`${post.author.name}'s avatar`} className="w-12 h-12 rounded-lg object-cover ring-2 ring-primary/20" />
          <div>
            <h3 className="font-bold text-on-surface text-lg leading-tight flex items-center gap-2">
              {post.author.name}
              {post.author.role === 'business' && (
                <span className="material-symbols-outlined text-sm text-secondary bg-secondary/10 px-1 rounded">verified</span>
              )}
            </h3>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant font-label mt-1">
              <span>{post.author.username}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span>{post.timestamp}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {post.tags?.map((tag: string) => (
            <span key={tag} className="px-3 py-1 bg-surface rounded-full text-xs font-label text-primary border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed text-[15px] mb-6 font-body whitespace-pre-line">
        <p>{post.content}</p>

        {post.image && (
          <div className="mt-4 rounded-xl overflow-hidden border border-outline-variant/20">
            <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
        <div className="flex items-center gap-6">
          <button className={`flex items-center gap-2 group transition-colors ${post.hasUpvoted ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className={`material-symbols-outlined ${post.hasUpvoted ? 'font-variation-settings:\'FILL\' 1' : ''}`}>arrow_upward</span>
            <span className="font-label font-bold text-sm">{post.upvotes}</span>
          </button>
          <button className={`flex items-center gap-2 group transition-colors ${post.hasDownvoted ? 'text-secondary' : 'text-on-surface-variant hover:text-secondary'}`}>
            <span className={`material-symbols-outlined ${post.hasDownvoted ? 'font-variation-settings:\'FILL\' 1' : ''}`}>arrow_downward</span>
          </button>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
            <span className="material-symbols-outlined group-hover:bg-primary/10 rounded-full p-1 transition-colors">chat_bubble</span>
            <span className="font-label text-sm">{post.comments}</span>
          </button>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
            <span className="material-symbols-outlined group-hover:bg-primary/10 rounded-full p-1 transition-colors">share</span>
            <span className="font-label text-sm hidden sm:inline">Share</span>
          </button>
        </div>
        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/10 p-2 rounded-full">
          bookmark_add
        </button>
      </footer>
    </article>
  );
};
