import { lazy, StrictMode, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import "./index.css";
import { ApiError } from "./api/client";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { useAuthView } from "./hooks/useAuthView";
import { SessionGate } from "./components/SessionGate";

// El dashboard (y con él los gráficos) solo se descarga una vez iniciada la sesión.
const App = lazy(() => import("./App").then((m) => ({ default: m.App })));
// La portada (con GSAP) y el formulario de acceso se descargan solo si no hay sesión.
const Landing = lazy(() => import("./landing/Landing").then((m) => ({ default: m.Landing })));
const LoginPage = lazy(() => import("./components/LoginPage").then((m) => ({ default: m.LoginPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Con la sesión caducada no tiene sentido reintentar: el 401 lleva al login.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status === 401) && failureCount < 1,
    },
  },
});

/** Sin sesión: portada → inicio de sesión / registro. Con sesión: directo a la app. */
function Visitor() {
  const { view, go } = useAuthView();
  const [prefillEmail, setPrefillEmail] = useState("");

  return (
    <Suspense fallback={<SessionGate state="checking" />}>
      {view === "landing" ? (
        <Landing
          onLogin={() => go("login")}
          onRegister={(email) => {
            setPrefillEmail(email ?? "");
            go("register");
          }}
        />
      ) : (
        <LoginPage
          key={view}
          initialMode={view === "register" ? "register" : "login"}
          initialEmail={prefillEmail}
          onBack={() => go("landing")}
        />
      )}
    </Suspense>
  );
}

function Root() {
  const { status } = useAuth();
  const { clear } = useAuthView();

  // Tras iniciar sesión o registrarse se entra a la app y se limpia el #/login de la URL.
  useEffect(() => {
    if (status === "authenticated") clear();
  }, [status, clear]);

  if (status === "anonymous") return <Visitor />;
  if (status === "authenticated") {
    return (
      <Suspense fallback={<SessionGate state="checking" />}>
        <App />
      </Suspense>
    );
  }
  return <SessionGate state={status} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </QueryClientProvider>
    </MotionConfig>
  </StrictMode>,
);
