import html
import json
import re
import threading
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen

from app.api.v1.schemas.jobs import JobListing

BASE_URL = "https://www.arbeitnow.com/api/job-board-api"
CACHE_TTL_SECONDS = 300
_page_cache: dict[int, tuple[float, dict]] = {}
_cache_lock = threading.Lock()


class JobSourceError(Exception):
    pass


def _fetch_source_page(page: int) -> dict:
    now = time.monotonic()
    with _cache_lock:
        cached = _page_cache.get(page)
        if cached and now - cached[0] < CACHE_TTL_SECONDS:
            return cached[1]

    request = Request(
        f"{BASE_URL}?{urlencode({'page': page})}",
        headers={"Accept": "application/json", "User-Agent": "ApplyPilot/0.1 (+https://github.com/Bloom0509/ApplyPilot)"},
    )
    try:
        with urlopen(request, timeout=12) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise JobSourceError("The live job source is temporarily unavailable. Try again shortly.") from error
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
        raise JobSourceError("The live job source returned an unexpected response.")

    with _cache_lock:
        _page_cache[page] = (time.monotonic(), payload)
    return payload


def _plain_text(value: str) -> str:
    without_tags = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", value or "", flags=re.IGNORECASE | re.DOTALL)
    without_tags = re.sub(r"<[^>]+>", " ", without_tags)
    return re.sub(r"\s+", " ", html.unescape(without_tags)).strip()


def _job_listing(raw: dict) -> JobListing | None:
    title = str(raw.get("title") or "").strip()
    url = str(raw.get("url") or "").strip()
    if not title or not url.startswith("https://"):
        return None
    created_at = raw.get("created_at")
    try:
        posted_at = datetime.fromtimestamp(float(created_at), tz=timezone.utc) if created_at else None
    except (TypeError, ValueError, OSError, OverflowError):
        posted_at = None
    tags = raw.get("tags") if isinstance(raw.get("tags"), list) else []
    job_types = raw.get("job_types") if isinstance(raw.get("job_types"), list) else []
    return JobListing(
        id=str(raw.get("slug") or url),
        title=title[:300],
        company=str(raw.get("company_name") or "Company not listed")[:200],
        location=str(raw.get("location") or "Location not listed")[:300],
        url=url,
        description=_plain_text(str(raw.get("description") or ""))[:1200],
        remote=bool(raw.get("remote", False)),
        tags=[str(tag)[:100] for tag in tags[:30]],
        job_types=[str(job_type)[:100] for job_type in job_types[:20]],
        posted_at=posted_at,
    )


def search_jobs(
    *,
    query: str | None,
    location: str | None,
    remote: bool | None,
    job_type: str | None,
    page: int,
) -> tuple[list[JobListing], int, int | None]:
    source_page = _fetch_source_page(page)
    query_terms = [term.casefold() for term in (query or "").split() if term]
    location_term = (location or "").strip().casefold()
    type_term = (job_type or "").strip().casefold()
    jobs: list[JobListing] = []

    for raw in source_page["data"]:
        if not isinstance(raw, dict):
            continue
        job = _job_listing(raw)
        if job is None:
            continue
        searchable = " ".join([job.title, job.company, job.description, *job.tags, *job.job_types]).casefold()
        if query_terms and not all(term in searchable for term in query_terms):
            continue
        if location_term and location_term not in job.location.casefold():
            continue
        if remote is not None and job.remote != remote:
            continue
        if type_term and not any(type_term in value.casefold() for value in job.job_types):
            continue
        jobs.append(job)

    next_page = None
    next_url = (source_page.get("links") or {}).get("next")
    if next_url:
        try:
            next_page = int(parse_qs(urlparse(next_url).query).get("page", [page + 1])[0])
        except (TypeError, ValueError):
            next_page = page + 1
    return jobs, len(jobs), next_page
