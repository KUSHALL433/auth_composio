from typing import Literal
from pydantic import BaseModel, Field, HttpUrl


Difficulty = Literal["easy", "moderate", "hard", "unknown"]

ApprovalStatus = Literal[
    "yes", "no", "conditional", "unknown"
]

AvailabilityStatus = Literal[
    "confirmed_available",
    "confirmed_unavailable",
    "requires_verification",
    "not_applicable",
]


class OAuthApp(BaseModel):
    id: str
    name: str
    description: str
    website: HttpUrl
    provider: str
    category: str
    difficulty: Difficulty
    guide_available: bool = False


class AppSearchResponse(BaseModel):
    results: list[OAuthApp]
    total: int


class InvestigationRequest(BaseModel):
    app_name: str | None = None
    website: HttpUrl | None = None


class GuideStep(BaseModel):
    title: str
    description: str
    estimated_minutes: int | None = None
    required: bool = True
    source_urls: list[str] = Field(default_factory=list)
    human_action_required: bool = False


class ManagedAuthOption(BaseModel):
    provider: str
    availability: AvailabilityStatus
    description: str
    source_urls: list[str] = Field(default_factory=list)


class OAuthGuide(BaseModel):
    app_name: str
    website: str
    difficulty: Difficulty

    summary: str

    prerequisites: list[str] = Field(default_factory=list)
    steps: list[GuideStep] = Field(default_factory=list)

    estimated_active_minutes: int | None = None
    estimated_wait_days: int | None = None

    approval_required: ApprovalStatus = "unknown"
    approval_notes: list[str] = Field(default_factory=list)

    managed_auth_options: list[ManagedAuthOption] = Field(
        default_factory=list
    )

    custom_oauth_supported: bool | None = None

    blockers: list[str] = Field(default_factory=list)
    human_actions_required: list[str] = Field(default_factory=list)

    tested_actions: list[str] = Field(default_factory=list)
    untested_actions: list[str] = Field(default_factory=list)

    sources: list[str] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)

    evidence_status: Literal[
        "curated",
        "partially_verified",
        "verified"
    ] = "curated"

    generated_at: str


class AuthStrategyRequest(BaseModel):
    app_id: str

    use_case: str = "AI agent integration"

    production: bool = False
    needs_custom_branding: bool = False
    needs_custom_scopes: bool = False
    needs_dedicated_quota: bool = False


class AuthStrategyResponse(BaseModel):
    app_id: str
    app_name: str

    recommended_strategy: Literal[
        "managed_oauth",
        "custom_oauth",
        "alternative_auth",
        "investigate_first",
    ]

    reason: str

    alternatives: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)

    evidence_status: Literal[
        "documented",
        "partially_verified",
        "unverified",
    ] = "unverified"

    sources: list[str] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)