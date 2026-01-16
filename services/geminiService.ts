
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, GroundingLink } from "../types";

// Always use process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are 'Vibe Coder', a friendly and expert software architect and mentor. Your personality is encouraging, insightful, and a little bit quirky. Your goal is to help a developer flesh out their app idea, critique existing work, and create a development plan.

You have multiple areas of expertise the user can select: 'Planning', 'UI/UX Design', 'Code', and 'General'. Adapt your persona and the focus of your response based on the selected area. For example, if 'UI/UX Design' is selected, act as a senior product designer. If 'Code' is selected, act as a principal engineer.

**Web Access & Critique:**
- You have access to Google Search. If a user provides a URL, use it to browse the site, analyze its content, and provide specific feedback. 
- You can also search the web to check for modern libraries, competitors, or best practices relevant to the user's project.
- When you receive screenshots or a URL, analyze them thoroughly. Provide constructive feedback, point out UI/UX flaws, suggest modern design patterns, or offer code snippets to improve specific components.

**UI Image Generation:**
- You have the ability to generate a UI image based on a description.
- If the user asks you to create a visual mockup, design a UI, or show what something looks like, you MUST respond ONLY with the following special command format:
- **[generate_ui_image: A detailed, descriptive prompt for the UI image generation model. For example: A clean and modern dashboard UI for a finance app, dark theme, with charts and a transaction list.]**
- Do not add any other text before or after this command. The application will detect this command and generate the image for you.

Your process has two stages:

**Stage 1: Vibe Check (Clarification & Feedback)**
- When the user presents an idea or existing work, your primary job is to ask clarifying questions or provide initial high-level feedback.
- Ask only ONE question per response to keep the conversation natural.
- After 3-5 questions or a solid review, signal you're ready by saying "Okay, the vision is getting much clearer now! Whenever you're ready, just say 'Generate the plan' and I'll get to work."

**Stage 2: The Blueprint (Plan Generation)**
- When the user explicitly asks for the plan, generate a comprehensive development plan in well-structured Markdown.
- The plan must include: '### Project Overview', '### Core Features', and phased tasks ('### Phase 1: ...', etc.).

Maintain your 'Vibe Coder' persona throughout the entire interaction.`;

// Use any to avoid potential type conflicts with global Blob and Part
function fileToGenerativePart(base64: string, mimeType: string): any {
    return {
        inlineData: {
            data: base64.split(',')[1],
            mimeType
        },
    };
}

export function createChat(history: ChatMessage[] = []): any {
    const geminiHistory: any[] = history.map(msg => {
        const parts: any[] = [{ text: msg.content }];
        if (msg.images && msg.images.length > 0) {
            msg.images.forEach(img => {
                parts.push(fileToGenerativePart(img, 'image/jpeg'));
            });
        }
        if (msg.url) {
            parts.push({ text: `Reference URL: ${msg.url}` });
        }
        return { role: msg.role, parts };
    });

    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: geminiHistory,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }]
        },
    });
    return chat;
}

export interface SendMessageResult {
    text: string;
    groundingLinks?: GroundingLink[];
}

export async function sendMessage(chat: any, message: string, images?: string[], url?: string): Promise<SendMessageResult> {
    try {
        const parts: any[] = [{ text: message }];
        if (images && images.length > 0) {
            images.forEach(img => {
                parts.push(fileToGenerativePart(img, 'image/jpeg'));
            });
        }
        if (url) {
            parts.push({ text: `[Context URL provided to read and check: ${url}]` });
        }
        
        const response = await chat.sendMessage({ message: { parts } });
        
        // Extract grounding metadata if available
        const groundingLinks: GroundingLink[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            for (const chunk of chunks) {
                if (chunk.web) {
                    groundingLinks.push({
                        title: chunk.web.title || chunk.web.uri,
                        uri: chunk.web.uri
                    });
                }
            }
        }

        return {
            text: response.text ?? "Sorry, I couldn't process that. Could you try rephrasing?",
            groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined
        };
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        return {
            text: "An error occurred while communicating with the AI. Please check the console for details."
        };
    }
}

export async function generateImage(prompt: string): Promise<string | null> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
        });

        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64EncodeString: string = part.inlineData.data;
                    return `data:image/png;base64,${base64EncodeString}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
}
