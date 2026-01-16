
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatRole, HelpArea } from '../types';
import { SendIcon, UserIcon, BotIcon, CopyIcon, CheckIcon, BrushIcon, LinkIcon, ImageIcon } from '../constants';
import HelpAreaSelector from './HelpAreaSelector';

// Using casting to any to bypass potential TS environment issues with dynamic imports and Blob shadowing
const { default: ReactMarkdown } = await import('https://esm.sh/react-markdown@9') as any;
const { default: remarkGfm } = await import('https://esm.sh/remark-gfm@4') as any;


interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isGeneratingImage: boolean;
  onSendMessage: (message: string) => void;
  isPlanReady: boolean;
  onGeneratePlan: () => void;
  onDrawClick: () => void;
  onUploadClick: () => void;
  onUrlClick: () => void;
  attachedImages: string[];
  onRemoveImage: (index: number) => void;
  attachedUrl: string | null;
  onRemoveUrl: () => void;
  helpArea: HelpArea;
  onSetHelpArea: (area: HelpArea) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = (props) => {
  const { 
    messages, isLoading, isGeneratingImage, onSendMessage, 
    isPlanReady, onGeneratePlan, onDrawClick, onUploadClick, onUrlClick,
    attachedImages, onRemoveImage, attachedUrl, onRemoveUrl, helpArea, onSetHelpArea 
  } = props;
  
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isGeneratingImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachedImages.length > 0 || attachedUrl) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleCopy = (content: string, index: number) => {
    if (copiedIndex === index) return;
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => {
        setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800/50 rounded-t-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => {
            const isUser = msg.role === ChatRole.USER;

            const copyButton = (
                <button
                    onClick={() => handleCopy(msg.content, index)}
                    aria-label={copiedIndex === index ? 'Copied to clipboard' : 'Copy message'}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-gray-200 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                >
                    {copiedIndex === index ? <CheckIcon /> : <CopyIcon />}
                </button>
            );

            const messageBubble = (
                <div
                    className={`max-w-xl p-4 rounded-xl shadow-md ${
                        isUser
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-gray-700 text-gray-200 rounded-bl-none'
                    }`}
                >
                    {msg.images && msg.images.length > 0 && (
                        <div className={`grid gap-2 mb-3 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {msg.images.map((img, i) => (
                                <img key={i} src={img} alt={`User attachment ${i}`} className="rounded-lg border-2 border-gray-500 max-h-64 w-full object-cover" />
                            ))}
                        </div>
                    )}
                    {msg.url && (
                        <div className="mb-2 p-2 bg-purple-800/50 rounded text-xs truncate italic">
                           🔗 Context URL: {msg.url}
                        </div>
                    )}
                    <ReactMarkdown className="prose prose-invert prose-p:my-0 prose-headings:my-2" remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                    
                    {/* Grounding Links Section */}
                    {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sources & Verification:</p>
                            <div className="flex flex-col gap-1">
                                {msg.groundingLinks.map((link, lIndex) => (
                                    <a 
                                        key={lIndex} 
                                        href={link.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-purple-400 hover:text-purple-300 truncate underline"
                                    >
                                        {link.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );

            const avatar = (
                <div className={`w-8 h-8 self-start flex-shrink-0 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-600' : 'bg-gray-700'}`}>
                    {isUser ? <UserIcon /> : <BotIcon />}
                </div>
            );

            return (
                <div
                    key={index}
                    className={`group flex items-center gap-2 ${
                        isUser ? 'justify-end' : 'justify-start'
                    }`}
                >
                    {isUser ? (
                        <>
                            {copyButton}
                            {messageBubble}
                            {avatar}
                        </>
                    ) : (
                        <>
                            {avatar}
                            {messageBubble}
                            {copyButton}
                        </>
                    )}
                </div>
            );
        })}
        {isLoading && (
          <div className="flex items-start gap-4 justify-start">
            <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
              <BotIcon />
            </div>
            <div className="max-w-xl p-4 rounded-xl shadow-md bg-gray-700 text-gray-200 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
         {isGeneratingImage && (
          <div className="flex items-start gap-4 justify-start">
            <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
              <BotIcon />
            </div>
            <div className="max-w-xl p-4 rounded-xl shadow-md bg-gray-700 text-gray-200 rounded-bl-none italic">
              Vibe Coder is designing your UI...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky bottom-0 rounded-b-lg">
        {isPlanReady && !isLoading && (
            <div className="flex justify-center mb-4">
                 <button 
                    onClick={onGeneratePlan}
                    disabled={isLoading || isGeneratingImage}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100"
                >
                    ✨ Generate The Blueprint! ✨
                </button>
            </div>
        )}
        <HelpAreaSelector selectedArea={helpArea} onSelectArea={onSetHelpArea} />
        
        <div className="flex gap-2 flex-wrap mb-2">
            {attachedImages.map((img, index) => (
                <div key={index} className="relative w-20 h-20 group">
                    <img src={img} alt={`Attached ${index}`} className="w-full h-full object-cover rounded-md border-2 border-purple-400" />
                    <button onClick={() => onRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-500 shadow-lg">×</button>
                </div>
            ))}
            {attachedUrl && (
                <div className="relative bg-purple-900/50 px-3 py-1 rounded-full border border-purple-400 text-xs flex items-center gap-2 group animate-fade-in">
                    <span className="truncate max-w-[150px]">🔗 {attachedUrl}</span>
                    <button onClick={onRemoveUrl} className="text-gray-400 hover:text-red-400 font-bold ml-1">×</button>
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 focus-within:ring-2 focus-within:ring-purple-500">
           <div className="flex gap-1">
                <button
                    type="button"
                    onClick={onDrawClick}
                    disabled={isLoading || isGeneratingImage}
                    className="p-2 text-gray-400 hover:text-purple-400 disabled:text-gray-600 transition-colors"
                    title="Draw UI"
                >
                    <BrushIcon />
                </button>
                <button
                    type="button"
                    onClick={onUploadClick}
                    disabled={isLoading || isGeneratingImage}
                    className="p-2 text-gray-400 hover:text-purple-400 disabled:text-gray-600 transition-colors"
                    title="Upload Screenshot"
                >
                    <ImageIcon />
                </button>
                <button
                    type="button"
                    onClick={onUrlClick}
                    disabled={isLoading || isGeneratingImage}
                    className="p-2 text-gray-400 hover:text-purple-400 disabled:text-gray-600 transition-colors"
                    title="Add App URL"
                >
                    <LinkIcon />
                </button>
           </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Review my app or help me build..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-gray-100 placeholder-gray-400 p-2 text-sm sm:text-base"
            rows={1}
            disabled={isLoading || isGeneratingImage}
          />
          <button
            type="submit"
            disabled={isLoading || isGeneratingImage || (!input.trim() && attachedImages.length === 0 && !attachedUrl)}
            className="p-2 bg-purple-600 rounded-full text-white hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
