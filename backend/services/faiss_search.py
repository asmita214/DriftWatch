import faiss
import numpy as np
import json
import os
import sys
from sentence_transformers import SentenceTransformer
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase

# load the sentence transformer model
# all-MiniLM-L6-v2 is small, fast, free, and very good
# it converts any text into a 384-dimensional vector
model = SentenceTransformer('all-MiniLM-L6-v2')

# FAISS index file path — stored locally
FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "drift_index.faiss")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "drift_metadata.json")


def load_or_create_index():
    """
    Loads existing FAISS index from disk if it exists.
    If not, creates a fresh empty one.
    
    What is a FAISS index?
    Think of it like a special database optimized for finding
    similar items by meaning rather than exact match.
    dimension=384 because that's the size of vectors
    our sentence transformer produces.
    """
    dimension = 384

    if os.path.exists(FAISS_INDEX_PATH):
        index = faiss.read_index(FAISS_INDEX_PATH)
        with open(METADATA_PATH, "r") as f:
            metadata = json.load(f)
    else:
        # FlatL2 = exact search using L2 (euclidean) distance
        # good for small datasets, perfectly accurate
        index = faiss.IndexFlatL2(dimension)
        metadata = []

    return index, metadata


def save_index(index, metadata):
    """
    Saves the FAISS index and metadata to disk
    so it persists between server restarts.
    """
    faiss.write_index(index, FAISS_INDEX_PATH)
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f)


def drift_event_to_text(drift_report: dict, cluster_summary: str = "", shap_summary: str = "") -> str:
    """
    Converts a drift event into a text description
    that can be encoded into a vector.
    
    Why text? Because sentence transformers work on text.
    We describe the drift in words, encode those words
    into a vector, and store that vector in FAISS.
    Later when a new drift happens we describe it the same way,
    encode it, and find the most similar past vector.
    """
    drifted_features = drift_report.get("drifted_features", [])
    severity = drift_report.get("overall_severity", "unknown")

    text = f"Drift severity {severity}. "
    text += f"Drifted features: {', '.join(drifted_features)}. "

    if shap_summary:
        text += f"Root cause: {shap_summary}. "

    if cluster_summary:
        text += f"New user segments: {cluster_summary}. "

    return text


def add_drift_event_to_index(drift_report: dict, drift_event_id: str,
                              cluster_summary: str = "", shap_summary: str = ""):
    """
    Adds a new drift event to the FAISS index.
    Called every time a new drift event is detected and stored.
    
    Step by step:
    1. Convert drift event to text description
    2. Encode text into a 384-dim vector using sentence transformer
    3. Add vector to FAISS index
    4. Save metadata (event id, description, date) alongside it
    5. Save index to disk
    """
    index, metadata = load_or_create_index()

    # convert drift event to text
    text = drift_event_to_text(drift_report, cluster_summary, shap_summary)

    # encode text to vector
    vector = model.encode([text])
    vector = np.array(vector, dtype=np.float32)

    # add to FAISS
    index.add(vector)

    # store metadata so we can retrieve details when a match is found
    metadata.append({
        "drift_event_id": drift_event_id,
        "text": text,
        "severity": drift_report.get("overall_severity", "unknown"),
        "drifted_features": drift_report.get("drifted_features", []),
        "added_at": datetime.utcnow().isoformat()
    })

    save_index(index, metadata)
    return {"message": "Drift event added to FAISS index", "total_indexed": index.ntotal}


def find_similar_drift_events(drift_report: dict, top_k: int = 3,
                               cluster_summary: str = "", shap_summary: str = ""):
    """
    Given a new drift event, finds the most similar past drift events.
    
    Step by step:
    1. Convert new drift event to text
    2. Encode to vector
    3. Search FAISS for top_k most similar vectors
    4. Return matching past events with similarity scores
    5. If strong match found, suggest fix based on past resolution
    """
    index, metadata = load_or_create_index()

    if index.ntotal == 0:
        return {
            "similar_events_found": 0,
            "message": "No past drift events in memory yet. This is the first recorded event.",
            "similar_events": []
        }

    # encode the new drift event
    text = drift_event_to_text(drift_report, cluster_summary, shap_summary)
    vector = model.encode([text])
    vector = np.array(vector, dtype=np.float32)

    # search — returns distances and indices of top_k matches
    # lower distance = more similar
    k = min(top_k, index.ntotal)
    distances, indices = index.search(vector, k)

    similar_events = []
    for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
        if idx == -1:
            continue

        # convert L2 distance to similarity percentage
        # distance 0 = identical = 100% similar
        similarity_pct = round(max(0, 100 - float(dist) * 20), 1)

        event_meta = metadata[idx]
        similar_events.append({
            "rank": i + 1,
            "similarity_percentage": similarity_pct,
            "drift_event_id": event_meta["drift_event_id"],
            "description": event_meta["text"],
            "severity": event_meta["severity"],
            "drifted_features": event_meta["drifted_features"],
            "recorded_at": event_meta["added_at"]
        })

    # generate recommendation based on best match
    recommendation = ""
    if similar_events and similar_events[0]["similarity_percentage"] > 70:
        best = similar_events[0]
        recommendation = f"This drift is {best['similarity_percentage']}% similar to a past event affecting {', '.join(best['drifted_features'])}. Check how that event was resolved and apply the same fix."
    else:
        recommendation = "No strongly similar past drift events found. This may be a new type of drift. Investigate the drifted features manually."

    return {
        "similar_events_found": len(similar_events),
        "current_drift_description": text,
        "similar_events": similar_events,
        "recommendation": recommendation
    }