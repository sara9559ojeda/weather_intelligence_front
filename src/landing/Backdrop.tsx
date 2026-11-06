/** Fondo común de la portada y del acceso: malla de color fija y manchas que derivan (`data-blob`). */
export function Backdrop() {
  return (
    <>
      <div className="lp-mesh" aria-hidden />
      <div data-blob className="lp-blob left-[8%] top-[18%] h-72 w-72 bg-[#7fcfd0]" aria-hidden />
      <div data-blob className="lp-blob right-[6%] top-[55%] h-80 w-80 bg-[#f6a37f]" aria-hidden />
      <div data-blob className="lp-blob left-[40%] top-[78%] h-64 w-64 bg-[#b9b2ee]" aria-hidden />
    </>
  );
}
