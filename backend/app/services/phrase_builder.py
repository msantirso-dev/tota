"""Build natural spoken phrases from AAC button tokens."""

CONNECTORS = {
    "casa": "a casa",
    "baño": "al baño",
    "mamá": "con mamá",
    "papá": "con papá",
}


def build_spoken_phrase(tokens: list[str]) -> str:
    if not tokens:
        return ""

    parts: list[str] = []
    for token in tokens:
        lower = token.lower().strip()
        parts.append(CONNECTORS.get(lower, token))

    result = " ".join(parts)
    if result:
        result = result[0].upper() + result[1:]
    return result
