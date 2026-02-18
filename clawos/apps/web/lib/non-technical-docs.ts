import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface NonTechnicalDocMeta {
  id: string;
  slug: string;
  fileName: string;
  title: string;
  summary: string;
}

interface NonTechnicalDocRecord extends NonTechnicalDocMeta {
  available: boolean;
}

interface NonTechnicalDocContent extends NonTechnicalDocRecord {
  content: string;
}

const fallbackMessage = "Contenido no disponible. Revisa docs/non-technical o contacta soporte interno.";

const nonTechnicalDocs: NonTechnicalDocMeta[] = [
  {
    id: "README",
    slug: "readme-no-tecnico",
    fileName: "README.md",
    title: "README no tecnico",
    summary: "Vision general para operar ClawOS sin lenguaje tecnico."
  },
  {
    id: "LINKS-RAPIDOS",
    slug: "links-rapidos",
    fileName: "LINKS-RAPIDOS.md",
    title: "Links rapidos",
    summary: "Accesos directos para abrir cada parte de la operacion."
  },
  {
    id: "01",
    slug: "01-empezar-en-5-min",
    fileName: "01-EMPEZAR-EN-5-MIN.md",
    title: "Empezar en 5 min",
    summary: "Pasos iniciales para arrancar sin friccion."
  },
  {
    id: "02",
    slug: "02-conexiones-wa-email-make-chefos",
    fileName: "02-CONEXIONES-WA-EMAIL-MAKE-CHEFOS.md",
    title: "Conexiones WA + Email + Make + ChefOs",
    summary: "Configuracion base de canales operativos."
  },
  {
    id: "03",
    slug: "03-operacion-diaria-chef",
    fileName: "03-OPERACION-DIARIA-CHEF.md",
    title: "Operacion diaria Chef",
    summary: "Rutina de manana, tarde previa y manejo de incidencias."
  },
  {
    id: "04",
    slug: "04-solucion-de-problemas",
    fileName: "04-SOLUCION-DE-PROBLEMAS.md",
    title: "Solucion de problemas",
    summary: "Guia rapida para recuperar flujo cuando algo falla."
  },
  {
    id: "05",
    slug: "05-checklist-mvp-prod",
    fileName: "05-CHECKLIST-MVP-PROD.md",
    title: "Checklist MVP Produccion",
    summary: "Lista final antes de operar en modo estable."
  }
];

function resolveDocsDirectory(): string {
  const candidates = [
    join(process.cwd(), "../../docs/non-technical"),
    join(process.cwd(), "../docs/non-technical"),
    join(process.cwd(), "docs/non-technical")
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function docsDirectory(): string {
  return resolveDocsDirectory();
}

async function readDoc(fileName: string): Promise<{ content: string; available: boolean }> {
  const fullPath = join(docsDirectory(), fileName);
  if (!existsSync(fullPath)) {
    return {
      content: fallbackMessage,
      available: false
    };
  }

  try {
    const content = await readFile(fullPath, "utf8");
    return {
      content,
      available: true
    };
  } catch {
    return {
      content: fallbackMessage,
      available: false
    };
  }
}

async function getNonTechnicalDocsIndex(): Promise<NonTechnicalDocRecord[]> {
  const checks = await Promise.all(
    nonTechnicalDocs.map(async (doc) => {
      const { available } = await readDoc(doc.fileName);
      return {
        ...doc,
        available
      };
    })
  );

  return checks;
}

async function getDocBySlug(slug: string): Promise<NonTechnicalDocContent | null> {
  const doc = nonTechnicalDocs.find((item) => item.slug === slug);
  if (!doc) {
    return null;
  }

  const content = await readDoc(doc.fileName);
  return {
    ...doc,
    ...content
  };
}

export { fallbackMessage, getNonTechnicalDocsIndex, getDocBySlug };
export type { NonTechnicalDocRecord, NonTechnicalDocContent };
