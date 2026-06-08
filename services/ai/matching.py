"""Suspect name matching using fuzzy string similarity."""

from __future__ import annotations

from dataclasses import dataclass
from difflib import SequenceMatcher


def _norm(name: str) -> str:
    return " ".join(name.lower().strip().split())


def _similarity(a: str, b: str) -> float:
    na, nb = _norm(a), _norm(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    if na in nb or nb in na:
        return max(0.85, SequenceMatcher(None, na, nb).ratio())
    return SequenceMatcher(None, na, nb).ratio()


@dataclass
class SuspectRecord:
    name: str
    report_id: str
    case_number: str
    location: str


@dataclass
class SuspectCluster:
    canonical_name: str
    confidence: float
    report_count: int
    reports: list[SuspectRecord]
    locations: list[str]


def cluster_suspects(
    records: list[SuspectRecord],
    threshold: float = 0.72,
) -> list[SuspectCluster]:
    clusters: list[list[SuspectRecord]] = []

    for record in records:
        placed = False
        for cluster in clusters:
            if _similarity(record.name, cluster[0].name) >= threshold:
                cluster.append(record)
                placed = True
                break
        if not placed:
            clusters.append([record])

    result: list[SuspectCluster] = []
    for cluster in clusters:
        if len(cluster) < 2:
            continue
        canonical = max(cluster, key=lambda r: len(r.name)).name
        sims = [_similarity(canonical, r.name) for r in cluster]
        confidence = round(sum(sims) / len(sims) * 100, 1)
        locations = sorted({r.location for r in cluster if r.location})
        result.append(
            SuspectCluster(
                canonical_name=canonical,
                confidence=confidence,
                report_count=len(cluster),
                reports=cluster,
                locations=locations,
            )
        )

    result.sort(key=lambda c: (-c.report_count, -c.confidence))
    return result
