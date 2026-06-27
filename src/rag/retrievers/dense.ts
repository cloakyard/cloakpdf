/**
 * Dense vector retriever built on the packed-Float32Array
 * {@link PackedVectorStore}.
 *
 * This is a thin factory — the heavy lifting (embedding, packing, cosine search)
 * lives in `vector-store.ts`. We expose `buildDenseRetrieverFromStore` so the
 * index pipeline and the graph stay free of vector-store details and can be
 * tested against any `BaseRetriever`.
 */
import type { BaseRetriever } from "@langchain/core/retrievers";
import { PackedVectorStore } from "../vector-store.ts";

/**
 * Build a dense retriever from a previously cached store snapshot —
 * used when we restore from IndexedDB and don't need to re-embed.
 */
export function buildDenseRetrieverFromStore(store: PackedVectorStore, k = 20): BaseRetriever {
  return store.asRetriever({ k });
}
