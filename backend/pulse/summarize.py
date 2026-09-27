"""Turn legislative titles into one plain-language sentence.

Council titles are long and formulaic ("An Ordinance amending Title 9 of The Philadelphia
Code, entitled ..., all under certain terms and conditions."). The formula is what makes
them readable by rules: strip the boilerplate, name the part of the code, and lead with a
plain verb. Neutral wording only: we describe what a bill does, never whether it's good.
"""

from __future__ import annotations

import re

MAX_CHARS = 170

_VERBS = {
    "amending": "Changes",
    "authorizing": "Authorizes",
    "approving": "Approves",
    "establishing": "Creates",
    "creating": "Creates",
    "providing": "Provides",
    "requiring": "Requires",
    "prohibiting": "Bans",
    "adding": "Adds",
    "repealing": "Repeals",
    "making": "Makes",
    "transferring": "Moves",
    "increasing": "Increases",
    "decreasing": "Reduces",
    "reducing": "Reduces",
    "extending": "Extends",
    "designating": "Designates",
    "declaring": "Declares",
    "calling": "Calls",
    "urging": "Urges",
    "supporting": "Supports",
    "opposing": "Opposes",
    "appointing": "Appoints",
    "confirming": "Confirms",
    "renaming": "Renames",
    "regulating": "Regulates",
    "granting": "Grants",
    "imposing": "Imposes",
    "exempting": "Exempts",
    "further": "Further",
    "relating": "Deals",
}

_CEREMONIAL = re.compile(
    r"^(?:a\s+)?resolution\s+(?:recognizing|honoring|congratulating|commemorating|celebrating|"
    r"mourning|remembering|thanking|welcoming|acknowledging|paying tribute)",
    re.IGNORECASE,
)

_BOILERPLATE = [
    r",?\s*all under certain terms and conditions\.?$",
    r",?\s*under certain terms and conditions\.?$",
    r";?\s*and making (?:certain )?technical changes\.?$",
    r",?\s*and for other purposes\.?$",
]


def _normalize(title: str) -> str:
    text = title.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    text = re.sub(r"\s+", " ", text).strip().replace(',"', '"')
    for pattern in _BOILERPLATE:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    return text.strip().rstrip(".;,")


def _sentence(text: str) -> str:
    text = text.strip().rstrip(".;,")
    if not text:
        return ""
    text = text[0].upper() + text[1:]
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS].rsplit(" ", 1)[0].rstrip(",;:-") + "…"
        return text
    return text + "."


def _verbify(gerund_clause: str) -> str:
    """'establishing a new fund' -> 'Creates a new fund'."""
    first, _, rest = gerund_clause.partition(" ")
    verb = _VERBS.get(first.lower())
    if verb is None and first.lower().endswith("ing"):
        stem = first[:-3]
        verb = (stem + "es" if stem.endswith(("s", "sh", "ch", "x", "z")) else stem + "s").capitalize()
    if verb is None:
        return gerund_clause
    return f"{verb} {rest}".strip()


def is_ceremonial(title: str) -> bool:
    return bool(_CEREMONIAL.match(title.strip()))


def summarize(title: str) -> str:
    if not title:
        return ""
    text = _normalize(title)

    # Zoning map changes: "Rezones land bounded by ..."
    m = re.match(r"^an ordinance amending the philadelphia zoning maps? by (.*)$", text, re.IGNORECASE)
    if m:
        where = re.search(r"(bounded by .*|located (?:at|within|along) .*)", m.group(1), re.IGNORECASE)
        return _sentence(f"Rezones land {where.group(1) if where else 'in the city'}")

    # Code amendments: name the chapter in plain words.
    m = re.match(
        r"^an ordinance amending (?:title|chapter|section|sections|chapters)s? [\w\-\.,\s]+? of the philadelphia code,?"
        r"(?: entitled \"(?P<name>[^\"]+?),?\",?)?\s*(?:by (?P<how>.*))?$",
        text,
        re.IGNORECASE,
    )
    if m:
        name = m.group("name")
        subject = f'the city\'s "{name}" rules' if name else "the Philadelphia Code"
        how = m.group("how")
        if how:
            return _sentence(f"Changes {subject} by {how}")
        return _sentence(f"Changes {subject}")

    # Hearing resolutions: "Calls for Council hearings on ..."
    m = re.match(
        r"^(?:a\s+)?resolution authorizing (?:the )?(?:city council's |council's )?"
        r"(?:committee on [^,]+?|joint committees? [^,]+?) to (?:hold|conduct) (?:public )?hearings? "
        r"(?:regarding|on|into|to examine|examining|about|concerning|to investigate|investigating) (?P<topic>.+)$",
        text,
        re.IGNORECASE,
    )
    if m:
        return _sentence(f"Calls for Council hearings on {m.group('topic')}")

    if is_ceremonial(text):
        rest = re.sub(r"^(?:a\s+)?resolution\s+\w+(?:\s+and\s+\w+)?\s+", "", text, flags=re.IGNORECASE)
        return _sentence(f"Honors {rest}")

    # Generic "An Ordinance/Resolution/An Act <verb>ing ...".
    m = re.match(r"^(?:an? )?(?:ordinance|resolution|act|bill)\s+(?P<clause>\w+ing\b.*)$", text, re.IGNORECASE)
    if m:
        clause = m.group("clause")
        # State acts often read "amending the act of ..., providing for X": the last clause is the point.
        provides = re.search(r",\s*(?:further\s+)?providing for (.+?)(?:;|$)", clause, re.IGNORECASE)
        if clause.lower().startswith("amending the act") and provides:
            return _sentence(f"Amends state law on {provides.group(1)}")
        return _sentence(_verbify(clause))

    return _sentence(text)
