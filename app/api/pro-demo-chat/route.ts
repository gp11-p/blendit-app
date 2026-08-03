import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getClientKey,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rateLimit";
import { DEMO_EXCHANGES, DEMO_PANTRY, DEMO_PLAN } from "@/lib/proDemoData";

const client = new Anthropic();

const ChatAnswerSchema = z.object({
  found: z.boolean(),
  answer: z.string(),
});

// Il piano, le equivalenze e la dispensa sono dati fissi della demo (non
// personalizzabili come nome/numeri): li teniamo qui lato server invece di
// fidarci di quello che manda il client, così nessuno può far rispondere
// l'AI usando regole diverse da quelle mostrate a schermo.
function buildSystemPrompt(): string {
  const planText = DEMO_PLAN.map(
    (meal) => `${meal.name} (${meal.time}): ${meal.items.join(", ")}`
  ).join("\n");
  const exchangesText = DEMO_EXCHANGES.map(
    (exchange) => `${exchange.from} → ${exchange.to}`
  ).join("\n");
  const pantryText = DEMO_PANTRY.join(", ");

  return `Sei l'assistente Blendit Pro, dentro una demo di vendita mostrata a un nutrizionista. Rispondi a un paziente che segue il piano scritto dal suo professionista. Quello che scrivi deve dimostrare che l'AI resta sempre dentro le regole del professionista, non che decide da sola.

Piano di oggi:
${planText}

Equivalenze già definite dal nutrizionista (l'unica fonte di alternative valide):
${exchangesText}

Cosa il paziente ha già in dispensa:
${pantryText}

Regole assolute:
- Puoi proporre solo un'alternativa che rientra in una delle equivalenze sopra E che il paziente ha davvero in dispensa. Non inventare mai un'equivalenza che il nutrizionista non ha scritto, e non proporre mai di comprare qualcosa.
- Non giudicare mai il paziente e non dare consigli nutrizionali tuoi: il piano e le regole restano del professionista, tu applichi solo quelle già scritte.
- Se la domanda non riguarda una sostituzione dentro questo piano, o se non trovi un'alternativa che rispetta le regole sopra, imposta found=false e dillo onestamente in una frase, invece di inventare.
- Rispondi in italiano, in una o due frasi, come in una chat — non un elenco, non un parere clinico.`;
}

const CHAT_LIMIT = 15;
const CHAT_WINDOW_MS = 10 * 60 * 1000;
const MAX_QUESTION_LENGTH = 200;

export async function POST(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "pro-demo-chat"),
    CHAT_LIMIT,
    CHAT_WINDOW_MS
  );
  if (!limit.allowed) {
    return tooManyRequestsResponse(
      limit,
      "Hai fatto tante domande in poco tempo. Riprova tra qualche minuto."
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurata sul server." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo della richiesta non valido." },
      { status: 400 }
    );
  }

  const { question } = (body ?? {}) as { question?: unknown };

  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json(
      { error: "Scrivi una domanda." },
      { status: 400 }
    );
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: "Domanda troppo lunga." },
      { status: 413 }
    );
  }

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 512,
      output_config: { format: zodOutputFormat(ChatAnswerSchema) },
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: question }],
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      return NextResponse.json(
        { error: "Non sono riuscito a rispondere. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json(message.parsed_output);
  } catch (error) {
    console.error("Errore chat demo pro:", error);
    return NextResponse.json(
      { error: "Non sono riuscito a rispondere. Riprova." },
      { status: 502 }
    );
  }
}
