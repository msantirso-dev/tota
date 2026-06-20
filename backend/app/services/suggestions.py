"""Rule-based phrase suggestions for AAC."""

SUGGESTION_RULES: dict[str, list[str]] = {
    "yo quiero ir casa": [
        "Yo quiero ir a casa",
        "Quiero volver a casa",
        "Necesito ir a casa",
        "Llévame a casa",
    ],
    "yo quiero comer": [
        "Yo quiero comer",
        "Tengo hambre",
        "Quiero algo para comer",
        "Necesito comer",
    ],
    "yo quiero tomar": [
        "Yo quiero tomar",
        "Tengo sed",
        "Quiero beber algo",
        "Necesito tomar agua",
    ],
    "yo necesito ayuda": [
        "Necesito ayuda",
        "Por favor, ayúdame",
        "Necesito asistencia",
        "Ayuda, por favor",
    ],
    "yo tengo dolor": [
        "Me duele",
        "Tengo dolor",
        "Necesito ayuda, me duele",
        "Por favor, me duele",
    ],
    "yo quiero baño": [
        "Necesito ir al baño",
        "Quiero ir al baño",
        "Por favor, baño",
    ],
    "yo quiero dormir": [
        "Quiero dormir",
        "Tengo sueño",
        "Necesito descansar",
    ],
    "yo quiero jugar": [
        "Quiero jugar",
        "Vamos a jugar",
        "Quiero jugar un rato",
    ],
}


def normalize_phrase(phrase: str) -> str:
    return " ".join(phrase.lower().strip().split())


def get_rule_suggestions(phrase: str) -> list[str]:
    normalized = normalize_phrase(phrase)
    if normalized in SUGGESTION_RULES:
        return SUGGESTION_RULES[normalized]

    suggestions: list[str] = []
    words = normalized.split()

    if "casa" in words and "ir" in words:
        suggestions.extend(SUGGESTION_RULES.get("yo quiero ir casa", []))
    if "comer" in words or "hambre" in words:
        suggestions.extend(SUGGESTION_RULES.get("yo quiero comer", []))
    if "tomar" in words or "sed" in words:
        suggestions.extend(SUGGESTION_RULES.get("yo quiero tomar", []))
    if "ayuda" in words:
        suggestions.extend(SUGGESTION_RULES.get("yo necesito ayuda", []))
    if "dolor" in words or "duele" in words:
        suggestions.extend(SUGGESTION_RULES.get("yo tengo dolor", []))

    seen: set[str] = set()
    unique: list[str] = []
    for s in suggestions:
        key = s.lower()
        if key not in seen:
            seen.add(key)
            unique.append(s)
    return unique[:4]
