
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from '../constants';

// Using casting to any to bypass potential TS environment issues with dynamic imports
const { default: ReactMarkdown } = await import('https://esm.sh/react-markdown@9') as any;
const { default: remarkGfm } = await import('https://esm.sh/remark-gfm@4') as any;


interface PlanDisplayProps {
  plan: string;
}

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
    const [copied, setCopied] = useState(false);
    
    const copyToClipboard = () => {
        if (copied) return;
        navigator.clipboard.writeText(plan);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl animate-fade-in overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
            <h2 className="text-xl sm:text-2xl font-bold text-green-400">Your App Blueprint</h2>
            <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-70"
                disabled={copied}
            >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied!' : 'Copy Plan'}
            </button>
        </div>
      <ReactMarkdown
        className="prose prose-invert lg:prose-xl max-w-none prose-h3:border-b prose-h3:border-gray-600 prose-h3:pb-2 prose-strong:text-green-400 prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md prose-code:font-mono prose-code:text-sm prose-a:text-purple-400 hover:prose-a:text-purple-300"
        remarkPlugins={[remarkGfm]}
      >
        {plan}
      </ReactMarkdown>
    </div>
  );
};

export default PlanDisplay;
