from datetime import datetime, timezone

from app.schemas import (
    OAuthGuide,
    GuideStep,
    ManagedAuthOption,
)


COMPOSIO_MANAGED = (
    "https://docs.composio.dev/toolkits/managed-auth"
)

COMPOSIO_CUSTOM = (
    "https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app"
)

GOOGLE_OAUTH = (
    "https://developers.google.com/identity/protocols/oauth2"
)

GOOGLE_CONSENT = (
    "https://developers.google.com/workspace/guides/configure-oauth-consent"
)

GOOGLE_POLICIES = (
    "https://developers.google.com/identity/protocols/oauth2/policies"
)

SLACK_OAUTH = "https://docs.slack.dev/authentication/installing-with-oauth/"

GITHUB_OAUTH = "https://docs.github.com/en/apps/oauth-apps"

MICROSOFT_OAUTH = (
    "https://learn.microsoft.com/en-us/entra/identity-platform/"
)

NOTION_OAUTH = "https://developers.notion.com/"


def step(
    title,
    description,
    minutes=None,
    sources=None,
    human=False,
):
    return GuideStep(
        title=title,
        description=description,
        estimated_minutes=minutes,
        required=True,
        source_urls=sources or [],
        human_action_required=human,
    )


def managed_option(app_name):
    return ManagedAuthOption(
        provider="Composio",
        availability="requires_verification",
        description=(
            f"Check Composio's current toolkit metadata for {app_name}. "
            "Confirm that its managed authentication scheme matches "
            "the OAuth method and scopes your integration needs. "
            "If available, managed OAuth can avoid registering your "
            "own provider OAuth app. Custom scopes or branding may "
            "still require your own OAuth application."
        ),
        source_urls=[
            COMPOSIO_MANAGED,
            COMPOSIO_CUSTOM,
        ],
    )


