import { OllamaEmbeddings } from "@langchain/ollama";

let embeddingsInstance: OllamaEmbeddings | null = null;

function getEmbeddingsModel(): OllamaEmbeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: process.env["OLLAMA_BASE_URL"] ?? "http://localhost:11434",
    });
  }
  return embeddingsInstance;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingsModel();
  return model.embedDocuments(texts);
}

export async function embedQuery(text: string): Promise<number[]> {
  const model = getEmbeddingsModel();
  return model.embedQuery(text);
}
