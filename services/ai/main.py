"""SafeHer AI Service — suspect matching & future NLP/OCR endpoints."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from matching import SuspectRecord, cluster_suspects

app = FastAPI(title="SafeHer AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SuspectInput(BaseModel):
    name: str
    report_id: str
    case_number: str = ""
    location: str = ""


class MatchRequest(BaseModel):
    suspects: list[SuspectInput]
    threshold: float = Field(default=0.72, ge=0.5, le=1.0)


class MatchResponse(BaseModel):
    matches: list[dict]


@app.get("/health")
def health():
    return {"status": "ok", "service": "safeher-ai"}


@app.post("/match-suspects", response_model=MatchResponse)
def match_suspects(req: MatchRequest):
    records = [
        SuspectRecord(
            name=s.name,
            report_id=s.report_id,
            case_number=s.case_number,
            location=s.location,
        )
        for s in req.suspects
        if s.name.strip()
    ]
    clusters = cluster_suspects(records, req.threshold)
    return {
        "matches": [
            {
                "canonicalName": c.canonical_name,
                "confidence": c.confidence,
                "reportCount": c.report_count,
                "locations": c.locations,
                "reports": [
                    {
                        "name": r.name,
                        "reportId": r.report_id,
                        "caseNumber": r.case_number,
                        "location": r.location,
                    }
                    for r in c.reports
                ],
            }
            for c in clusters
        ]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