GUIDES = {
    "google": {
        "app_name": "Google",
        "website": GOOGLE_OAUTH,
        "difficulty": "moderate",
        "summary": (
            "Register an OAuth client, configure the consent screen, "
            "select the required API scopes, and test authorization. "
            "Verification requirements depend on the audience, scopes, "
            "and Google API policies that apply to the integration."
        ),
        "prerequisites": [
            "A Google account with access to Google Cloud.",
            "A Google Cloud project.",
            "The specific Google APIs the integration needs.",
            "A registered application URL and privacy policy when "
            "required for the intended publication and verification.",
            "A secure redirect URI appropriate for the application."
        ],
        "steps": [
            {
                "title": "Create or select a Google Cloud project",
                "description": (
                    "Choose the project that will own the OAuth client "
                    "and enable the Google APIs needed by your agent."
                ),
                "minutes": 10,
                "sources": [GOOGLE_OAUTH],
                "human": True,
            },
            {
                "title": "Configure the OAuth consent screen",
                "description": (
                    "Configure application branding, support contact, "
                    "audience, and other required consent-screen details. "
                    "For external testing, configure test users when "
                    "the selected configuration requires them."
                ),
                "minutes": 20,
                "sources": [GOOGLE_CONSENT],
                "human": True,
            },
            {
                "title": "Choose the minimum necessary scopes",
                "description": (
                    "Identify the exact API operations your agent needs. "
                    "Check each scope's classification and applicable "
                    "verification or security-assessment requirements."
                ),
                "minutes": 20,
                "sources": [
                    GOOGLE_CONSENT,
                    GOOGLE_POLICIES,
                ],
                "human": True,
            },
            {
                "title": "Create an OAuth client",
                "description": (
                    "Choose the client type appropriate to your app "
                    "and configure the authorized redirect URI."
                ),
                "minutes": 15,
                "sources": [GOOGLE_OAUTH],
                "human": True,
            },
            {
                "title": "Test authorization and callback handling",
                "description": (
                    "Authorize a test account, verify the callback, "
                    "check granted scopes, and handle denied consent "
                    "or errors."
                ),
                "minutes": 30,
                "sources": [GOOGLE_OAUTH],
                "human": True,
            },
            {
                "title": "Resolve applicable verification requirements",
                "description": (
                    "Review the publishing state and scope requirements. "
                    "Submit required verification materials through "
                    "Google's official process when applicable."
                ),
                "minutes": None,
                "sources": [
                    GOOGLE_CONSENT,
                    GOOGLE_POLICIES,
                ],
                "human": True,
            },
        ],
        "active_minutes": 95,
        "approval_required": "conditional",
        "approval_notes": [
            "All Google OAuth applications require appropriate "
            "OAuth consent configuration.",
            "Additional verification requirements depend on "
            "the requested scopes and intended audience.",
            "Certain restricted scopes can trigger additional "
            "security-assessment requirements.",
        ],
        "blockers": [
            "Missing consent-screen information.",
            "Redirect URI mismatch.",
            "Requesting unnecessary or incorrectly configured scopes.",
            "Required verification materials are incomplete.",
            "An organizational policy blocks the requested access.",
        ],
        "human_actions": [
            "Create the Google Cloud project and OAuth client.",
            "Confirm the required scopes.",
            "Provide any required application policies and verification "
            "materials.",
            "Complete any required provider review.",
        ],
        "sources": [
            GOOGLE_OAUTH,
            GOOGLE_CONSENT,
            GOOGLE_POLICIES,
        ],
        "uncertainties": [
            "The precise verification path cannot be determined "
            "without knowing the requested scopes and audience.",
            "Provider review duration has not been established.",
            "The agent has not created or tested an OAuth client.",
        ],
    },

    "slack": {
        "app_name": "Slack",
        "website": SLACK_OAUTH,
        "difficulty": "moderate",
        "summary": (
            "Create a Slack app, configure OAuth scopes and redirect "
            "URLs, implement the authorization-code exchange, and "
            "test installation in a workspace. Distribution and "
            "organization policies can affect rollout."
        ),
        "prerequisites": [
            "A Slack account with access to the required workspace.",
            "Access to Slack's app configuration.",
            "A backend capable of securely handling OAuth credentials.",
            "An HTTPS redirect URL for the OAuth flow.",
            "A defined list of required bot and user permissions.",
        ],
        "steps": [
            {
                "title": "Create a Slack app",
                "description": (
                    "Create an app in Slack's developer environment "
                    "and select the appropriate configuration."
                ),
                "minutes": 10,
                "sources": [SLACK_OAUTH],
                "human": True,
            },
            {
                "title": "Configure OAuth scopes",
                "description": (
                    "Choose the minimum bot scopes and, if needed, "
                    "user scopes. Determine which identity the agent "
                    "must act on behalf of."
                ),
                "minutes": 20,
                "sources": [SLACK_OAUTH],
                "human": True,
            },
            {
                "title": "Configure redirect URLs",
                "description": (
                    "Register the HTTPS callback URL and ensure "
                    "the authorization and token-exchange steps "
                    "use consistent redirect URI values."
                ),
                "minutes": 15,
                "sources": [SLACK_OAUTH],
                "human": True,
            },
            {
                "title": "Implement the authorization-code exchange",
                "description": (
                    "Send the user to Slack's authorization endpoint, "
                    "validate the callback, and exchange the temporary "
                    "authorization code securely on the backend."
                ),
                "minutes": 30,
                "sources": [SLACK_OAUTH],
                "human": True,
            },
            {
                "title": "Test installation and permissions",
                "description": (
                    "Install the app in a test workspace, verify "
                    "the granted permissions, and test the required "
                    "API calls."
                ),
                "minutes": 30,
                "sources": [SLACK_OAUTH],
                "human": True,
            },
            {
                "title": "Check distribution and admin restrictions",
                "description": (
                    "Determine whether the intended workspace or "
                    "organization requires administrator approval "
                    "and verify the current distribution requirements."
                ),
                "minutes": None,
                "sources": [SLACK_OAUTH],
                "human": True,
            },
        ],
        "active_minutes": 105,
        "approval_required": "conditional",
        "approval_notes": [
            "OAuth authorization involves the user or workspace "
            "granting the requested permissions.",
            "Workspace administrator restrictions may affect installation.",
            "Public distribution requirements depend on the intended "
            "distribution model and current Slack policies.",
        ],
        "blockers": [
            "Redirect URL mismatch.",
            "Missing bot or user scopes.",
            "Insufficient workspace installation permissions.",
            "The app is installed in a different workspace than intended.",
        ],
        "human_actions": [
            "Create the app in Slack's developer environment.",
            "Approve the requested permissions during testing.",
            "Contact a workspace administrator if installation is restricted.",
            "Complete any applicable distribution or review requirements.",
        ],
        "sources": [SLACK_OAUTH],
        "uncertainties": [
            "The required distribution process depends on the app's "
            "audience and intended use.",
            "No live installation or distribution submission was performed.",
        ],
    },

    "github": {
        "app_name": "GitHub",
        "website": GITHUB_OAUTH,
        "difficulty": "easy",
        "summary": (
            "Register a GitHub OAuth App, configure its callback URL, "
            "request the required scopes, and implement the OAuth "
            "authorization flow. Organization restrictions may require "
            "additional approval."
        ),
        "prerequisites": [
            "A GitHub account.",
            "Permission to register an OAuth application.",
            "A backend capable of securely storing the client secret.",
            "A callback URL.",
            "A defined list of required GitHub scopes.",
        ],
        "steps": [
            {
                "title": "Register an OAuth App",
                "description": (
                    "Create an OAuth App in GitHub's developer settings "
                    "and provide the application details and callback URL."
                ),
                "minutes": 15,
                "sources": [GITHUB_OAUTH],
                "human": True,
            },
            {
                "title": "Define the required permissions",
                "description": (
                    "Select only the OAuth scopes needed by the agent. "
                    "Determine whether it needs read or write access "
                    "to repositories, issues, or other resources."
                ),
                "minutes": 20,
                "sources": [GITHUB_OAUTH],
                "human": True,
            },
            {
                "title": "Implement the OAuth flow",
                "description": (
                    "Redirect the user to authorize the application, "
                    "validate the callback and state, and exchange "
                    "the authorization code on the backend."
                ),
                "minutes": 30,
                "sources": [GITHUB_OAUTH],
                "human": True,
            },
            {
                "title": "Test access and organization restrictions",
                "description": (
                    "Authorize a test account, check API access, "
                    "and determine whether organization-level "
                    "OAuth restrictions apply."
                ),
                "minutes": 20,
                "sources": [GITHUB_OAUTH],
                "human": True,
            },
        ],
        "active_minutes": 85,
        "approval_required": "conditional",
        "approval_notes": [
            "A separate provider-wide verification process should "
            "not be assumed without identifying an applicable requirement.",
            "Organizations can restrict OAuth App access to their resources "
            "and require owner approval.",
        ],
        "blockers": [
            "Incorrect callback URL.",
            "Missing permissions for the requested operation.",
            "Organization OAuth restrictions.",
            "A user account restriction that prevents authorization.",
        ],
        "human_actions": [
            "Register the OAuth App.",
            "Confirm the minimum scopes.",
            "Authorize a test account.",
            "Request organization owner approval if required.",
        ],
        "sources": [GITHUB_OAUTH],
        "uncertainties": [
            "The exact authorization requirements depend on the requested "
            "scopes and target organization.",
            "No live GitHub OAuth App was created or tested.",
        ],
    },

    "microsoft": {
        "app_name": "Microsoft",
        "website": MICROSOFT_OAUTH,
        "difficulty": "moderate",
        "summary": (
            "Register an application in Microsoft Entra ID, configure "
            "supported account types, add redirect URIs, select API "
            "permissions, and test the sign-in or delegated-access flow."
        ),
        "prerequisites": [
            "A Microsoft account or access to a Microsoft Entra tenant.",
            "Permission to register applications in the tenant.",
            "A defined list of Microsoft APIs and permissions.",
            "A redirect URI appropriate to the application platform.",
        ],
        "steps": [
            {
                "title": "Register the application",
                "description": (
                    "Create an app registration in Microsoft Entra ID "
                    "and choose the account types that must be supported."
                ),
                "minutes": 20,
                "sources": [MICROSOFT_OAUTH],
                "human": True,
            },
            {
                "title": "Configure platform and redirect URI",
                "description": (
                    "Select the appropriate platform configuration "
                    "and register the callback URL."
                ),
                "minutes": 15,
                "sources": [MICROSOFT_OAUTH],
                "human": True,
            },
            {
                "title": "Configure API permissions",
                "description": (
                    "Add the minimum required delegated or application "
                    "permissions. Identify permissions that require "
                    "administrator consent."
                ),
                "minutes": 25,
                "sources": [MICROSOFT_OAUTH],
                "human": True,
            },
            {
                "title": "Implement and test authentication",
                "description": (
                    "Use the appropriate Microsoft identity flow, "
                    "validate the callback, and test the intended API calls."
                ),
                "minutes": 40,
                "sources": [MICROSOFT_OAUTH],
                "human": True,
            },
            {
                "title": "Resolve tenant consent requirements",
                "description": (
                    "Check whether user consent is sufficient or "
                    "a tenant administrator must grant consent."
                ),
                "minutes": None,
                "sources": [MICROSOFT_OAUTH],
                "human": True,
            },
        ],
        "active_minutes": 100,
        "approval_required": "conditional",
        "approval_notes": [
            "The registration and consent process depends on the "
            "account types, API permissions, tenant configuration, "
            "and whether the app is public or organization-specific.",
            "Some permissions require administrator consent.",
        ],
        "blockers": [
            "Insufficient tenant permissions to register applications.",
            "Incorrect account-type configuration.",
            "Redirect URI mismatch.",
            "Administrator consent is required but unavailable.",
        ],
        "human_actions": [
            "Register the application in the appropriate tenant.",
            "Select the required API permissions.",
            "Obtain administrator consent when necessary.",
            "Test with representative accounts and tenants.",
        ],
        "sources": [MICROSOFT_OAUTH],
        "uncertainties": [
            "The exact consent requirements cannot be determined "
            "without the API permissions and tenant policy.",
            "No live tenant registration or consent request was performed.",
        ],
    },

    "notion": {
        "app_name": "Notion",
        "website": NOTION_OAUTH,
        "difficulty": "moderate",
        "summary": (
            "Register an integration, determine whether it should be "
            "internal or public, configure OAuth where appropriate, "
            "and test access to the intended Notion workspace and resources."
        ),
        "prerequisites": [
            "A Notion account.",
            "Access to the workspace used for testing.",
            "A defined set of required integration capabilities.",
            "An application URL and callback configuration if using OAuth.",
        ],
        "steps": [
            {
                "title": "Review the integration type",
                "description": (
                    "Determine whether an internal integration is sufficient "
                    "or whether users in external workspaces must connect "
                    "through a public OAuth flow."
                ),
                "minutes": 15,
                "sources": [NOTION_OAUTH],
                "human": True,
            },
            {
                "title": "Create the integration",
                "description": (
                    "Register the integration and configure the required "
                    "application details in Notion's developer environment."
                ),
                "minutes": 15,
                "sources": [NOTION_OAUTH],
                "human": True,
            },
            {
                "title": "Configure authorization and permissions",
                "description": (
                    "For an OAuth-based public integration, configure "
                    "the applicable authorization settings and request "
                    "only the capabilities needed by the agent."
                ),
                "minutes": 25,
                "sources": [NOTION_OAUTH],
                "human": True,
            },
            {
                "title": "Test workspace access",
                "description": (
                    "Authorize or connect a test workspace as appropriate. "
                    "Verify that the integration can access only the "
                    "resources that have been shared with it."
                ),
                "minutes": 25,
                "sources": [NOTION_OAUTH],
                "human": True,
            },
            {
                "title": "Check public integration requirements",
                "description": (
                    "Review the current Notion requirements for the "
                    "intended distribution model and complete any "
                    "applicable review steps."
                ),
                "minutes": None,
                "sources": [NOTION_OAUTH],
                "human": True,
            },
        ],
        "active_minutes": 80,
        "approval_required": "conditional",
        "approval_notes": [
            "The setup differs between internal and public integrations.",
            "Public distribution requirements must be confirmed against "
            "the current Notion documentation and intended use case.",
        ],
        "blockers": [
            "Choosing an integration type that does not match the intended use.",
            "Missing workspace access or sharing permissions.",
            "Incorrect callback configuration for OAuth.",
            "Unresolved requirements for public distribution.",
        ],
        "human_actions": [
            "Register the integration.",
            "Select the correct integration model.",
            "Authorize or connect a test workspace.",
            "Complete applicable distribution requirements.",
        ],
        "sources": [NOTION_OAUTH],
        "uncertainties": [
            "The required review path depends on the integration type "
            "and distribution model.",
            "No live Notion integration or OAuth flow was tested.",
        ],
    },
}


def get_guide(app_id: str) -> OAuthGuide | None:
    data = GUIDES.get(app_id)

    if not data:
        return None

    steps = [
        step(
            title=item["title"],
            description=item["description"],
            minutes=item.get("minutes"),
            sources=item.get("sources"),
            human=item.get("human", False),
        )
        for item in data["steps"]
    ]

    return OAuthGuide(
        app_name=data["app_name"],
        website=data["website"],
        difficulty=data["difficulty"],
        summary=data["summary"],
        prerequisites=data["prerequisites"],
        steps=steps,
        estimated_active_minutes=data["active_minutes"],
        estimated_wait_days=None,
        approval_required=data["approval_required"],
        approval_notes=data["approval_notes"],
        managed_auth_options=[
            managed_option(data["app_name"])
        ],
        custom_oauth_supported=True,
        blockers=data["blockers"],
        human_actions_required=data["human_actions"],
        tested_actions=[],
        untested_actions=[
            "Provider console setup",
            "Live OAuth authorization",
            "Token exchange against a real application",
            "Provider approval submission",
        ],
        sources=data["sources"],
        uncertainties=data["uncertainties"],
        evidence_status="curated",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )