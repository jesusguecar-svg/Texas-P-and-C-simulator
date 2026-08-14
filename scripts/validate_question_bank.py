#!/usr/bin/env python3
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANK = ROOT / "question-bank"
SOURCES = ROOT / "sources"
EXPECTED = {"G1": 51, "G2": 35, "G3": 30, "G4": 53, "G5": 35, "G6": 28, "TX1": 41, "TX2": 27}
OPTION_IDS = ["A", "B", "C", "D"]
DIFFICULTIES = {"basica", "intermedia", "avanzada"}
ID_PATTERN = re.compile(r"^(G[1-6]|TX[12])-Q\d{3}$")

errors = []
questions = []

for domain, expected_count in EXPECTED.items():
    path = BANK / f"{domain}.json"
    if not path.exists():
        errors.append(f"Falta {path.relative_to(ROOT)}")
        continue
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{path.name}: JSON invalido: {exc}")
        continue
    if not isinstance(payload, list):
        errors.append(f"{path.name}: la raiz debe ser una lista")
        continue
    if len(payload) != expected_count:
        errors.append(f"{path.name}: se esperaban {expected_count} preguntas y hay {len(payload)}")
    expected_ids = [f"{domain}-Q{number:03d}" for number in range(1, expected_count + 1)]
    actual_ids = [item.get("id") for item in payload if isinstance(item, dict)]
    if actual_ids != expected_ids:
        errors.append(f"{path.name}: los ID deben ser consecutivos del 001 al {expected_count:03d}")
    questions.extend(payload)

seen_ids = set()
seen_stems = set()
for index, question in enumerate(questions, start=1):
    label = question.get("id", f"pregunta-{index}") if isinstance(question, dict) else f"pregunta-{index}"
    if not isinstance(question, dict):
        errors.append(f"{label}: debe ser un objeto")
        continue
    required = {"id", "domain", "subtopic", "difficulty", "stem", "options", "correctOption", "explanation", "keyTerms", "source", "reviewStatus"}
    if set(question) != required:
        errors.append(f"{label}: campos incorrectos: {sorted(set(question) ^ required)}")
    match = ID_PATTERN.fullmatch(str(question.get("id", "")))
    if not match or match.group(1) != question.get("domain"):
        errors.append(f"{label}: ID y dominio no coinciden")
    if label in seen_ids:
        errors.append(f"{label}: ID duplicado")
    seen_ids.add(label)
    stem_key = re.sub(r"\W+", " ", str(question.get("stem", "")).lower()).strip()
    if stem_key in seen_stems:
        errors.append(f"{label}: enunciado duplicado")
    seen_stems.add(stem_key)
    if len(str(question.get("stem", ""))) < 20:
        errors.append(f"{label}: enunciado demasiado corto")
    if question.get("difficulty") not in DIFFICULTIES:
        errors.append(f"{label}: dificultad invalida")
    options = question.get("options", [])
    if not isinstance(options, list) or [item.get("id") for item in options if isinstance(item, dict)] != OPTION_IDS:
        errors.append(f"{label}: las opciones deben ser A, B, C y D en orden")
    for option in options if isinstance(options, list) else []:
        if set(option) != {"id", "text", "rationale"} or len(str(option.get("rationale", ""))) < 15:
            errors.append(f"{label}: opcion {option.get('id', '?')} incompleta")
    if question.get("correctOption") not in OPTION_IDS:
        errors.append(f"{label}: respuesta correcta invalida")
    if len(str(question.get("explanation", ""))) < 25:
        errors.append(f"{label}: explicacion demasiado corta")
    terms = question.get("keyTerms", [])
    if not isinstance(terms, list) or not terms or any(set(term) != {"es", "en"} for term in terms):
        errors.append(f"{label}: terminos clave invalidos")
    source = question.get("source", {})
    source_path = SOURCES / str(source.get("file", ""))
    if set(source) != {"file", "section"} or not source_path.exists():
        errors.append(f"{label}: fuente inexistente o invalida")
    elif not any(
        re.sub(r"^#{1,6}\s+", "", line).replace("**", "").replace("\\.", ".").strip() == source.get("section")
        for line in source_path.read_text(encoding="utf-8").splitlines()
        if re.match(r"^#{1,6}\s+", line)
    ):
        errors.append(f"{label}: la seccion citada no es un encabezado exacto de la fuente")
    if question.get("reviewStatus") != "pending_expert_review":
        errors.append(f"{label}: estado de revision invalido")

if errors:
    print("VALIDACION FALLIDA")
    print("\n".join(f"- {error}" for error in errors))
    sys.exit(1)

counts = Counter(question["domain"] for question in questions)
print(f"VALIDACION CORRECTA: {len(questions)} preguntas")
print(" ".join(f"{domain}={counts[domain]}" for domain in EXPECTED))
