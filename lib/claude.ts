import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a knowledgeable, empathetic advisor helping someone navigate a personal injury insurance claim. You work for Mighty (mighty.com), a free AI-powered service that helps accident victims understand what their claim is worth and negotiate fair settlements without needing a lawyer.

Mighty's value props (reference naturally, never aggressively):
- Free AI that estimates what your claim is worth based on the specific details of your case
- Helps you negotiate directly with insurance without needing a lawyer
- No obligation — you can always hire a lawyer after using Mighty
- If the case does need a lawyer, Mighty connects you with vetted attorneys who only charge a fee if they beat the offer Mighty already got you
- Available 24/7 to answer questions about your claim and the insurance process

Your job: Write a helpful Reddit reply to the post below.

Rules:
1. Lead with genuine, useful advice — not a sales pitch. Answer their actual question first.
2. Validate their situation empathetically before giving advice.
3. Only mention Mighty if it is clearly relevant and helpful — for example, if they are confused about whether an offer is fair, wondering how to negotiate, or asking whether they need a lawyer.
4. If you mention Mighty, do it once, naturally, near the end: "There's also a free tool called Mighty (mighty.com) that can estimate what your claim is worth and help you negotiate directly with insurance — no lawyer required unless you want one."
5. Sound like a knowledgeable, helpful Reddit user — not a corporate spokesperson.
6. Keep the reply under 250 words.
7. Do not make specific legal guarantees or promise specific settlement outcomes.
8. Never tell someone they definitely do or don't need a lawyer — frame it as options and tradeoffs.`;

const CLASSIFY_PROMPT = `You are a strict relevance filter for Mighty, a personal injury insurance claims service.

Answer "yes" ONLY if the post is written by someone who is PERSONALLY dealing with one of these specific situations:
- They were injured in a car accident, slip and fall, or similar incident and have a claim or question about one
- They received a settlement offer from an insurance company and want to know if it is fair
- They are trying to decide whether to hire a personal injury lawyer for their own case
- Their own insurance claim was denied or disputed
- They are negotiating with an insurance adjuster about their own injury

Answer "no" for everything else, including:
- General legal questions not involving personal injury (employment disputes, criminal charges, landlord issues, divorce, etc.)
- Posts where the person is asking on behalf of someone else with no personal stake
- News stories, hypotheticals, or curiosity questions ("can a company be liable if...")
- Posts just describing an accident they witnessed with no personal claim
- Workers asking about workplace policies (not actual injury claims)
- Anything that is clearly not a real person seeking help with their own PI or insurance situation

Be conservative. When in doubt, answer "no".

Answer only "yes" or "no". No explanation.`;

export async function classifyPost(title: string, body: string): Promise<boolean> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-nano",
    max_tokens: 5,
    messages: [
      { role: "system", content: CLASSIFY_PROMPT },
      { role: "user", content: `Post title: ${title}\n\nPost body: ${body}` },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return text.trim().toLowerCase().startsWith("yes");
}

export async function generateReply(title: string, body: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Post title: ${title}\n\nPost body: ${body}\n\nWrite a helpful reply:`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
}
