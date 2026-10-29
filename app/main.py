import asyncio
import json
import logging
import html

from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from pydantic import BaseModel, Field

from app.agent import run_investigation, investigation_graph
from app.catalog import APPS
from app.guides import GUIDES, get_guide
from app.research import ResearchError
from app.schemas import (
    AppSearchResponse,
    AuthStrategyRequest,
    AuthStrategyResponse,
    InvestigationRequest,
    OAuthApp,
    OAuthGuide,
)
from app.storage import (
    initialize_db,
    create_investigation,
    complete_investigation,
    fail_investigation,
    get_investigation,
    list_investigations,
    save_feedback,
)
from app.strategy import recommend_strategy

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_db()
    yield

logger = logging.getLogger(__name__)

app = FastAPI(
    title="OAuth Launchpad",
    description=(
        "Discover OAuth apps, explore setup guides, "
        "and choose an authentication strategy."
    ),
    version="0.2.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to OAuth Launchpad",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "oauth-launchpad",
    }


@app.get("/api/apps", response_model=AppSearchResponse)
def search_apps(
    q: str = Query(default=""),
    category: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    guide_only: bool = Query(default=False),
):
    query = q.strip().lower()

    results = []

    for item in APPS:
        if query and not any(
            query in str(item.get(field, "")).lower()
            for field in (
                "name",
                "description",
                "category",
                "provider",
            )
        ):
            continue

        if (
            category
            and item["category"].lower() != category.lower()
        ):
            continue

        if (
            difficulty
            and item["difficulty"].lower() != difficulty.lower()
        ):
            continue

        if guide_only and item["id"] not in GUIDES:
            continue

        app_data = {
            **item,
            "guide_available": item["id"] in GUIDES,
        }

        results.append(OAuthApp(**app_data))

    return {
        "results": results,
        "total": len(results),
    }


@app.get("/api/apps/{app_id}", response_model=OAuthApp)
def get_app(app_id: str):
    for item in APPS:
        if item["id"] == app_id:
            return OAuthApp(
                **{
                    **item,
                    "guide_available": app_id in GUIDES,
                }
            )

    raise HTTPException(
        status_code=404,
        detail="Application not found in the catalog.",
    )


@app.get("/api/guides")
def list_guides():
    results = []

    for app_id, data in GUIDES.items():
        guide = get_guide(app_id)

        results.append({
            "app_id": app_id,
            "app_name": data["app_name"],
            "difficulty": data["difficulty"],
            "approval_required": data["approval_required"],
            "estimated_active_minutes": data["active_minutes"],
            "estimated_wait_days": None,
            "evidence_status": "curated",
            "guide_url": f"/api/guides/{app_id}",
            "summary": data["summary"],
        })

    return {
        "results": results,
        "total": len(results),
    }


@app.get(
    "/api/guides/{app_id}",
    response_model=OAuthGuide,
)
def retrieve_guide(app_id: str):
    guide = get_guide(app_id)

    if not guide:
        raise HTTPException(
            status_code=404,
            detail=(
                "No curated guide exists for this application yet. "
                "Use the live investigation flow when available."
            ),
        )

    return guide


@app.post(
    "/api/strategy",
    response_model=AuthStrategyResponse,
)
def get_auth_strategy(
    request: AuthStrategyRequest,
):
    try:
        return recommend_strategy(request)

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@app.post("/api/investigate")
async def investigate_endpoint(
    request: InvestigationRequest,
):
    if not request.app_name and not request.website:
        raise HTTPException(
            status_code=422,
            detail="Provide an app name or website.",
        )

    try:
        result = await run_investigation(
            app_name=request.app_name,
            website=(
                str(request.website)
                if request.website
                else None
            ),
        )

        return {
            "status": "completed",
            **result,
        }

    except ResearchError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        # Avoid returning internal stack traces or secret values.
        raise HTTPException(
            status_code=502,
            detail=(
                "The investigation could not be completed. "
                "Check the research provider, model configuration, "
                "and server logs."
            ),
        ) from exc


