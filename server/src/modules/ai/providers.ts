import { env } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";

export interface AIProvider {
  name: string;
  model?: string;
  generateSuggestion(prompt: string): Promise<string>;
}

export class OllamaProvider implements AIProvider {
  name = "ollama";
  model = env.OLLAMA_MODEL;

  async generateSuggestion(prompt: string) {
    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new HttpError(502, "AI_PROVIDER_ERROR", "Ollama request failed");
    }

    const payload = (await response.json()) as { response?: string };

    return payload.response?.trim() || "No suggestion was generated.";
  }
}

export class OpenAIProvider implements AIProvider {
  name = "openai";
  model = env.OPENAI_MODEL;

  async generateSuggestion(_prompt: string): Promise<string> {
    throw new HttpError(
      501,
      "AI_PROVIDER_ERROR",
      "OpenAI provider is intentionally left as a placeholder for a later integration"
    );
  }
}

export class DisabledProvider implements AIProvider {
  name = "disabled";

  async generateSuggestion(_prompt: string): Promise<string> {
    throw new HttpError(503, "AI_PROVIDER_ERROR", "AI assistant is disabled");
  }
}

export function createAIProvider(): AIProvider {
  if (env.AI_PROVIDER === "openai") {
    return new OpenAIProvider();
  }

  if (env.AI_PROVIDER === "disabled") {
    return new DisabledProvider();
  }

  return new OllamaProvider();
}
