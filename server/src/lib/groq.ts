const MODEL_QUIZ = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const MODEL_TUTOR = process.env.GROQ_TUTOR_MODEL || "llama-3.3-70b-versatile";
const WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

export type QuizQuestionType = "mcq" | "fill" | "order";

export type GeneratedQuestion =
  | { type: "mcq"; text: string; options: string[]; correctIndex: number; explanation?: string }
  | { type: "fill"; text: string; blanks: string[]; explanation?: string }
  | { type: "order"; text: string; items: string[]; explanation?: string };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const callGroq = async (body: Record<string, any>, modelLabel: string): Promise<any> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY n'est pas configuré sur le serveur");

  const callOnce = () =>
    fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  let res = await callOnce();

  if (res.status === 429) {
    const retryHeader = res.headers.get("retry-after");
    const retryMs = retryHeader ? Math.min(30_000, Math.ceil(Number(retryHeader) * 1000)) : 0;
    if (retryMs > 0 && retryMs <= 30_000) {
      await sleep(retryMs);
      res = await callOnce();
    }
  }

  if (!res.ok) {
    const txt = await res.text();
    if (res.status === 429) {
      throw new Error(
        `Quota Groq dépassé pour le modèle ${modelLabel}. Réessayez plus tard ou changez de modèle.`
      );
    }
    if (res.status === 401) throw new Error("Clé API Groq invalide ou manquante.");
    throw new Error(`Groq API error ${res.status}: ${txt.slice(0, 300)}`);
  }

  return res.json();
};

const QUIZ_SYSTEM_PROMPT = `Tu es un expert pédagogique francophone. Tu génères des questions de quiz au format JSON strict pour évaluer la compréhension d'une leçon.

Trois types de questions sont possibles :

1) QCM (type: "mcq") — choix multiples
{
  "type": "mcq",
  "text": "énoncé de la question",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "explanation": "justification courte"
}
Règles QCM : exactement 4 options ; une seule bonne réponse ; "correctIndex" entre 0 et 3.

2) À trous (type: "fill") — texte avec lacunes
{
  "type": "fill",
  "text": "Énoncé contenant ___ pour chaque trou (ex: La capitale de la France est ___)",
  "blanks": ["paris"],
  "explanation": "justification courte"
}
Règles à trous : "text" doit contenir un "___" pour CHAQUE trou ; "blanks" liste les réponses attendues dans l'ordre des "___" ; les réponses doivent être des mots ou expressions courts (1-3 mots), insensibles à la casse ; minimum 1 trou.

3) Ordre (type: "order") — remettre des éléments dans le bon ordre
{
  "type": "order",
  "text": "Consigne (ex: Remettez ces étapes dans l'ordre chronologique)",
  "items": ["étape 1", "étape 2", "étape 3", "étape 4"],
  "explanation": "justification courte"
}
Règles ordre : "items" est la liste DANS L'ORDRE CORRECT (ils seront mélangés ensuite pour l'étudiant) ; entre 3 et 6 éléments ; les éléments doivent avoir un ordre objectivement défendable (chronologie, taille, étapes d'un processus, etc.).

Format global (réponse) :
{
  "questions": [ <question1>, <question2>, ... ]
}

Règles impératives :
- Chaque question DOIT avoir un champ "type" parmi "mcq", "fill", "order".
- Énoncés autonomes (sans renvoi à un document externe).
- Toutes les chaînes en FRANÇAIS.
- Aucun texte hors du JSON.`;

