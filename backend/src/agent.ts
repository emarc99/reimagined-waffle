import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PolicyDecision {
  approved: boolean;
  department: string;
  merchantName: string;
  amount: number;
  reason: string;
}

const POLICY = {
  Engineering: 500,
  Marketing: 300,
  Sales: 1000,
  Operations: 400,
};

export async function evaluateSpendRequest(prompt: string): Promise<PolicyDecision> {
  const systemPrompt = `You are CapSpend's AI corporate spending policy agent running on Arc blockchain.
Your job is to evaluate employee purchase requests against the following corporate policy:

Department Spending Limits (USDC):
- Engineering: $${POLICY.Engineering} max per transaction
- Marketing: $${POLICY.Marketing} max per transaction
- Sales: $${POLICY.Sales} max per transaction
- Operations: $${POLICY.Operations} max per transaction

Allowed categories: software subscriptions, cloud infrastructure, SaaS tools, developer tooling, hardware, business services.
Denied categories: personal expenses, entertainment, meals (unless client-facing), gambling.

Extract: department, merchant name, and amount from the request.
Respond ONLY with a JSON object matching this schema exactly:
{
  "approved": boolean,
  "department": "Engineering" | "Marketing" | "Sales" | "Operations",
  "merchantName": string,
  "amount": number,
  "reason": string (one sentence, max 20 words)
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  // Enforce on-chain limits as a secondary check
  const deptLimit = POLICY[parsed.department as keyof typeof POLICY] || 0;
  if (parsed.amount > deptLimit) {
    parsed.approved = false;
    parsed.reason = `${parsed.department} limit is $${deptLimit}; request for $${parsed.amount} exceeds it.`;
  }

  return parsed as PolicyDecision;
}
