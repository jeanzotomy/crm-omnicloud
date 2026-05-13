import { AzureOpenAI } from 'openai';
import { TicketPriority } from '@prisma/client';

// Lazy singleton — instanciated only when env vars are present
let _client: AzureOpenAI | null = null;

function getClient(): AzureOpenAI | null {
  if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_KEY) return null;
  if (!_client) {
    _client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_KEY,
      apiVersion: '2024-08-01-preview',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o',
    });
  }
  return _client;
}

export type TicketAnalysis = {
  category: string;
  suggestedPriority: TicketPriority;
  confidence: number;
  summary: string;
  suggestedTags: string[];
};

const CATEGORIES = [
  'Infrastructure', 'Réseau', 'Messagerie', 'Sécurité',
  'Applications', 'Accès & Identité', 'Matériel', 'RH',
  'Facturation', 'Autre',
];

const SYSTEM_PROMPT = `Tu es un assistant ITSM qui analyse les tickets de support.
Pour chaque ticket, retourne un objet JSON avec exactement ces champs :
- category: une des catégories suivantes (exactement) : ${CATEGORIES.join(', ')}
- suggestedPriority: une des valeurs (exactement) : CRITICAL, HIGH, MEDIUM, LOW
- confidence: nombre entre 0 et 1
- summary: résumé du ticket en 1 phrase (max 120 caractères)
- suggestedTags: tableau de 1 à 3 mots-clés pertinents

Règles de priorité :
- CRITICAL : panne totale, sécurité compromise, données perdues, impact production
- HIGH : service dégradé, nombreux utilisateurs impactés, contournement difficile
- MEDIUM : problème partiel, contournement possible, un seul utilisateur impacté
- LOW : demande d'information, amélioration, question générale

Réponds uniquement avec le JSON, sans markdown ni commentaire.`;

export async function analyzeTicket(
  title: string,
  description: string,
): Promise<TicketAnalysis | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Titre : ${title}\n\nDescription : ${description}` },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content;
    if (!text) return null;

    const parsed = JSON.parse(text) as Partial<TicketAnalysis>;

    // Validate the response
    const priority = Object.values(TicketPriority).includes(parsed.suggestedPriority as TicketPriority)
      ? parsed.suggestedPriority as TicketPriority
      : TicketPriority.MEDIUM;

    return {
      category: typeof parsed.category === 'string' ? parsed.category : 'Autre',
      suggestedPriority: priority,
      confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 120) : '',
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags.slice(0, 3) : [],
    };
  } catch {
    return null;
  }
}
