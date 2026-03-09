import { UserIdentity, HandshakeProtocol } from '../../types';
import { toast } from '@/hooks/use-toast';

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

export class OllamaClient {
  private static instance: OllamaClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = OLLAMA_URL;
  }

  public static getInstance(): OllamaClient {
    if (!OllamaClient.instance) {
      OllamaClient.instance = new OllamaClient();
    }
    return OllamaClient.instance;
  }

  async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3', // Default model
          prompt: userPrompt,
          system: systemPrompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      toast({
        title: "Local AI Offline",
        description: "Could not connect to local Ollama. Private AI features disabled.",
        variant: "destructive",
      });
      return "I'm currently resting, please check back later.";
    }
  }

  async handshake(initiator: UserIdentity, target: UserIdentity): Promise<HandshakeProtocol> {
    const systemPrompt = `You are an AI ambassador for ${initiator.displayName}. Your goal is to introduce them to another identity based on their verified credentials. Be professional and highlight their reputation.`;
    const userPrompt = `Introduce ${initiator.displayName} (DID: ${initiator.did}) to ${target.displayName} (DID: ${target.did}). ${initiator.displayName} has a trust score of ${initiator.reputationScore}.`;

    const message = await this.generateResponse(systemPrompt, userPrompt);

    return {
      id: crypto.randomUUID(),
      initiatorDid: initiator.did,
      targetDid: target.did,
      timestamp: Date.now(),
      message,
      signature: '0x_cryptographic_proof_placeholder', // To be implemented with actual keys
    };
  }
}

export const ollama = OllamaClient.getInstance();