const buildQuizUserPrompt = (params: {
  courseTitle: string;
  courseDescription?: string;
  lessonTitle: string;
  lessonContent?: string;
  lessonKind: string;
  count: number;
  types: QuizQuestionType[];
}) => {
  const ctx = [
    `Cours : ${params.courseTitle}`,
    params.courseDescription ? `Description du cours : ${params.courseDescription}` : "",
    `Leçon : ${params.lessonTitle}`,
    `Type de leçon : ${params.lessonKind}`,
    params.lessonContent ? `\nContenu de la leçon :\n${params.lessonContent}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const typeLabel = (t: QuizQuestionType) =>
    t === "mcq" ? "QCM (choix multiples)" : t === "fill" ? "à trous" : "remise en ordre";
  const typesStr = params.types.map(typeLabel).join(", ");
  const typesJson = JSON.stringify(params.types);

  const distribution =
    params.types.length === 1
      ? `Toutes les questions doivent être de type "${params.types[0]}".`
      : `Mélange variant les types autorisés (${typesStr}). Répartis-les de façon équilibrée. N'utilise AUCUN autre type que ceux de cette liste : ${typesJson}.`;

  return `Génère ${params.count} questions en français, variées (factuel, application, analyse), de niveau étudiant.

${distribution}

${ctx}

Réponds UNIQUEMENT avec le JSON décrit dans le système, rien d'autre.`;
};

const validateGeneratedQuestion = (q: any): GeneratedQuestion | null => {
  if (!q || typeof q.text !== "string" || !q.text.trim()) return null;
  const explanation = typeof q.explanation === "string" ? q.explanation : undefined;

  if (q.type === "mcq") {
    if (
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.options.every((o: any) => typeof o === "string" && o.trim()) &&
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex < q.options.length
    ) {
      return {
        type: "mcq",
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation,
      };
    }
    return null;
  }

  if (q.type === "fill") {
    if (
      typeof q.text === "string" &&
      q.text.includes("___") &&
      Array.isArray(q.blanks) &&
      q.blanks.length >= 1 &&
      q.blanks.every((b: any) => typeof b === "string" && b.trim())
    ) {
      const blankCount = (q.text.match(/___/g) || []).length;
      if (blankCount !== q.blanks.length) return null;
      return { type: "fill", text: q.text, blanks: q.blanks, explanation };
    }
    return null;
  }

  if (q.type === "order") {
    if (
      Array.isArray(q.items) &&
      q.items.length >= 2 &&
      q.items.every((it: any) => typeof it === "string" && it.trim())
    ) {
      return { type: "order", text: q.text, items: q.items, explanation };
    }
    return null;
  }

  return null;
};

export const generateQuizQuestions = async (params: {
  courseTitle: string;
  courseDescription?: string;
  lessonTitle: string;
  lessonContent?: string;
  lessonKind: string;
  count: number;
  types?: QuizQuestionType[];
}): Promise<GeneratedQuestion[]> => {
  const allowed: QuizQuestionType[] =
    params.types && params.types.length > 0 ? params.types : ["mcq"];

  const data = await callGroq(
    {
      model: MODEL_QUIZ,
      messages: [
        { role: "system", content: QUIZ_SYSTEM_PROMPT },
        { role: "user", content: buildQuizUserPrompt({ ...params, types: allowed }) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    },
    MODEL_QUIZ
  );

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Réponse Groq vide");

  let parsed: { questions: any[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Réponse Groq non analysable");
  }

  const allowedSet = new Set(allowed);
  const questions = (parsed.questions || [])
    .map(validateGeneratedQuestion)
    .filter((q): q is GeneratedQuestion => q !== null && allowedSet.has(q.type));

  if (!questions.length) throw new Error("Aucune question valide générée");
  return questions;
};

const buildTutorSystemPrompt = (params: {
  courseTitle: string;
  lessonTitle: string;
  lessonContent?: string;
}) => `Tu es un tuteur pédagogique francophone bienveillant. Tu aides un étudiant à comprendre une leçon précise.

Cours : ${params.courseTitle}
Leçon : ${params.lessonTitle}
${params.lessonContent ? `\nContenu de la leçon :\n${params.lessonContent}\n` : ""}
Règles :
- Réponds toujours en FRANÇAIS.
- Base-toi prioritairement sur le contenu de la leçon ci-dessus.
- Si la question dépasse la leçon, indique-le brièvement puis donne une réponse générale courte.
- Sois concis (2-5 phrases) sauf si l'étudiant demande des détails.
- Donne des exemples concrets quand c'est utile.
- Encourage l'étudiant. Ne donne jamais directement les réponses d'un quiz.
- Tu peux utiliser du Markdown (gras, listes, code).`;

export const transcribeAudio = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY n'est pas configuré sur le serveur");
  if (buffer.length > WHISPER_MAX_BYTES) {
    throw new Error(
      `Fichier trop volumineux pour la transcription (max 25 Mo, reçu ${Math.round(
        buffer.length / 1024 / 1024
      )} Mo)`
    );
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimetype }), originalName);
  form.append("model", WHISPER_MODEL);
  form.append("response_format", "json");

  const res = await fetch(WHISPER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text();
    if (res.status === 429) {
      throw new Error("Quota Whisper Groq dépassé. Réessayez plus tard.");
    }
    if (res.status === 401) throw new Error("Clé API Groq invalide.");
    throw new Error(`Whisper API error ${res.status}: ${txt.slice(0, 300)}`);
  }

  const data = (await res.json()) as { text?: string };
  return (data.text || "").trim();
};

export const chatWithTutor = async (params: {
  courseTitle: string;
  lessonTitle: string;
  lessonContent?: string;
  history: ChatMessage[];
}): Promise<string> => {
  const data = await callGroq(
    {
      model: MODEL_TUTOR,
      messages: [
        { role: "system", content: buildTutorSystemPrompt(params) },
        ...params.history.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.5,
      max_tokens: 800,
    },
    MODEL_TUTOR
  );

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Réponse vide du tuteur");
  return reply;
};

const FLASHCARDS_SYSTEM_PROMPT = `Tu es un expert pédagogique francophone. Tu produis des flashcards d'étude au format JSON strict à partir d'une leçon.

Format JSON requis :
{
  "flashcards": [
    {
      "front": "question, terme ou concept (côté recto, court)",
      "back": "réponse, définition ou explication concise (côté verso)"
    }
  ]
}

Règles :
- 8 à 15 flashcards selon la richesse de la leçon.
- "front" : court (1 phrase max, idéalement une question ou un terme).
- "back" : 1 à 3 phrases concises.
- Couvre les définitions, concepts clés, exemples, et faits importants.
- Toutes les chaînes en FRANÇAIS.
- Aucun texte hors du JSON.`;

export const generateFlashcards = async (params: {
  courseTitle: string;
  lessonTitle: string;
  lessonContent: string;
}): Promise<GeneratedFlashcard[]> => {
  const userPrompt = `Génère des flashcards d'étude à partir de cette leçon.

Cours : ${params.courseTitle}
Leçon : ${params.lessonTitle}

Contenu de la leçon :
${params.lessonContent}

Réponds UNIQUEMENT avec le JSON décrit dans le système, rien d'autre.`;

  const data = await callGroq(
    {
      model: MODEL_QUIZ,
      messages: [
        { role: "system", content: FLASHCARDS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    },
    MODEL_QUIZ
  );

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Réponse Groq vide");

  let parsed: { flashcards: GeneratedFlashcard[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Réponse Groq non analysable");
  }

  const cards = (parsed.flashcards || []).filter(
    (c) => c && typeof c.front === "string" && typeof c.back === "string" && c.front.trim() && c.back.trim()
  );

  if (!cards.length) throw new Error("Aucune flashcard valide générée");
  return cards;
};
