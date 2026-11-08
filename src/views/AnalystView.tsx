import { AnalystPanel } from "../components/intelligence/AnalystPanel";

/** Analista: preguntas en lenguaje natural respondidas solo con los datos de la ciudad activa. */
export function AnalystView() {
  return (
    <div className="mx-auto max-w-3xl">
      <AnalystPanel />
    </div>
  );
}
