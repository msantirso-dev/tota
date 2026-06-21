"""Pictogramas AAC de referencia (ARASAAC, licencia CC BY-NC-SA)."""

ARASAAC_BASE = "https://static.arasaac.org/pictograms"

# IDs verificados en api.arasaac.org (español)
PICTOGRAM_IDS: dict[str, int] = {
    "yo": 6632,
    "quiero": 5441,
    "no": 5526,
    "sí": 5584,
    "más": 3220,
    "ayuda": 12252,
    "dolor": 2367,
    "comer": 6456,
    "tomar": 6061,
    "ir": 8142,
    "baño": 6929,
    "casa": 6964,
    "mamá": 2458,
    "papá": 31146,
    "frío": 4652,
    "calor": 35561,
    "cansado": 35537,
    "feliz": 9907,
    "triste": 35545,
    "miedo": 10261,
    "jugar": 23392,
    "dormir": 6479,
    "parar": 7196,
    "gracias": 8129,
    "por favor": 8195,
    "tengo hambre": 35559,
    "tengo sed": 7273,
    "me duele": 2367,
    "necesito ayuda": 12252,
    "emergencia": 8687,
    "pan": 2494,
    "agua": 32464,
    "leche": 2445,
}


def pictogram_url(pictogram_id: int) -> str:
    return f"{ARASAAC_BASE}/{pictogram_id}/{pictogram_id}_500.png"


def default_image_url(label: str, spoken_text: str | None = None) -> str | None:
    key = label.lower().strip()
    if key in PICTOGRAM_IDS:
        return pictogram_url(PICTOGRAM_IDS[key])

    spoken = (spoken_text or label).lower().strip()
    if spoken in PICTOGRAM_IDS:
        return pictogram_url(PICTOGRAM_IDS[spoken])

    if "hambre" in spoken:
        return pictogram_url(PICTOGRAM_IDS["tengo hambre"])
    if "sed" in spoken:
        return pictogram_url(PICTOGRAM_IDS["tengo sed"])
    if "duele" in spoken or "dolor" in spoken:
        return pictogram_url(PICTOGRAM_IDS["dolor"])
    if "ayuda" in spoken:
        return pictogram_url(PICTOGRAM_IDS["ayuda"])
    if "casa" in spoken:
        return pictogram_url(PICTOGRAM_IDS["casa"])
    if "baño" in spoken:
        return pictogram_url(PICTOGRAM_IDS["baño"])
    if "emergenc" in spoken or "urgente" in spoken:
        return pictogram_url(PICTOGRAM_IDS["emergencia"])

    return None
