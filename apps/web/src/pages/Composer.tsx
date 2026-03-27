import React, { useState } from 'react';

export const Composer = () => {
  const [content, setContent] = useState('');

  return (
    <div className="max-w-screen-2xl mx-auto flex min-h-screen bg-surface">
      <main className="flex-1 lg:ml-64 lg:px-8 py-8 h-screen flex flex-col">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface hover:text-primary transition-colors cursor-pointer bg-surface-container-low p-2 rounded-full">
              arrow_back
            </button>
            <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Draft Post</h1>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors border border-outline-variant/30">
              Save Draft
            </button>
            <button className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-md">
              Publish
            </button>
          </div>
        </div>

        {/* Composer Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-surface border-b border-outline-variant/20 overflow-x-auto">
              <div className="flex items-center gap-1 border-r border-outline-variant/20 pr-2">
                <button className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm" title="Bold">format_bold</button>
                <button className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm" title="Italic">format_italic</button>
                <button className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm" title="Strikethrough">format_strikethrough</button>
              </div>
              <div className="flex items-center gap-1 border-r border-outline-variant/20 pr-2">
                <button className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm" title="Insert Formula">functions</button>
                <button className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm" title="Code Block">code</button>
              </div>
              <div className="flex items-center gap-1">
                <button className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm" title="Insert Image">image</button>
                <button className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm" title="Insert Link">link</button>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              className="flex-1 bg-transparent resize-none p-6 outline-none text-on-surface font-body text-base leading-relaxed placeholder:text-outline-variant"
              placeholder="Write your explanation, question, or theorem here... You can use LaTeX formatting like \sum_{i=1}^n x_i"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col min-h-0 bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm lg:max-w-md xl:max-w-lg">
            <div className="p-3 bg-surface border-b border-outline-variant/20 flex justify-between items-center">
              <span className="font-semibold text-sm text-on-surface tracking-wide uppercase px-2">Live Preview</span>
              <span className="text-xs font-label text-outline bg-surface-container px-2 py-1 rounded">Markdown + LaTeX</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 text-on-surface-variant prose prose-invert max-w-none prose-p:leading-relaxed whitespace-pre-line">
              {content || <span className="text-outline italic">Preview will appear here...</span>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
