import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useNavigate } from 'react-router-dom';

export const Composer = () => {
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const navigate = useNavigate();

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('composer-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    const newText = currentText.substring(0, start) + before + selectedText + after + currentText.substring(end);
    setContent(newText);

    // reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className="max-w-screen-2xl mx-auto flex min-h-screen bg-surface">
      <main className="flex-1 lg:ml-64 lg:px-8 py-8 h-screen flex flex-col md:pb-8 pb-24 lg:mr-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-6 px-4 lg:px-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="material-symbols-outlined text-on-surface hover:text-primary transition-colors cursor-pointer bg-surface-container-low p-2 rounded-full"
            >
              arrow_back
            </button>
            <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Draft Post</h1>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer hidden sm:block">
              Save Draft
            </button>
            <button
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-md cursor-pointer"
              onClick={() => {
                alert('Post published!');
                navigate('/');
              }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex lg:hidden border-b border-outline-variant/20 mb-4 px-4">
           <button
             className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'write' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
             onClick={() => setActiveTab('write')}
           >
             Write
           </button>
           <button
             className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'preview' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
             onClick={() => setActiveTab('preview')}
           >
             Preview
           </button>
        </div>

        {/* Composer Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 px-4 lg:px-0">

          {/* Editor Area */}
          <div className={`flex-1 flex-col min-h-0 bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm ${activeTab === 'write' ? 'flex' : 'hidden lg:flex'}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-surface border-b border-outline-variant/20 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1 border-r border-outline-variant/20 pr-2">
                <button onClick={() => insertText('**', '**')} className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm cursor-pointer" title="Bold">format_bold</button>
                <button onClick={() => insertText('*', '*')} className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm cursor-pointer" title="Italic">format_italic</button>
                <button onClick={() => insertText('~~', '~~')} className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm cursor-pointer" title="Strikethrough">format_strikethrough</button>
              </div>
              <div className="flex items-center gap-1 border-r border-outline-variant/20 pr-2">
                <button onClick={() => insertText('$$ ', ' $$')} className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm cursor-pointer" title="Insert Formula">functions</button>
                <button onClick={() => insertText('```\n', '\n```')} className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm cursor-pointer" title="Code Block">code</button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => insertText('![alt text](', ')')} className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm cursor-pointer" title="Insert Image">image</button>
                <button onClick={() => insertText('[title](', ')')} className="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-md text-on-surface-variant transition-colors text-sm cursor-pointer" title="Insert Link">link</button>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              id="composer-textarea"
              className="flex-1 bg-transparent resize-none p-6 outline-none text-on-surface font-body text-base leading-relaxed placeholder:text-outline-variant scrollbar-thin"
              placeholder="Write your explanation, question, or theorem here... You can use Markdown and LaTeX formatting like $$ \sum_{i=1}^n x_i $$"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Preview Panel */}
          <div className={`flex-1 flex-col min-h-0 bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm lg:max-w-md xl:max-w-lg ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="p-3 bg-surface border-b border-outline-variant/20 flex justify-between items-center">
              <span className="font-semibold text-sm text-on-surface tracking-wide uppercase px-2">Live Preview</span>
              <span className="text-xs font-label text-outline bg-surface-container px-2 py-1 rounded">Markdown + LaTeX</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 text-on-surface-variant prose prose-invert max-w-none prose-p:leading-relaxed whitespace-pre-line bg-surface-container-lowest dark:prose-invert">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                 <span className="text-outline italic">Preview will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
