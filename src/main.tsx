import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import "./index.css";
import { ApiError } from "./api/client";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { SessionGate } from "./components/SessionGate";

// El dashboard (y con él los gráficos) solo se descarga una vez iniciada la sesión.
const App = lazy(() => import("./App").then((m) => ({ default: m.App })));

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

function Root() {
  const { status } = useAuth();
  if (status === "anonymous") return <LoginPage />;
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
