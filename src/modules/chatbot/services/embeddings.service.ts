import { pipeline, env, FeatureExtractionPipeline, Tensor } from "@xenova/transformers";

// Optional custom cache directory for Docker / offline production
if (process.env["TRANSFORMERS_CACHE"]) {
  env.cacheDir = process.env["TRANSFORMERS_CACHE"];
}

const MODEL = "Xenova/nomic-embed-text-v1";
let modelPromise: Promise<FeatureExtractionPipeline> | null = null;

function getModel(): Promise<FeatureExtractionPipeline> {
  if (!modelPromise) {
    const pipelineOptions: Record<string, unknown> = {
      quantized: true,
    };

    const embedThreadsStr = process.env["EMBED_THREADS"];
    if (embedThreadsStr) {
      const threads = parseInt(embedThreadsStr, 10);
      if (!isNaN(threads) && threads > 0) {
        pipelineOptions["session_options"] = {
          intraOpNumThreads: threads,
          interOpNumThreads: 1,
        };
      }
    }

    modelPromise = pipeline(
      "feature-extraction",
      MODEL,
      pipelineOptions as Parameters<typeof pipeline>[2],
    ) as Promise<FeatureExtractionPipeline>;
  }
  return modelPromise;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getModel();
  const results: number[][] = [];

  for (const text of texts) {
    const output = (await extractor("search_document: " + text, {
      pooling: "mean",
      normalize: true,
    })) as Tensor;
    results.push(Array.from(output.data as Float32Array));
  }

  return results;
}

export async function embedQuery(text: string): Promise<number[]> {
  const extractor = await getModel();
  const output = (await extractor("search_query: " + text, {
    pooling: "mean",
    normalize: true,
  })) as Tensor;
  return Array.from(output.data as Float32Array);
}
