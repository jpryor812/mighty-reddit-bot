import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

const CLASSIFY_PROMPT = `You are a relevance filter for Mighty, a personal injury insurance service.

Decide if this Reddit post is from someone who needs help with ANY of:
- A personal injury claim (car accident, slip and fall, workplace injury, etc.)
- Understanding or negotiating an insurance settlement offer
- Deciding whether to hire a personal injury lawyer
- Dealing with medical bills after an accident
- An insurance claim dispute or denial
- Understanding their legal rights after being injured

Answer only "yes" or "no". No explanation.

A post is NOT relevant if it is:
- Just describing an accident with no personal involvement or question
- A general curiosity question with no personal legal situation
- About criminal law, divorce, employment law, or other non-PI topics
- Clearly spam or karma farming with no real question`;

export async function classifyPost(title: string, body: string): Promise<boolean> {
  const message = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 5,
    system: CLASSIFY_PROMPT,
    messages: [
      {
        role: "user",
        content: `Post title: ${title}\n\nPost body: ${body}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return false;
  return content.text.trim().toLowerCase().startsWith("yes");
}

export async function generateReply(title: string, body: string): Promise<string> {
  const message = await client.messages.create({
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
