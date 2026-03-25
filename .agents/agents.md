# GestorPH Votaciones — Contexto del Proyecto

## Información General

| Dato | Valor |
|---|---|
| **Nombre** | GestorPH Asambleas / Votaciones |
| **Versión** | 2.0.0 (ver `constants.tsx → APP_VERSION`) |
| **Stack** | Vite + React 19 + TypeScript |
| **Dominio producción** | https://votaciones.gestorph.com |
| **Firebase Hosting URL** | https://gestorph-votaciones.web.app |
| **Firebase Project ID** | `gestorph-votaciones` |
| **Cuenta Firebase** | `gerencia@grupoiart.com` |
| **Repositorio** | `github.com/gerencia-lab/votaciones_gestorph.git` |
| **Rama principal** | `main` |

---

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev
# → http://localhost:3010
```

| Config | Valor | Archivo |
|---|---|---|
| Puerto dev | `3010` | `vite.config.ts` → `server.port` |
| Puerto preview | `8080` | `vite.config.ts` → `preview.port` |
| Build output | `dist/` | `vite.config.ts` → `build.outDir` |

---

## Despliegue a Producción

El despliegue se hace a **Firebase Hosting**. No usar Cloud Run.

```bash
# 1. Compilar el proyecto
npm run build

# 2. Desplegar a Firebase Hosting
firebase deploy --only hosting --project gestorph-votaciones
```

### Pre-requisitos de despliegue
- Firebase CLI instalado: `npm install -g firebase-tools`
- Autenticado con la cuenta correcta: `firebase login` (usar `gerencia@grupoiart.com`)
- Proyecto configurado en `.firebaserc` → `gestorph-votaciones`
- `firebase.json` configura hosting con `public: "dist"` y rewrite SPA a `index.html`

### Notas importantes
- ⚠️ **NO desplegar con `gcloud run deploy`** — eso crea un servicio Cloud Run innecesario.
- La carpeta `dist/` está en `.gitignore`, así que **siempre ejecutar `npm run build` antes de `firebase deploy`**.
- El script `deploy:pro` en `package.json` apunta a Cloud Run (legacy), **no usarlo**.

---

## Estructura del Proyecto

```
├── App.tsx                  # Componente raíz con routing por views
├── index.tsx                # Entry point React
├── index.html               # HTML template (Vite)
├── index.css                # Estilos globales
├── constants.tsx            # Versión, dominio producción, datos mock, plantillas preguntas
├── types.ts                 # Interfaces TypeScript (Copropiedad, Asamblea, Unidad, etc.)
├── firebaseConfig.ts        # Configuración Firebase (auth, db, storage, functions)
├── server.js                # Servidor Express para servir dist/ (solo para Cloud Run, no se usa actualmente)
├── vite.config.ts           # Configuración Vite (puertos, build, aliases)
├── firebase.json            # Config Firebase Hosting + Firestore rules + Storage rules
├── .firebaserc              # Alias de proyecto Firebase
│
├── store/
│   └── AssemblyContext.tsx   # Context principal: toda la lógica de negocio y CRUD Firestore
│
├── components/
│   ├── Home.tsx              # Pantalla de login por token (votante)
│   ├── Auth.tsx              # Pantalla de login admin
│   ├── admin/
│   │   ├── AdminVotacionesTab.tsx   # Panel de votaciones (preguntas, votos, resultados)
│   │   ├── AdminAsistenciaTab.tsx   # Panel de asistencia y credenciales
│   │   ├── AdminUnidadesTab.tsx     # CRUD de unidades
│   │   └── ...
│   └── voter/
│       └── VoterPanel.tsx           # Panel del votante
│
└── dist/                    # Build de producción (generado por `npm run build`)
```

---

## Firebase (Firestore)

### Colecciones principales
| Colección | Descripción |
|---|---|
| `copropiedades` | Conjuntos/edificios registrados |
| `asambleas` | Asambleas con estado (PROGRAMADA, EN_CURSO, FINALIZADA) |
| `unidades` | Apartamentos/locales de cada copropiedad |
| `asambleistas` | Personas registradas para votar (propietarios o apoderados) |
| `preguntas` | Preguntas de votación con opciones |
| `votos` | Votos emitidos por asambleístas |
| `phAdmins` | Administradores de propiedad horizontal |
| `superAdmins` | Super administradores de la plataforma |
| `plantillasPreguntas` | Plantillas de preguntas reutilizables |
| `loyaltyTransactions` | Transacciones del sistema de puntos |
| `systemSettings` | Configuración global (ej: reglas de lealtad) |

### Variables de entorno
Las claves de Firebase y Gemini AI se configuran en `.env.local`:
- `VITE_GEMINI_API_KEY` — API key de Google Gemini para Acta Inteligente

---

## Funcionalidades clave
- **Votación en tiempo real** con Firebase Realtime listeners (onSnapshot)
- **Resultados por coeficiente o nominal**
- **Generación masiva de credenciales** con tokens de acceso
- **Envío de invitaciones por email** vía Cloud Functions (`sendAssemblyToken`)
- **Acta Inteligente** con IA (Gemini) a partir de audio
- **Sistema de lealtad** con puntos para administradores
- **QR codes** para acceso rápido
- **Exportación de resultados** para actas
