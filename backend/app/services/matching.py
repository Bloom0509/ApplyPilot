import re

from app.api.v1.schemas.jobs import JobListing, MatchReason
from app.db.models import CandidateProfile

WEIGHTS = {
    "target_roles": ("Target roles", 30.0),
    "skills": ("Skills", 45.0),
    "preferred_locations": ("Preferred locations", 15.0),
    "work_preferences": ("Work preferences", 10.0),
}


def _values(items: list[str] | None) -> list[str]:
    return [item.strip() for item in (items or []) if item and item.strip()]


def _phrase_found(value: str, text: str) -> bool:
    value = value.strip()
    if not value:
        return False
    return re.search(rf"(?<![\w]){re.escape(value)}(?![\w])", text, flags=re.IGNORECASE) is not None


def _role_found(role: str, title: str) -> bool:
    if _phrase_found(role, title):
        return True
    role_words = [word for word in re.findall(r"[\w+#.]+", role.casefold()) if len(word) > 1]
    title_words = set(re.findall(r"[\w+#.]+", title.casefold()))
    return bool(role_words) and sum(word in title_words for word in role_words) / len(role_words) >= 0.75


def _preference_found(preference: str, job: JobListing) -> bool:
    normalized = preference.casefold().strip()
    if normalized in {"remote", "fully remote", "work from home", "wfh"}:
        return job.remote
    listing_terms = " ".join([*job.job_types, *job.tags]).casefold()
    if normalized in {"full time", "full-time", "fulltime"}:
        return any(term in listing_terms for term in ("full time", "full-time", "fulltime"))
    if normalized in {"part time", "part-time", "parttime"}:
        return any(term in listing_terms for term in ("part time", "part-time", "parttime"))
    return _phrase_found(preference, listing_terms)


def score_job(job: JobListing, profile: CandidateProfile | None) -> JobListing:
    if profile is None:
        return job.model_copy(update={"match_score": None, "match_reasons": []})

    roles = _values(profile.target_roles)
    skills = _values(profile.skills)
    locations = _values(profile.preferred_locations)
    preferences = _values(profile.work_preferences)
    dimensions: list[tuple[str, list[str], list[str], str, float]] = []

    if roles:
        matched = [role for role in roles if _role_found(role, job.title)]
        dimensions.append(("target_roles", roles, matched, "Target roles", WEIGHTS["target_roles"][1]))

    if skills:
        searchable = " ".join([job.title, job.description, *job.tags, *job.job_types])
        matched = [skill for skill in skills if _phrase_found(skill, searchable)]
        dimensions.append(("skills", skills, matched, "Skills", WEIGHTS["skills"][1]))

    if locations:
        job_location = job.location.casefold()
        matched = [
            location for location in locations
            if location.casefold() in job_location
            or (location.casefold() == "remote" and job.remote)
        ]
        dimensions.append(("preferred_locations", locations, matched, "Preferred locations", WEIGHTS["preferred_locations"][1]))

    if preferences:
        matched = [preference for preference in preferences if _preference_found(preference, job)]
        dimensions.append(("work_preferences", preferences, matched, "Work preferences", WEIGHTS["work_preferences"][1]))

    available_weight = sum(dimension[4] for dimension in dimensions)
    if not available_weight:
        return job.model_copy(update={"match_score": None, "match_reasons": []})

    reasons: list[MatchReason] = []
    earned_weight = 0.0
    for signal, values, matched, label, weight in dimensions:
        unmatched = [value for value in values if value not in matched]
        ratio = len(matched) / len(values)
        earned = weight * ratio
        earned_weight += earned
        if matched:
            detail = f"Matched {len(matched)} of {len(values)} saved {label.casefold()}: {', '.join(matched)}."
        else:
            detail = f"No saved {label.casefold()} matched this listing."
        reasons.append(MatchReason(
            signal=signal,
            label=label,
            matched=bool(matched),
            matched_values=matched,
            unmatched_values=unmatched,
            points=round(earned / available_weight * 100, 1),
            detail=detail,
        ))

    return job.model_copy(update={
        "match_score": round(earned_weight / available_weight * 100),
        "match_reasons": reasons,
    })