@app.post("/api/investigate/stream")
async def investigate_stream_endpoint(request: InvestigationRequest):
    if not request.app_name and not request.website:
        raise HTTPException(
            status_code=422,
            detail="Provide an app name or website."
        )

    investigation_id = create_investigation(
        app_name=request.app_name,
        website=str(request.website) if request.website else None,
        )

    async def event_generator():
        initial_state = {
            "app_name": request.app_name,
            "website": str(request.website) if request.website else None,
            "progress": [],
        }

        final_state = {}

        try:
            yield (
                "event: progress\n"
                "data: "
                + json.dumps({
                    "stage": "started",
                    "message": "Investigation started",
                    "investigation_id": investigation_id,
                })
                + "\n\n"
            )

            async for update in investigation_graph.astream(
                initial_state,
                stream_mode="updates",
            ):
                for node_name, node_output in update.items():
                    logger.info(
                        "Investigation node completed: %s",
                        node_name,
                    )

                    final_state.update(node_output)

                    if node_output.get("error"):
                        raise RuntimeError(node_output["error"])

                    progress_items = node_output.get("progress", [])

                    if progress_items:
                        item = progress_items[-1]

                        yield (
                            "event: progress\n"
                            f"data: {json.dumps(item, default=str)}\n\n"
                        )

            guide = final_state.get("guide")

            if guide is None:
                raise RuntimeError(
                    "The investigation finished without producing a guide."
                )

            # Support Pydantic models and ordinary dictionaries.
            if hasattr(guide, "model_dump"):
                guide_data = guide.model_dump(mode="json")
            elif isinstance(guide, dict):
                guide_data = guide
            else:
                raise TypeError(
                    f"Unexpected guide type: {type(guide).__name__}"
                )

            
            # Include the persistent ID in the result.
            guide_data["investigation_id"] = investigation_id
            guide_data["guide_url"] = (
                f"/api/investigations/{investigation_id}"
            )
            guide_data["share_url"] = (
                f"/share/{investigation_id}"
            )

            risk_analysis = final_state.get("risk_analysis")

            if risk_analysis:
                guide_data["effort_risk"] = risk_analysis

            complete_investigation(
                investigation_id=investigation_id,
                guide=guide_data,
                research=final_state.get("research"),
                analysis=final_state.get("analysis"),
            )

            yield (
                "event: result\n"
                f"data: {json.dumps(guide_data, default=str)}\n\n"
            )

            yield (
                "event: done\n"
                'data: {"status":"completed"}\n\n'
            )

        except Exception as exc:

            fail_investigation(
                investigation_id=investigation_id,
                error=type(exc).__name__,
            )
            # Full traceback appears in your Uvicorn terminal.
            logger.exception(
                "OAuth investigation failed for app=%r, website=%r",
                request.app_name,
                str(request.website) if request.website else None,
            )

            # Keep internal exception details out of the client response.
            error_data = {
                "message": "Investigation failed. Check server logs.",
                "error_type": type(exc).__name__,
            }

            yield (
                "event: error\n"
                f"data: {json.dumps(error_data)}\n\n"
            )



    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


def build_share_payload(investigation_id: str) -> dict:
    investigation = get_investigation(investigation_id)

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found.",
        )

    if investigation.get("status") != "completed":
        raise HTTPException(
            status_code=409,
            detail="Only completed investigations can be shared.",
        )

    # Support the decoded field names used by storage.py.
    guide = (
        investigation.get("guide")
        or investigation.get("guide_json")
    )

    if isinstance(guide, str):
        try:
            guide = json.loads(guide)
        except json.JSONDecodeError as exc:
            logger.exception(
                "Invalid saved guide JSON for investigation %s",
                investigation_id,
            )
            raise HTTPException(
                status_code=500,
                detail="The saved investigation result is invalid.",
            ) from exc

    if not isinstance(guide, dict):
        raise HTTPException(
            status_code=500,
            detail="The saved investigation has no valid guide.",
        )

    # Return only fields intended for public sharing.
    return {
        "investigation_id": investigation_id,
        "app_name": guide.get("app_name"),
        "website": guide.get("website"),
        "summary": guide.get("summary"),
        "difficulty": guide.get("difficulty"),
        "prerequisites": guide.get("prerequisites", []),
        "steps": guide.get("steps", []),
        "estimated_active_minutes": guide.get(
            "estimated_active_minutes"
        ),
        "estimated_wait_days": guide.get("estimated_wait_days"),
        "approval_required": guide.get("approval_required"),
        "evidence_status": guide.get("evidence_status"),
        "sources": guide.get("sources", []),
        "uncertainties": guide.get("uncertainties", []),
        "effort_risk": guide.get("effort_risk"),
        "generated_at": guide.get("generated_at"),
        "share_url": f"/share/{investigation_id}",
    }

@app.get("/api/share/{investigation_id}")
def get_shared_investigation(investigation_id: str):
    return build_share_payload(investigation_id)

