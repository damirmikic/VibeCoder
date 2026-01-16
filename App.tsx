
import React, { useState, useEffect } from 'react';
import { ChatMessage, ChatRole, HelpArea } from './types';
import { createChat, sendMessage, generateImage } from './services/geminiService';
import ChatWindow from './components/ChatWindow';
import PlanDisplay from './components/PlanDisplay';
import DrawingCanvas from './components/DrawingCanvas';
import { LogoIcon } from './constants';

function App() {
  // Using any for chat to avoid complex type conflicts from SDK imports in the main component
  const [chat, setChat] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [finalPlan, setFinalPlan] = useState<string | null>(null);
  const [isPlanReady, setIsPlanReady] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [helpArea, setHelpArea] = useState<HelpArea>('Planning');

  useEffect(() => {
    const savedPlan = localStorage.getItem('vibeCoderPlan');
    const savedHistoryJSON = localStorage.getItem('vibeCoderHistory');
    
    let initialHistory: ChatMessage[] = [];
    if (savedHistoryJSON) {
        initialHistory = JSON.parse(savedHistoryJSON);
    } else {
        initialHistory = [
            {
                role: ChatRole.MODEL,
                content: "Hey there! I'm Vibe Coder, your personal AI coding partner. Tell me about the app you want to build. What's the big idea?",
            },
        ];
    }
    setChatHistory(initialHistory);

    if (savedPlan) {
        setFinalPlan(savedPlan);
        setIsPlanReady(true);
    }

    const newChat = createChat(initialHistory);
    setChat(newChat);
  }, []);

  const handleSendMessage = async (userInput: string) => {
    if (!chat || isLoading || isGeneratingImage || (!userInput.trim() && attachedImages.length === 0 && !attachedUrl)) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { 
        role: ChatRole.USER, 
        content: `[Assisting with: ${helpArea}] ${userInput}`,
        images: attachedImages.length > 0 ? [...attachedImages] : undefined,
        url: attachedUrl ?? undefined,
    };
    const newHistoryWithUserMessage = [...chatHistory, userMessage];
    setChatHistory(newHistoryWithUserMessage);
    
    // Clear attachments after sending
    const currentUrl = attachedUrl;
    setAttachedImages([]);
    setAttachedUrl(null);

    try {
      const result = await sendMessage(chat, userMessage.content, userMessage.images, currentUrl ?? undefined);
      const modelResponse = result.text;
      const groundingLinks = result.groundingLinks;
      
      const imageGenRegex = /\[generate_ui_image:\s*(.*)\]/;
      const imageGenMatch = modelResponse.match(imageGenRegex);

      if (imageGenMatch) {
          const imagePrompt = imageGenMatch[1];
          const interimMessage: ChatMessage = { role: ChatRole.MODEL, content: "Sure, let me whip up a design for you. One moment..." };
          setChatHistory([...newHistoryWithUserMessage, interimMessage]);

          setIsGeneratingImage(true);
          setIsLoading(false);

          const generatedImageUrl = await generateImage(imagePrompt);
          
          let finalHistory: ChatMessage[];
          if(generatedImageUrl) {
            const imageMessage: ChatMessage = {
                role: ChatRole.MODEL,
                content: "Here's a concept for the UI you described:",
                images: [generatedImageUrl],
            };
            finalHistory = [...newHistoryWithUserMessage, interimMessage, imageMessage];
          } else {
            const errorMessage: ChatMessage = {
                role: ChatRole.MODEL,
                content: "Sorry, I hit a snag while trying to create the image. Let's try that again.",
            };
            finalHistory = [...newHistoryWithUserMessage, interimMessage, errorMessage];
          }
          setChatHistory(finalHistory);
          localStorage.setItem('vibeCoderHistory', JSON.stringify(finalHistory));
          setIsGeneratingImage(false);

      } else {
        const modelMessage: ChatMessage = { 
            role: ChatRole.MODEL, 
            content: modelResponse,
            groundingLinks: groundingLinks 
        };
        const finalHistory = [...newHistoryWithUserMessage, modelMessage];
        setChatHistory(finalHistory);
        localStorage.setItem('vibeCoderHistory', JSON.stringify(finalHistory));

        const isPlanRequest = userInput.toLowerCase().includes('generate the plan') || userInput.toLowerCase().includes('generate blueprint');
        const isPlanResponse = modelResponse.includes('### Project Overview') && modelResponse.includes('### Phase 1');

        if (isPlanRequest && isPlanResponse) {
            setFinalPlan(modelResponse);
            localStorage.setItem('vibeCoderPlan', modelResponse);
        }
        
        if (modelResponse.toLowerCase().includes("whenever you're ready")) {
            setIsPlanReady(true);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = { role: ChatRole.MODEL, content: "Oops, something went wrong. Please try again." };
      const historyWithError = [...newHistoryWithUserMessage, errorMessage];
      setChatHistory(historyWithError);
      localStorage.setItem('vibeCoderHistory', JSON.stringify(historyWithError));
      setIsLoading(false);
      setIsGeneratingImage(false);
    }
  };
  
  const handleGeneratePlan = () => {
    handleSendMessage("Generate the plan");
  };

  const handleStartOver = () => {
    localStorage.removeItem('vibeCoderPlan');
    localStorage.removeItem('vibeCoderHistory');
    
    const newChat = createChat();
    setChat(newChat);
    const initialMessage: ChatMessage = {
      role: ChatRole.MODEL,
      content: "Alright, fresh start! What amazing app idea is on your mind now?",
    };
    setChatHistory([initialMessage]);
    localStorage.setItem('vibeCoderHistory', JSON.stringify([initialMessage]));

    setFinalPlan(null);
    setIsLoading(false);
    setIsPlanReady(false);
    setAttachedImages([]);
    setAttachedUrl(null);
    setHelpArea('Planning');
  };

  const handleDrawingDone = (imageDataUrl: string) => {
    setAttachedImages(prev => [...prev, imageDataUrl]);
    setIsDrawing(false);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input so the same file can be selected again if removed
    e.target.value = '';
  };

  const handleAddUrl = () => {
    const url = prompt("Enter the application URL to check:");
    if (url) {
        setAttachedUrl(url);
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans flex flex-col">
      <header className="p-4 border-b border-gray-700 shadow-lg bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <h1 className="text-xl md:text-2xl font-bold text-purple-400">Vibe Coder</h1>
          </div>
          <button
            onClick={handleStartOver}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-semibold"
          >
            Start Over
          </button>
        </div>
      </header>

      {isDrawing && (
        <DrawingCanvas 
            onDone={handleDrawingDone} 
            onCancel={() => setIsDrawing(false)} 
        />
      )}

      <main className="flex-1 container mx-auto p-4 w-full flex justify-center overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col">
          {finalPlan && (
            <div className="mb-4 flex-shrink-0" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
              <PlanDisplay plan={finalPlan} />
            </div>
          )}
          <div className="flex-grow min-h-0">
            <ChatWindow
              messages={chatHistory}
              isLoading={isLoading}
              isGeneratingImage={isGeneratingImage}
              onSendMessage={handleSendMessage}
              isPlanReady={isPlanReady && !finalPlan}
              onGeneratePlan={handleGeneratePlan}
              onDrawClick={() => setIsDrawing(true)}
              attachedImages={attachedImages}
              onRemoveImage={handleRemoveImage}
              attachedUrl={attachedUrl}
              onRemoveUrl={() => setAttachedUrl(null)}
              onUploadClick={() => document.getElementById('screenshot-upload')?.click()}
              onUrlClick={handleAddUrl}
              helpArea={helpArea}
              onSetHelpArea={setHelpArea}
            />
            <input 
              type="file" 
              id="screenshot-upload" 
              className="hidden" 
              accept="image/*" 
              multiple
              onChange={handleScreenshotUpload} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
