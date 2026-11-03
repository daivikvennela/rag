"""Offline ETL: Kaggle financial news -> clean -> embed -> ChromaDB + corpus file.

Ported from Main.ipynb (cells 26, 28, 33, 34, 35). Idempotent: the Chroma
collection is cleared and rebuilt on every run so re-ingesting never leaves
stale vectors.

Run:
    cd backend && python ingest.py
"""

from __future__ import annotations

import os

import chromadb
import pandas as pd

from app import config


def extract() -> pd.DataFrame:
    """Download the Kaggle dataset and load the JSON into a DataFrame."""
    import kagglehub

    path = kagglehub.dataset_download(config.KAGGLE_DATASET)
    print("Dataset path:", path)
    print("Files:", os.listdir(path))
    df = pd.read_json(os.path.join(path, config.KAGGLE_FILE))
    print(f"Loaded {len(df)} raw records with {df.shape[1]} columns")
    return df


def transform(df: pd.DataFrame) -> pd.DataFrame:
    """Clean exactly as the notebook: drop columns/NA, dedupe, parse dates,
    flatten publisher, and build the combined title+description text field."""
    df_clean = df.copy()

    # Drop mostly-null / unused columns (ignore if already absent)
    df_clean = df_clean.drop(columns=["amp_url", "image_url"], errors="ignore")

    df_clean = df_clean.dropna(subset=["title", "description"])
    df_clean = df_clean.drop_duplicates(subset="title", keep="first")

    df_clean["published_utc"] = pd.to_datetime(
        df_clean["published_utc"], errors="coerce", utc=True
    )
    df_clean = df_clean.dropna(subset=["published_utc"])

    # Chroma metadata only accepts scalars: keep just the publisher name
    df_clean["publisher"] = df_clean["publisher"].apply(
        lambda p: p.get("name") if isinstance(p, dict) else p
    )

    # Combine title + description into the embedded text
    df_clean["text"] = (
        df_clean["title"].fillna("") + " " + df_clean["description"].fillna("")
    )

    df_clean = df_clean.reset_index(drop=True)
    print("Rows after cleaning:", len(df_clean))
    return df_clean


def embed(texts: list[str]):
    from sentence_transformers import SentenceTransformer

    print(f"Embedding {len(texts)} texts with {config.EMBED_MODEL}...")
    model = SentenceTransformer(config.EMBED_MODEL)
    embeddings = model.encode(
        texts,
        batch_size=config.ENCODE_BATCH,
        show_progress_bar=True,
        convert_to_numpy=True,
    )
    print("Embeddings shape:", embeddings.shape)
    return embeddings


def load(df_clean: pd.DataFrame, embeddings) -> None:
    """Upsert into a freshly recreated Chroma collection and write the corpus file."""
    texts = df_clean["text"].tolist()
    n_docs = len(texts)

    config.CHROMA_PATH.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(config.CHROMA_PATH))

    # Idempotent: drop any existing collection before rebuilding
    try:
        client.delete_collection(config.COLLECTION_NAME)
        print(f"Deleted existing collection '{config.COLLECTION_NAME}'")
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=config.COLLECTION_NAME,
        metadata=config.HNSW_SPACE,
    )

    metadatas = [
        {
            "title": row["title"],
            "publisher": row["publisher"],
            "published_utc": str(row["published_utc"]),
            "article_url": row.get("article_url", ""),
        }
        for _, row in df_clean.iterrows()
    ]

    assert len(df_clean) == n_docs == len(embeddings) == len(metadatas), (
        "Articles, embeddings, and metadata have different lengths."
    )

    batch_size = config.UPSERT_BATCH
    for start in range(0, n_docs, batch_size):
        end = min(start + batch_size, n_docs)
        collection.upsert(
            ids=[str(i) for i in range(start, end)],
            documents=texts[start:end],
            embeddings=embeddings[start:end].tolist(),
            metadatas=metadatas[start:end],
        )
        print(f"Uploaded {end} of {n_docs} articles")

    count = collection.count()
    print("Docs in collection:", count)
    assert count == n_docs, "Collection count does not match the current dataset."

    # Row-aligned corpus for BM25 + document text at query time.
    corpus_cols = ["text", "title", "publisher", "published_utc", "article_url"]
    corpus = df_clean.reindex(columns=corpus_cols).copy()
    corpus["published_utc"] = corpus["published_utc"].astype(str)
    config.CORPUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    corpus.to_parquet(config.CORPUS_PATH, index=False)
    print(f"Wrote corpus ({len(corpus)} rows) to {config.CORPUS_PATH}")


def main() -> None:
    df = extract()
    df_clean = transform(df)
    embeddings = embed(df_clean["text"].tolist())
    load(df_clean, embeddings)
    print("\nIngestion complete.")


if __name__ == "__main__":
    main()
