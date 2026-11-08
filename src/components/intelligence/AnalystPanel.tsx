import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAnalystQuestions, useAskAnalyst } from "../../api/hooks";
import { ApiError } from "../../api/client";
import type { AnalystAnswer } from "../../api/types";
import { useLocation } from "../../location/LocationContext";
import {
  AVAILABILITY_LABELS,
  fallbackExplanation,
  SECTION_LABELS,
  type Tone,
} from "../../lib/intelligence";
import { Badge, Card } from "../ui";

const MAX_QUESTION = 300;

type Entry =
  | { id: number; question: string; status: "pending" }
  | { id: number; question: string; status: "done"; answer: AnalystAnswer }
  | { id: number; question: string; status: "error"; message: string };

const SECTION_TONE: Record<string, Tone> = { datos: "ok", asociacion: "accent", hipotesis: "warn" };

function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    return "Has hecho muchas preguntas en la última hora. Inténtalo de nuevo más tarde.";
  }
  if (err instanceof ApiError) return err.message;
  return "No se pudo contactar con el analista. Revisa tu conexión e inténtalo de nuevo.";
}

function TechnicalDetails({ a }: { a: AnalystAnswer }) {
  return (
    <div className="mt-3 space-y-4 rounded-2xl border border-[var(--color-border)] p-4 text-xs text-[var(--color-text-dim)]">
      {a.evidence.length > 0 && (
        <div>
          <p className="font-medium text-[var(--color-text)]">Datos en que se apoya</p>
          <ul className="mt-1 space-y-0.5">
            {a.evidence.map((e) => (
              <li key={`${e.label}-${e.source}`} className="flex flex-wrap justify-between gap-x-3">
                <span>{e.label}</span>
                <span className="mono text-[var(--color-text)]">
                  {e.value} <span className="text-[var(--color-text-faint)]">· {e.source}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {a.limitations.length > 0 && (
        <div>
          <p className="font-medium text-[var(--color-text)]">Límites a tener en cuenta</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {a.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="font-medium text-[var(--color-text)]">Información disponible para esta ciudad</p>
        <ul className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
          {Object.entries(a.availability).map(([k, ok]) => (
            <li key={k} className="flex items-center gap-1.5">
              <span aria-hidden className={ok ? "text-[var(--color-ok)]" : "text-[var(--color-text-faint)]"}>
                {ok ? "●" : "○"}
              </span>
              {AVAILABILITY_LABELS[k] ?? k}
              <span className="sr-only">{ok ? ": disponible" : ": no disponible"}</span>
            </li>
          ))}
        </ul>
      </div>
      {a.mode === "ai" && (
        <div>
          <p className="font-medium text-[var(--color-text)]">Análisis determinista (sin IA)</p>
          <p className="mt-1 leading-relaxed">{a.deterministic_answer}</p>
        </div>
      )}
      <p className="text-[var(--color-text-faint)]">
        Generado {new Date(a.generated_at).toLocaleString("es-ES")}
        {a.context_as_of ? ` con datos de ${new Date(a.context_as_of).toLocaleString("es-ES")}` : ""}
        {a.model ? ` · modelo ${a.model}` : ""}.
      </p>
    </div>
  );
}

function AnswerCard({ entry }: { entry: Entry }) {
  const [detail, setDetail] = useState(false);
  return (
    <article className="space-y-2" aria-label={`Pregunta: ${entry.question}`}>
      <p className="ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] px-4 py-2 text-sm text-[var(--color-text)]">
        {entry.question}
      </p>

      {entry.status === "pending" && (
        <p className="glass-soft w-fit rounded-2xl rounded-bl-md px-4 py-3 text-sm text-[var(--color-text-dim)]" role="status">
          Analizando los datos de la ciudad…
        </p>
      )}

      {entry.status === "error" && (
        <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-danger)]" role="alert">
          {entry.message}
        </p>
      )}

      {entry.status === "done" && (
        <div className="glass-soft max-w-[96%] rounded-2xl rounded-bl-md px-4 py-3">
          <div className="space-y-2.5">
            {entry.answer.sections.length > 0
              ? entry.answer.sections.map((s, i) => (
                  <p key={i} className="text-sm leading-relaxed text-[var(--color-text)]">
                    {entry.answer.sections.length > 1 && (
                      <span className="mr-2 align-middle">
                        <Badge tone={SECTION_TONE[s.kind] ?? "neutral"}>{SECTION_LABELS[s.kind]}</Badge>
                      </span>
                    )}
                    {s.text}
                  </p>
                ))
              : <p className="text-sm leading-relaxed text-[var(--color-text)]">{entry.answer.answer}</p>}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={entry.answer.mode === "ai" ? "accent" : "neutral"}>
              {entry.answer.mode === "ai" ? "redactado por IA con los datos del sistema" : "análisis determinista con datos reales"}
            </Badge>
            <button
              type="button"
              onClick={() => setDetail((v) => !v)}
              aria-expanded={detail}
              className="rounded-full px-2.5 py-1 text-[11px] text-[var(--color-text-faint)] underline-offset-2 transition-colors hover:text-[var(--color-text)] hover:underline"
            >
              {detail ? "Ocultar detalles técnicos" : "Ver detalles técnicos"}
            </button>
          </div>
          {entry.answer.fallback_reason && (
            <p className="mt-2 text-[11px] text-[var(--color-text-faint)]">
              {fallbackExplanation(entry.answer.fallback_reason)}
            </p>
          )}
          {detail && <TechnicalDetails a={entry.answer} />}
        </div>
      )}
    </article>
  );
}

export function AnalystPanel() {
  const questions = useAnalystQuestions();
  const ask = useAskAnalyst();
  const slug = useLocation().current?.slug ?? null;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const nextId = useRef(1);
  // La ciudad activa «ahora»: las respuestas que llegan tarde se comparan contra esta, no contra la del cierre.
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const endRef = useRef<HTMLDivElement>(null);

  // Al cambiar de ciudad la conversación deja de aplicar: las respuestas hablaban de otra ciudad.
  useEffect(() => {
    setEntries([]);
    setText("");
  }, [slug]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [entries]);

  const busy = entries.some((e) => e.status === "pending");

  const submit = async (input: { question?: string; intent?: string }, shown: string) => {
    if (busy) return;
    const id = nextId.current++;
    const asked = slug;
    setEntries((prev) => [...prev, { id, question: shown, status: "pending" }]);
    try {
      const answer = await ask.mutateAsync(input);
      // Si mientras tanto se cambió de ciudad, la respuesta ya no corresponde a lo que se ve.
      if (asked !== slugRef.current) return;
      setEntries((prev) => prev.map((e) => (e.id === id ? { id, question: shown, status: "done", answer } : e)));
    } catch (err) {
      if (asked !== slugRef.current) return;
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { id, question: shown, status: "error", message: errorMessage(err) } : e)),
      );
    }
  };

  const send = () => {
    const q = text.trim();
    if (!q) return;
    setText("");
    void submit({ question: q }, q);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Card
      title="Pregúntale a Weather Intelligence"
      subtitle="Respuestas basadas solo en los datos calculados para esta ciudad: sin inventar cifras ni alertas"
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Preguntas sugeridas">
        {(questions.data ?? []).map((q) => (
          <button
            key={q.id}
            type="button"
            disabled={busy}
            onClick={() => void submit({ intent: q.id }, q.text)}
            className="glass-soft rounded-full px-3.5 py-1.5 text-left text-xs text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
          >
            {q.text}
          </button>
        ))}
        {questions.isLoading && <span className="text-xs text-[var(--color-text-faint)]">Cargando preguntas sugeridas…</span>}
        {questions.error && (
          <button
            type="button"
            onClick={() => void submit({ intent: "overview" }, "Resumen de la situación")}
            disabled={busy}
            className="glass-soft rounded-full px-3.5 py-1.5 text-xs text-[var(--color-text-dim)]"
          >
            Resumen de la situación
          </button>
        )}
      </div>

      <div
        className="mt-5 max-h-[60vh] space-y-5 overflow-y-auto pr-1"
        aria-live="polite"
        aria-relevant="additions"
      >
        {entries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-center text-sm text-[var(--color-text-faint)]">
            Elige una pregunta o escribe la tuya. Si la IA no está disponible, recibirás igualmente
            un análisis hecho con los datos reales del sistema.
          </p>
        ) : (
          entries.map((e) => <AnswerCard key={e.id} entry={e} />)
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="analyst-question" className="sr-only">
            Tu pregunta sobre el tiempo en esta ciudad
          </label>
          <textarea
            id="analyst-question"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_QUESTION))}
            onKeyDown={onKeyDown}
            rows={2}
            maxLength={MAX_QUESTION}
            placeholder="Por ejemplo: ¿Es normal esta humedad para la época?"
            className="glass-soft w-full resize-none rounded-2xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline focus:outline-2 focus:outline-[var(--color-accent)]"
          />
          <p className="mt-1 text-[11px] text-[var(--color-text-faint)]" aria-hidden>
            {text.length}/{MAX_QUESTION} · Enter envía, Shift+Enter salto de línea
          </p>
        </div>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="mb-5 shrink-0 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
        >
          Preguntar
        </button>
      </form>
    </Card>
  );
}
