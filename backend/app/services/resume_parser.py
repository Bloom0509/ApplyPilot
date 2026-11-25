import re
from io import BytesIO

from docx import Document
from pypdf import PdfReader


SKILLS = (
    "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "React", "Angular", "Vue", "Node.js", "FastAPI", "Django", "Flask", "Spring", ".NET", "HTML", "CSS",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "GraphQL", "REST", "Apache Kafka",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Linux", "Git", "CI/CD",
    "Machine Learning", "Deep Learning", "Natural Language Processing", "Generative AI", "PyTorch", "TensorFlow", "scikit-learn",
    "Pandas", "NumPy", "Data Analysis", "Power BI", "Tableau", "Excel", "Figma", "Product Management", "Agile",
)


def read_resume(filename: str, content: bytes) -> str:
    suffix = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix == "pdf":
        pages = PdfReader(BytesIO(content)).pages
        text = "\n".join(page.extract_text() or "" for page in pages)
    elif suffix == "docx":
        document = Document(BytesIO(content))
        paragraphs = [paragraph.text for paragraph in document.paragraphs]
        table_text = [cell.text for table in document.tables for row in table.rows for cell in row.cells]
        text = "\n".join(paragraphs + table_text)
    elif suffix == "txt":
        text = content.decode("utf-8-sig")
    else:
        raise ValueError("Upload a PDF, DOCX, or TXT resume")

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        raise ValueError("No text could be extracted. Scanned PDFs need OCR; you can paste the resume text instead.")
    if len(text) > 50_000:
        raise ValueError("The extracted resume is too long (maximum 50,000 characters)")
    return text


def _section(text: str, names: str) -> str | None:
    lines = text.splitlines()
    start = None
    collected: list[str] = []
    heading = re.compile(rf"^\s*(?:{names})\s*[:\-]?\s*$", re.IGNORECASE)
    any_heading = re.compile(r"^\s*(?:experience|employment|work history|education|skills|technical skills|technologies|projects|certifications|summary|profile|objective)\s*[:\-]?\s*$", re.IGNORECASE)
    for line in lines:
        if start is None:
            if heading.fullmatch(line):
                start = True
            continue
        if any_heading.fullmatch(line):
            break
        if line.strip():
            collected.append(line.strip())
    value = "\n".join(collected).strip()
    return value[:12_000] or None


def suggest_profile(text: str) -> dict:
    lines = [line.strip(" |\t") for line in text.splitlines() if line.strip()]
    full_name = None
    for line in lines[:5]:
        if "@" in line or re.search(r"(?:\+?\d[\d .()\-]{7,}\d)", line) or "http" in line.lower():
            continue
        candidate = re.split(r"\s+[|•]\s+", line)[0].strip()
        if len(candidate) <= 100 and re.fullmatch(r"[\w][\w .’'-]*", candidate, flags=re.UNICODE):
            full_name = candidate
            break

    email_match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text, re.IGNORECASE)
    lowered = text.casefold()
    matched_skills = [skill for skill in SKILLS if re.search(rf"(?<![\w]){re.escape(skill.casefold())}(?![\w])", lowered)]

    role_match = re.search(r"(?:target|desired)\s+roles?\s*:\s*(.+)", text, re.IGNORECASE)
    location_match = re.search(r"(?:preferred\s+)?locations?\s*:\s*(.+)", text, re.IGNORECASE)
    return {
        "full_name": full_name or "",
        "email": email_match.group(0) if email_match else None,
        "target_roles": [item.strip() for item in re.split(r"[,;|]", role_match.group(1)) if item.strip()] if role_match else [],
        "preferred_locations": [item.strip() for item in re.split(r"[,;|]", location_match.group(1)) if item.strip()] if location_match else [],
        "work_preferences": [],
        "experience": _section(text, r"experience|employment|work history"),
        "education": _section(text, r"education"),
        "skills": matched_skills,
        "resume_text": text,
    }