@app.get(
    "/share/{investigation_id}",
    response_class=HTMLResponse,
)
def share_investigation_page(investigation_id: str):
    result = build_share_payload(investigation_id)

    app_name = html.escape(
        str(result.get("app_name") or "OAuth Investigation")
    )

    website = html.escape(
        str(result.get("website") or "")
    )

    summary = html.escape(
        str(result.get("summary") or "No summary available.")
    )

    difficulty = html.escape(
        str(result.get("difficulty") or "unknown").title()
    )

    estimated_minutes = result.get("estimated_active_minutes")
    if isinstance(estimated_minutes, int) and not isinstance(
        estimated_minutes, bool
    ):
        estimated_time = f"{estimated_minutes} minutes"
    else:
        estimated_time = "Not estimated"

    risk = result.get("effort_risk") or {}

    risk_score = risk.get("risk_score")
    complexity = html.escape(
        str(risk.get("complexity") or "unknown").title()
    )

    if isinstance(risk_score, int) and not isinstance(risk_score, bool):
        risk_score_text = f"{risk_score}/100"
    else:
        risk_score_text = "Not available"

    steps_html = ""

    for index, step in enumerate(result.get("steps", []), start=1):
        title = html.escape(str(step.get("title") or "Untitled step"))
        description = html.escape(
            str(step.get("description") or "")
        )

        required = (
            "Required"
            if step.get("required", True)
            else "Optional"
        )

        minutes = step.get("estimated_minutes")

        if isinstance(minutes, int) and not isinstance(minutes, bool):
            duration = f"{minutes} minutes"
        else:
            duration = "Not estimated"

        steps_html += f"""
        <article class="step">
            <h3>{index}. {title}</h3>
            <p>{description}</p>
            <p class="meta">{required} · {duration}</p>
        </article>
        """

    sources_html = ""

    for source in result.get("sources", []):
        safe_source = html.escape(str(source), quote=True)

        # Only render HTTP(S) source links.
        parsed_source = urlparse(str(source))

        if parsed_source.scheme not in {"http", "https"}:
            continue

        sources_html += (
            f'<li><a href="{safe_source}" '
            f'target="_blank" rel="noopener noreferrer">'
            f'{safe_source}</a></li>'
        )

    uncertainties_html = "".join(
        f"<li>{html.escape(str(item))}</li>"
        for item in result.get("uncertainties", [])
    )

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex, nofollow">
        <title>{app_name} OAuth Guide</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                max-width: 900px;
                margin: 40px auto;
                padding: 0 20px;
                color: #202124;
                line-height: 1.6;
            }}
            .summary, .step, .metric {{
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 18px;
                margin: 16px 0;
            }}
            .metrics {{
                display: grid;
                grid-template-columns: repeat(
                    auto-fit, minmax(160px, 1fr)
                );
                gap: 12px;
            }}
            .metric strong {{
                display: block;
                font-size: 1.35rem;
            }}
            .meta {{
                color: #666;
                font-size: 0.9rem;
            }}
            a {{
                overflow-wrap: anywhere;
            }}
            footer {{
                margin-top: 36px;
                color: #666;
                font-size: 0.85rem;
            }}
        </style>
    </head>
    <body>
        <h1>{app_name} OAuth Integration Guide</h1>
        <p><a href="{website}">{website}</a></p>

        <section class="summary">
            <h2>Overview</h2>
            <p>{summary}</p>
        </section>

        <section class="metrics">
            <div class="metric">
                <span>Difficulty</span>
                <strong>{difficulty}</strong>
            </div>
            <div class="metric">
                <span>Estimated active effort</span>
                <strong>{html.escape(estimated_time)}</strong>
            </div>
            <div class="metric">
                <span>Risk score</span>
                <strong>{html.escape(risk_score_text)}</strong>
            </div>
            <div class="metric">
                <span>Risk complexity</span>
                <strong>{complexity}</strong>
            </div>
        </section>

        <h2>Implementation steps</h2>
        {steps_html or "<p>No steps available.</p>"}

        <h2>Sources</h2>
        <ul>
            {sources_html or "<li>No sources available.</li>"}
        </ul>

        <h2>Uncertainties</h2>
        <ul>
            {uncertainties_html or "<li>No recorded uncertainties.</li>"}
        </ul>

        <footer>
            Investigation ID: {html.escape(investigation_id)}<br>
            This guide is research-assisted and partially verified.
            Estimated effort is not a guarantee of completion time.
        </footer>
    </body>
    </html>
    """

@app.get("/api/investigations")
def get_investigation_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    app_name: str | None = None,
):
    return list_investigations(
        limit=limit,
        offset=offset,
        app_name=app_name,
    )


@app.get("/api/investigations/{investigation_id}")
def get_investigation_by_id(
    investigation_id: str,
):
    investigation = get_investigation(investigation_id)

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found.",
        )

    return investigation


class FeedbackRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


@app.post("/api/investigations/{investigation_id}/feedback")
def submit_investigation_feedback(
    investigation_id: str,
    request: FeedbackRequest,
):
    try:
        return save_feedback(
            investigation_id=investigation_id,
            rating=request.rating,
            comment=request.comment,
        )
    except ValueError as exc:
        message = str(exc)

        if message == "Investigation not found.":
            raise HTTPException(
                status_code=404,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=400,
            detail=message,
        ) from exc