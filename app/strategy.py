from app.catalog import APPS
from app.guides import GUIDES, COMPOSIO_MANAGED, COMPOSIO_CUSTOM

from app.schemas import (
    AuthStrategyRequest,
    AuthStrategyResponse,
)


def recommend_strategy(
    request: AuthStrategyRequest,
) -> AuthStrategyResponse:

    catalog_item = next(
        (
            item for item in APPS
            if item["id"] == request.app_id
        ),
        None,
    )

    if not catalog_item:
        raise ValueError("Application not found.")

    app_name = catalog_item["name"]

    guide = GUIDES.get(request.app_id)

    if not guide:
        return AuthStrategyResponse(
            app_id=request.app_id,
            app_name=app_name,
            recommended_strategy="investigate_first",
            reason=(
                "The application has no curated guide yet. "
                "Investigate its official authentication documentation "
                "and available managed-authentication options first."
            ),
            alternatives=[],
            next_steps=[
                "Find the application's official developer documentation.",
                "Identify its supported authentication methods.",
                "Determine whether managed OAuth is available.",
                "Confirm required permissions and approval requirements.",
            ],
            evidence_status="unverified",
            sources=[],
            uncertainties=[
                "Authentication methods have not been investigated.",
                "Managed OAuth availability is unknown.",
            ],
        )

    sources = list(guide["sources"])
    sources.extend([
        COMPOSIO_MANAGED,
        COMPOSIO_CUSTOM,
    ])

    # A managed provider is a candidate, not an assumed capability.
    # Verify toolkit metadata before recommending it as confirmed.
    if (
        request.needs_custom_branding
        or request.needs_custom_scopes
        or request.needs_dedicated_quota
    ):
        return AuthStrategyResponse(
            app_id=request.app_id,
            app_name=app_name,
            recommended_strategy="custom_oauth",
            reason=(
                "Your requirements indicate a need for application-level "
                "control. Custom OAuth is the appropriate path to evaluate "
                "when you need your own consent-screen branding, scopes, "
                "or a dedicated provider quota. Confirm the provider's "
                "specific requirements before implementation."
            ),
            alternatives=[
                "Check whether managed OAuth covers the required functionality.",
                "Reduce the requested scopes if possible.",
            ],
            next_steps=[
                "Confirm the provider supports the required OAuth scopes.",
                "Register a custom OAuth application.",
                "Configure the redirect URI and credentials.",
                "Review the applicable provider verification requirements.",
            ],
            evidence_status="documented",
            sources=sources,
            uncertainties=[
                "The exact scopes have not been supplied.",
                "Provider-specific approval requirements must be checked.",
            ],
        )

    return AuthStrategyResponse(
        app_id=request.app_id,
        app_name=app_name,
        recommended_strategy="investigate_first",
        reason=(
            "Managed OAuth may avoid a separate app registration, "
            "but availability for this app, authentication scheme, "
            "and required permissions has not yet been verified. "
            "Check managed-auth support before registering a custom app."
        ),
        alternatives=[
            "Use managed OAuth if the required scheme and scopes are supported.",
            "Use custom OAuth if you need your own credentials or branding.",
        ],
        next_steps=[
            "Check the integration's managed-auth availability.",
            "Identify the minimum permissions required by your agent.",
            "Compare the managed option with custom OAuth.",
            "Proceed with the selected authentication method.",
        ],
        evidence_status="partially_verified",
        sources=sources,
        uncertainties=[
            "Managed OAuth availability has not been checked against live toolkit metadata.",
            "Required permissions depend on the intended agent functionality.",
        ],
    )