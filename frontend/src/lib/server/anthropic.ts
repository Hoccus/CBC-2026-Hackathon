const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

type AnthropicContent =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    };

interface AnthropicMessageResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export async function sendAnthropicMessage(
  content: AnthropicContent[],
  options?: { system?: string; maxTokens?: number },
) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": requiredEnv("ANTHROPIC_API_KEY"),
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: options?.maxTokens ?? 1024,
      system: options?.system,
      messages: [{ role: "user", content }],
    }),
  });

  const data = (await response.json()) as AnthropicMessageResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || "Anthropic request failed");
  }

  const text = data.content?.find((item) => item.type === "text")?.text?.trim();
  if (!text) {
    throw new Error("Anthropic response did not contain text");
  }

  return text;
}

export function extractJsonValue(raw: string) {
  const firstObject = raw.indexOf("{");
  const firstArray = raw.indexOf("[");
  const startCandidates = [firstObject, firstArray].filter((index) => index >= 0);
  if (startCandidates.length === 0) {
    throw new Error("No JSON found in model response");
  }

  const start = Math.min(...startCandidates);
  const opening = raw[start];
  const closing = opening === "[" ? "]" : "}";
  let depth = 0;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];
    if (char === opening) {
      depth += 1;
    } else if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(raw.slice(start, index + 1));
      }
    }
  }

  throw new Error("Incomplete JSON in model response");
}
