import asyncio
import ipaddress
import socket
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

MAX_SEARCH_RESULTS = 6
MAX_PAGES_TO_FETCH = 4
MAX_PAGE_CHARS = 12_000
MAX_TOTAL_EVIDENCE_CHARS = 28_000

USER_AGENT = "OAuthLaunchpadResearchBot/0.3"


class ResearchError(Exception):
    pass


def _validate_public_url(url: str) -> str:
    """
    Restrict research to public HTTP(S) URLs.

    This is a basic SSRF defense. Production deployments should
    also enforce outbound network restrictions at the infrastructure
    or egress-proxy level.
    """
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        raise ResearchError("Only HTTP and HTTPS URLs are supported.")

    if not parsed.hostname:
        raise ResearchError("The supplied URL has no hostname.")

    if parsed.username or parsed.password:
        raise ResearchError("URLs containing credentials are not allowed.")

    hostname = parsed.hostname.rstrip(".").lower()

    if hostname in {"localhost", "localhost.localdomain"}:
        raise ResearchError("Local URLs are not allowed.")

    try:
        addresses = socket.getaddrinfo(
            hostname,
            parsed.port or (443 if parsed.scheme == "https" else 80),
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise ResearchError("The hostname could not be resolved.") from exc

    if not addresses:
        raise ResearchError("The hostname has no resolved addresses.")

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])

        if not ip.is_global:
            raise ResearchError(
                "Private, local, and non-public IP addresses are not allowed."
            )

    return url


def _robots_allows(url: str) -> bool:
    """
    Best-effort robots.txt check.

    This is not a replacement for provider terms, rate limits,
    or a full production crawling policy.
    """
    parsed = urlparse(url)

    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

    try:
        with httpx.Client(
            timeout=5.0,
            follow_redirects=False,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            response = client.get(robots_url)

        if response.status_code == 404:
            return True

        if response.status_code != 200:
            return False

        parser = RobotFileParser()
        parser.set_url(robots_url)
        parser.parse(response.text.splitlines())

        return parser.can_fetch(USER_AGENT, url)

    except Exception:
        # Fail closed when robots.txt cannot be checked.
        return False


def _extract_visible_text(html: str) -> str:
    """
    Remove common non-content elements and extract readable text.

    This intentionally avoids executing JavaScript.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")

    for element in soup([
        "script",
        "style",
        "noscript",
        "svg",
        "nav",
        "footer",
        "header",
    ]):
        element.decompose()

    return " ".join(soup.stripped_strings)


async def _fetch_page(
    client: httpx.AsyncClient,
    url: str,
) -> dict | None:
    """
    Fetch a public documentation page with basic URL and redirect checks.
    """
    try:
        _validate_public_url(url)

        if not await asyncio.to_thread(_robots_allows, url):
            return None

        response = await client.get(
            url,
            headers={"User-Agent": USER_AGENT},
        )

        # Do not follow redirects automatically. Validate each redirect
        # target before requesting it to reduce SSRF risk.
        redirects = 0

        while response.is_redirect and redirects < 3:
            location = response.headers.get("location")

            if not location:
                return None

            next_url = str(response.url.join(location))
            _validate_public_url(next_url)

            response = await client.get(
                next_url,
                headers={"User-Agent": USER_AGENT},
            )

            redirects += 1

        if response.status_code != 200:
            return None

        content_type = response.headers.get("content-type", "").lower()

        if "text/html" not in content_type and "text/plain" not in content_type:
            return None

        # Reject pages that are excessively large.
        if len(response.content) > 2_000_000:
            return None

        if "text/html" in content_type:
            text = _extract_visible_text(response.text)
        else:
            text = response.text

        text = text[:MAX_PAGE_CHARS]

        if not text.strip():
            return None

        return {
            "url": str(response.url),
            "title": response.text[:0],
            "content": text,
            "fetch_status": "success",
        }

    except Exception:
        return None


async def investigate_app(
    app_name: str | None,
    website: str | None,
) -> dict:
    """
    Search for OAuth documentation and retrieve accessible public pages.
    """
    if not app_name and not website:
        raise ResearchError("Provide an app name or website.")

    if website:
        website = _validate_public_url(website)

    if not app_name:
        app_name = urlparse(website).hostname

    api_key = __import__("os").getenv("TAVILY_API_KEY")

    if not api_key:
        raise ResearchError(
            "TAVILY_API_KEY is missing. Configure it in your .env file."
        )

    search_queries = [
        f"{app_name} official OAuth developer documentation",
        f"{app_name} OAuth app registration scopes redirect URI",
        f"{app_name} OAuth verification approval publishing requirements",
    ]

    if website:
        host = urlparse(website).hostname
        search_queries = [
            f"site:{host} OAuth developer documentation",
            f"site:{host} OAuth scopes app registration",
            f"site:{host} verification approval requirements",
        ]

    tavily = TavilyClient(api_key=api_key)

    results = []
    seen_urls = set()

    for query in search_queries:
        try:
            response = await asyncio.to_thread(
                tavily.search,
                query=query,
                max_results=MAX_SEARCH_RESULTS,
                search_depth="advanced",
            )

            for item in response.get("results", []):
                url = item.get("url")

                if not url or url in seen_urls:
                    continue

                seen_urls.add(url)

                results.append({
                    "title": item.get("title", ""),
                    "url": url,
                    "snippet": item.get("content", ""),
                    "score": item.get("score"),
                })

        except Exception:
            continue

    if website and website not in seen_urls:
        results.insert(
            0,
            {
                "title": "User-provided website",
                "url": website,
                "snippet": "",
                "score": None,
            },
        )

    results = results[:MAX_SEARCH_RESULTS]

    fetched_pages = []

    timeout = httpx.Timeout(12.0)

    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=False,
    ) as client:
        for result in results:
            if len(fetched_pages) >= MAX_PAGES_TO_FETCH:
                break

            page = await _fetch_page(
                client,
                result["url"],
            )

            if page:
                page["title"] = result["title"]
                fetched_pages.append(page)

    # Build a bounded evidence package for the LLM.
    evidence = []
    total_chars = 0

    for result in results:
        snippet = result["snippet"][:1500]

        item = {
            "url": result["url"],
            "title": result["title"],
            "content": snippet,
            "kind": "search_result",
        }

        if total_chars + len(snippet) > MAX_TOTAL_EVIDENCE_CHARS:
            break

        evidence.append(item)
        total_chars += len(snippet)

    for page in fetched_pages:
        content = page["content"]

        remaining = MAX_TOTAL_EVIDENCE_CHARS - total_chars

        if remaining <= 0:
            break

        content = content[:remaining]

        evidence.append({
            "url": page["url"],
            "title": page["title"],
            "content": content,
            "kind": "fetched_page",
        })

        total_chars += len(content)

    if not evidence:
        raise ResearchError(
            "No usable documentation evidence was retrieved. "
            "Try another website or verify that the provider has "
            "publicly accessible developer documentation."
        )

    return {
        "app_name": app_name,
        "website": website,
        "search_results": results,
        "fetched_pages": fetched_pages,
        "evidence": evidence,
    }