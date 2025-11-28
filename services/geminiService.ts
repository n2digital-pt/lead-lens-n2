
import { GoogleGenAI } from "@google/genai";
import { PitchTone, PitchLength, OutputLanguage } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });

/**
 * Converts a File object to a Base64 string.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface AnalysisResponse {
  text: string;
  groundingMetadata: any | null;
}

const getPitchInstructions = (tone: PitchTone, length: PitchLength): string => {
  let instructions = "";

  // Length Instructions
  if (length === 'SHORT') {
    instructions += `\n- **Length:** Keep the pitch very concise (under 100 words). Focus on punchy sentences.`;
  } else {
    instructions += `\n- **Length:** Standard email length (150-200 words).`;
  }

  // Tone/Strategy Instructions
  if (tone === 'PAIN_FOCUSED') {
    instructions += `
    \n**Strategy: High-Impact / Pain-Focused**
    - **Immediate Focus on Pain/Cost:** Start by directly appealing to the prospect's lost time, lost money, or lost customers. Do not start with "I hope you are well" or generic intros. Jump straight to the problem.
    - **Extreme Personalization (Proof at a Glance):** Use a specific detail observed in the analysis (e.g., a specific product on the shelf, the specific design of the menu, the awards on the wall) as immediate proof this isn't spam.
    - **Low-Risk CTA (Micro-Commitment):** Do NOT ask for a "10-minute chat". Instead, offer immediate exit value (e.g., "Can I send you a 30-second video showing how N2 Digital fixes this?" or "Reply 'yes' and I'll send the mockup").
    `;
  } else {
    instructions += `
    \n**Strategy: Standard Professional**
    - **Tone:** Friendly, professional, and helpful.
    - **Approach:** Highlight the benefits of modernization with N2 Digital.
    - **CTA:** Suggest a brief consultation or call with the N2 Digital team.
    `;
  }

  return instructions;
};

/**
 * Analyzes the business image using Gemini 3 Pro.
 */
export const analyzeBusinessImage = async (
  imageFile: File,
  businessName: string,
  tone: PitchTone = 'STANDARD', 
  length: PitchLength = 'STANDARD',
  language: OutputLanguage = 'English'
): Promise<AnalysisResponse> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const pitchInstructions = getPitchInstructions(tone, length);

    const prompt = `
      You are an expert Digital Transformation Consultant and Sales Strategist representing "N2 Digital".
      
      Analyze the provided image. It is likely a photo of a business interaction point (e.g., a storefront, a business card, a flyer, a vehicle wrap, or a product label).

      The user has identified this business as: "**${businessName}**".

      Your goal is to identify sales opportunities for web development and business automation services that "N2 Digital" can provide for "${businessName}".

      **IMPORTANT:** The entire output, including section headers, lists, and the sales pitch, MUST be in ${language}.

      Please provide a structured analysis in Markdown format with the following sections (translated to ${language}):

      ### 1. Business Identity 🏢
      - **Name:** ${businessName}
      - **Industry:** (Extract or infer)
      - **Contact Info:** (Phone, Email, Address if visible)
      - **Current Vibe:** (Describe the aesthetic/branding in 1 sentence)

      ### 2. Digital Audit & Needs Assessment 🔍
      Based on the image, what seems missing or could be improved digitally?
      - Does it look like they have a modern online presence?
      - Are there manual processes visible (e.g., paper logs, phone-only booking) that could be automated?

      ### 3. Proposed Solutions by N2 Digital 🚀
      **Website Improvements:**
      - Suggest 3 specific features N2 Digital can build (e.g., "Online Menu with QR code", "Appointment Booking System", "E-commerce store for these specific products").
      
      **Automation Ideas:**
      - Suggest 3 workflow automations N2 Digital can implement (e.g., "Auto-reply SMS for missed calls", "Review collection campaign", "Inventory sync").

      ### 4. The Cold Pitch 📧
      Draft a cold email to the owner of ${businessName} representing "N2 Digital" based on this specific image.
      ${pitchInstructions}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        maxOutputTokens: 700
      }
    });

    return {
      text: response.text || "No analysis generated. Please try again.",
      groundingMetadata: null
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    if (error instanceof Error) {
        throw new Error(`Analysis failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during analysis.");
  }
};

