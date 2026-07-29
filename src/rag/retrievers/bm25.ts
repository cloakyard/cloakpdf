/**
 * Local Okapi BM25 sparse retriever.
 *
 * BM25 catches the queries dense embeddings miss: exact terms, rare proper
 * nouns, IDs, dates, and any keyword the embedder under-weighs. Paired with the
 * dense retriever through Reciprocal Rank Fusion, it gives better recall than
 * either retriever alone on real-world PDFs.
 *
 * This implementation intentionally lives in CloakPDF. LangChain sunset the
 * deprecated `@langchain/community` package without publishing a dedicated BM25
 * successor, and its migration guidance recommends direct application code for
 * small integrations that have no standalone package. The retriever still
 * extends LangChain Core's `BaseRetriever`, so the hybrid/RAG seam is unchanged.
 *
 * Tokenisation is case-insensitive and term-based. That fixes both historical
 * upstream failure modes: capitalised names remain searchable, and short query
 * terms cannot score as accidental substrings inside unrelated words.
 */
import type { Document } from "@langchain/core/documents";
import {
  type BaseRetriever,
  BaseRetriever as BaseRetrieverClass,
} from "@langchain/core/retrievers";
import type { ChunkMetadata } from "../chunking.ts";

export interface Bm25RetrieverOptions {
  /** Chunk documents (page metadata preserved). */
  documents: Document<ChunkMetadata>[];
  /** Top-k for retrieval. Default 20 — the hybrid layer trims further. */
  k?: number;
}

const K1 = 1.2;
const B = 0.75;
const QUERY_STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "how",
  "in",
  "is",
  "me",
  "of",
  "on",
  "or",
  "please",
  "should",
  "tell",
  "that",
  "the",
  "this",
  "to",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "would",
]);

/** Unicode word tokens; punctuation is a boundary, not part of a term. */
function tokenize(text: string): string[] {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];
}

function tokenizeQuery(query: string): string[] {
  const tokens = tokenize(query);
  const meaningful = tokens.filter((token) => !QUERY_STOP_WORDS.has(token));
  return meaningful.length > 0 ? meaningful : tokens;
}

interface IndexedDocument {
  document: Document<ChunkMetadata>;
  length: number;
  termFrequency: Map<string, number>;
  ordinal: number;
}

class CloakPdfBm25Retriever extends BaseRetrieverClass {
  static lc_name(): string {
    return "CloakPdfBm25Retriever";
  }

  lc_namespace = ["cloakpdf", "rag", "retrievers", "bm25"];

  private readonly indexed: IndexedDocument[];
  private readonly documentFrequency: Map<string, number>;
  private readonly averageDocumentLength: number;
  private readonly k: number;

  constructor(documents: Document<ChunkMetadata>[], k: number) {
    super();
    this.k = Math.max(0, Math.floor(k));
    this.documentFrequency = new Map();
    this.indexed = documents.map((document, ordinal) => {
      const tokens = tokenize(document.pageContent);
      const termFrequency = new Map<string, number>();
      for (const token of tokens) {
        termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1);
      }
      for (const token of termFrequency.keys()) {
        this.documentFrequency.set(token, (this.documentFrequency.get(token) ?? 0) + 1);
      }
      return { document, length: tokens.length, termFrequency, ordinal };
    });
    this.averageDocumentLength =
      this.indexed.length === 0
        ? 0
        : this.indexed.reduce((sum, item) => sum + item.length, 0) / this.indexed.length;
  }

  async _getRelevantDocuments(query: string): Promise<Document<ChunkMetadata>[]> {
    const queryTerms = tokenizeQuery(query);
    if (this.k === 0 || this.indexed.length === 0) return [];

    const corpusSize = this.indexed.length;
    const averageLength = this.averageDocumentLength || 1;
    return this.indexed
      .map((item) => {
        let score = 0;
        for (const term of queryTerms) {
          const frequency = item.termFrequency.get(term) ?? 0;
          if (frequency === 0) continue;

          const documentsWithTerm = this.documentFrequency.get(term) ?? 0;
          const inverseDocumentFrequency = Math.log(
            (corpusSize - documentsWithTerm + 0.5) / (documentsWithTerm + 0.5) + 1,
          );
          const lengthNormalisation = frequency + K1 * (1 - B + (B * item.length) / averageLength);
          score += inverseDocumentFrequency * ((frequency * (K1 + 1)) / lengthNormalisation);
        }
        return { ...item, score };
      })
      .sort((left, right) => right.score - left.score || left.ordinal - right.ordinal)
      .slice(0, this.k)
      .map((item) => item.document);
  }
}

export function buildBm25Retriever(options: Bm25RetrieverOptions): BaseRetriever {
  return new CloakPdfBm25Retriever(options.documents, options.k ?? 20);
}
