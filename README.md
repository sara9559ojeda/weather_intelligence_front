# Weather Intelligence — Frontend

Dashboard meteorológico inmersivo de **Weather Intelligence**, la plataforma de
minería de datos, Machine Learning e IA para el análisis meteorológico de
Madrid-Barajas (proyecto final universitario, metodología CRISP-ML(Q)).

Backend (API FastAPI, modelos de ML, base de datos y documentación académica):
[sara9559ojeda/wheather_intelligence](https://github.com/sara9559ojeda/wheather_intelligence)

## Stack

- React 18 + TypeScript + Vite 6
- Tailwind CSS 4
- TanStack Query (datos) + Server-Sent Events (actualizaciones en vivo)
- Recharts (gráficos), `motion` (animaciones de interfaz), tsParticles (partículas del fondo)
- Nginx en producción (sirve la SPA y hace de proxy a la API)

## Desarrollo

Requiere el backend corriendo en `http://localhost:8000` (Vite redirige `/api` allí).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # comprobación de tipos + build de producción en dist/
```

## Producción en Vercel

En Vercel no hay Nginx, así que el frontend llama directamente a la API pública
del backend. Se configura con una variable de entorno **de build**:

| Variable       | Ejemplo                                           |
|----------------|---------------------------------------------------|
| `VITE_API_URL` | `https://backend-production-0ae18.up.railway.app` |

El backend debe incluir el dominio de Vercel en `BACKEND_CORS_ORIGINS`.
Sin `VITE_API_URL` el frontend usa la ruta relativa `/api` (desarrollo y Docker).

## Producción (Docker)

La imagen construye la SPA y la sirve con Nginx. Dos variables de entorno, leídas
al arrancar el contenedor:

| Variable      | Por defecto            | Uso                                   |
|---------------|------------------------|---------------------------------------|
| `PORT`        | `80`                   | Puerto en el que escucha Nginx        |
| `BACKEND_URL` | `http://backend:8000`  | Dirección interna de la API (`/api/`) |

```bash
docker build -t weather-intelligence-frontend .
docker run -p 5173:80 -e BACKEND_URL=http://host.docker.internal:8000 weather-intelligence-frontend
```

Para levantar todo el sistema junto (base de datos + API + dashboard), clona este
repo dentro de la carpeta `frontend/` del repo del backend y usa su
`docker-compose.yml`.

## Estructura

```
src/
  api/          tipos de la API, cliente HTTP y hooks de TanStack Query
  hooks/        useSSE (tiempo real) y useTheme (claro/oscuro)
  lib/          formato de números/fechas e interpretación de weather_code
  components/   fondo meteorológico, héroe, pronóstico y paneles de análisis
  App.tsx       composición del dashboard
```

Datos: Open-Meteo (ERA5 + Forecast) y Meteostat, CC BY 4.0. Las predicciones no
están garantizadas.