/**
 * Searches for business leads using Google Maps via Gemini.
 */
export const searchBusinessLeads = async (
  query: string, 
  tone: PitchTone = 'STANDARD', 
  length: PitchLength = 'STANDARD',
  language: OutputLanguage = 'English'
): Promise<AnalysisResponse> => {
  try {
    const pitchInstructions = getPitchInstructions(tone, length);

    const prompt = `
      You are a Lead Generation Specialist for "N2 Digital".
      
      Search for businesses on Google Maps matching this query: "${query}".
      
      For each business found, analyze them as a potential client for N2 Digital (a Web Development & Automation Agency).
      
      **IMPORTANT:** The entire output, including section headers, lists, and the sales pitch, MUST be in ${language}.
      
      Provide the output in Markdown (in ${language}):
      
      ### 🎯 Lead Candidates
      List the businesses found. For each one:
      - **Name**: [Business Name]
      - **Why pitch them?**: A brief 1-sentence reason why they might need N2 Digital's services.
      
      ### 📝 Recommended Outreach Strategy
      Based on the type of businesses found, draft a template email from "N2 Digital" that could be adapted for these specific leads.
      ${pitchInstructions}
      
      (Gemini, please ensure you use the Google Maps tool to find real places and include the grounding data).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        maxOutputTokens: 700
      }
    });

    return {
      text: response.text || "No leads found. Please try a different query.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null
    };
  } catch (error) {
    console.error("Error searching leads:", error);
    if (error instanceof Error) {
      throw new Error(`Search failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during search.");
  }
};

/**
 * Analyzes business leaks/gaps based on a text description.
 */
export const analyzeBusinessGap = async (
  description: string,
  language: OutputLanguage = 'English'
): Promise<AnalysisResponse> => {
  try {
    const prompt = `
      You are a Senior Business Efficiency Consultant & Digital Strategist representing "N2 Digital".
      
      The user is an entrepreneur describing their current business operations and pain points:
      "${description}"
      
      Your goal is to identify "Business Leaks"—areas where they are losing money, time, or customers—and map these specifically to solutions that N2 Digital can implement (Websites, Automations, and Marketing).
      
      **IMPORTANT:** The entire output, including section headers, lists, and action plans, MUST be in ${language}.

      Provide the response in Markdown (in ${language}):

      ### 🚨 Business Leak Detection
      Identify the top 3 gaps (e.g., "Manual scheduling is causing 5 hours of lost admin time/week" or "No lead capture on site is leaking 90% of traffic").
      
      ### 🛠️ Solution Mapping (N2 Digital Services)
      
      **💻 Website & Digital Presence**
      Specific features N2 Digital can build to fix the leaks (e.g., "Add a self-service booking portal", "Create a high-converting landing page for service X").
      
      **⚙️ Automations & Operations**
      Specific workflows N2 Digital can configure (e.g., "Auto-invoice generation upon job completion", "Zapier connection between Leads and CRM").
      
      **📈 Marketing & Growth**
      Strategies to plug acquisition leaks (e.g., "Retargeting ads for abandoned carts", "Google Review automation campaign").
      
      ### 💡 Immediate Action Plan
      A bulleted list of the first 3 steps they should take this week to stop the leaks, culminating in booking a consultation with N2 Digital.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        // Thinking budget to allow for deeper analysis of the business logic
        thinkingConfig: { thinkingBudget: 1024 },
        // The effective token limit for the response is `maxOutputTokens` minus the `thinkingBudget`.
        // We want ~700 tokens for the final output, so we set maxOutputTokens to 1024 + 700 = 1724.
        maxOutputTokens: 1724
      }
    });

    return {
      text: response.text || "No analysis generated. Please try again.",
      groundingMetadata: null
    };

  } catch (error) {
    console.error("Error analyzing business gaps:", error);
    if (error instanceof Error) {
      throw new Error(`Audit failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during audit.");
  }
};
