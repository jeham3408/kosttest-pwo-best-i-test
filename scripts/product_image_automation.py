#!/usr/bin/env python3
"""
Systematisk faktasjekk og bilde-automatisering for kosttest.no.

Sjekker alle produkter i src/data/pwoProducts.ts:
  1. Verifiserer at produkt-URL er tilgjengelig
  2. Sjekker om produktet har bilde
  3. Finner bilde fra produktside (og:image) eller nettsøk
  4. Oppdaterer pwoProducts.ts med funne bilder

Kjør: python run_automation.py [--dry-run] [--limit N]
"""

from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_FILE = ROOT / "src" / "data" / "pwoProducts.ts"
STATE_FILE = ROOT / "data" / "state.json"
REPORT_FILE = ROOT / "data" / "last_run_report.json"

USER_AGENT = "Mozilla/5.0 (compatible; KosttestBot/1.0; +https://kosttest.no)"
REQUEST_DELAY = 0.6  # sekunder mellom HTTP-kall

SSL_CTX = ssl.create_default_context()


@dataclass
class Product:
    id: str
    name: str
    brand: str
    merchant: str
    url: str
    image: str | None = None
    section: str = "listed"  # "tested" | "listed"
    line_start: int = 0
    line_end: int = 0


@dataclass
class CheckResult:
    product_id: str
    name: str
    url_ok: bool | None = None
    had_image: bool = False
    image_ok: bool | None = None
    image_found: str | None = None
    image_source: str | None = None
    action: str = "none"  # none | added | fixed | skipped | failed
    note: str = ""


@dataclass
class RunReport:
    started_at: str = ""
    finished_at: str = ""
    dry_run: bool = False
    products_checked: int = 0
    images_added: int = 0
    images_fixed: int = 0
    url_failures: int = 0
    image_failures: int = 0
    results: list[dict] = field(default_factory=list)


def http_get(url: str, timeout: int = 15, method: str = "GET") -> tuple[int, dict[str, str], bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            headers = {k.lower(): v for k, v in resp.headers.items()}
            body = resp.read(1_000_000) if method == "GET" else b""
            return resp.status, headers, body
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, b""
    except Exception:
        return 0, {}, b""


def is_url_ok(url: str) -> bool:
    if not url:
        return False
    status, _, _ = http_get(url, method="HEAD")
    if status in (200, 301, 302, 303, 307, 308):
        return True
    status, _, _ = http_get(url)
    return status in (200, 301, 302)


def is_image_ok(url: str) -> bool:
    if not url:
        return False
    status, headers, body = http_get(url, method="HEAD")
    ct = headers.get("content-type", "")
    if status == 200 and ct.startswith("image/"):
        return True
    status, headers, body = http_get(url)
    ct = headers.get("content-type", "")
    if status == 200 and ct.startswith("image/"):
        return True
    if status == 200 and len(body) > 1000:
        return True
    return False


def scrape_og_image(page_url: str) -> str | None:
    status, _, body = http_get(page_url)
    if status != 200:
        return None
    html = body.decode("utf-8", errors="replace")
    patterns = [
        r'<meta\s+property="og:image"\s+content="([^"]+)"',
        r'<meta\s+content="([^"]+)"\s+property="og:image"',
        r'<meta\s+property="og:image:secure_url"\s+content="([^"]+)"',
        r'<meta\s+name="twitter:image"\s+content="([^"]+)"',
        r'"image"\s*:\s*"(https?://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
        r'<link\s+rel="image_src"\s+href="([^"]+)"',
    ]
    for pat in patterns:
        m = re.search(pat, html, re.I)
        if m:
            img = m.group(1).strip()
            if img and not img.endswith(".svg"):
                return normalize_url(img, page_url)
    return None


def normalize_url(url: str, base: str = "") -> str:
    url = url.strip()
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/") and base:
        parsed = urllib.parse.urlparse(base)
        return f"{parsed.scheme}://{parsed.netloc}{url}"
    return url


def search_bing_images(query: str) -> str | None:
    encoded = urllib.parse.quote(query)
    url = f"https://www.bing.com/images/search?q={encoded}&qft=+filterui:photo-photo&form=IRFLTR"
    status, _, body = http_get(url)
    if status != 200:
        return None
    html = body.decode("utf-8", errors="replace")
    patterns = [
        r'murl&quot;:&quot;(https?://[^&]+?\.(?:jpg|jpeg|png|webp)[^&]*?)&quot;',
        r'"murl"\s*:\s*"(https?://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
    ]
    for pat in patterns:
        matches = re.findall(pat, html, re.I)
        for img_url in matches:
            img_url = img_url.replace("\\u0026", "&").replace("\\/", "/")
            if is_image_ok(img_url):
                return img_url
    return None


def search_duckduckgo_images(query: str) -> str | None:
    encoded = urllib.parse.quote(query)
    url = f"https://duckduckgo.com/?q={encoded}&iax=images&ia=images"
    status, _, body = http_get(url)
    if status != 200:
        return None
    html = body.decode("utf-8", errors="replace")
    vqd = re.search(r'vqd=([\d-]+)', html)
    if not vqd:
        return None
    api_url = (
        f"https://duckduckgo.com/i.js?l=wt-wt&o=json&q={encoded}"
        f"&vqd={vqd.group(1)}&f=,,,,,&p=1"
    )
    status, _, body = http_get(api_url)
    if status != 200:
        return None
    try:
        data = json.loads(body.decode("utf-8"))
        for result in data.get("results", [])[:5]:
            img_url = result.get("image")
            if img_url and is_image_ok(img_url):
                return img_url
    except (json.JSONDecodeError, KeyError):
        pass
    return None


def find_image(product: Product) -> tuple[str | None, str]:
    """Returnerer (bilde-url, kilde) eller (None, '')."""
    if product.url:
        img = scrape_og_image(product.url)
        time.sleep(REQUEST_DELAY)
        if img and is_image_ok(img):
            return img, "product_page"

    query = f"{product.brand} {product.name} pre workout PWO"
    img = search_bing_images(query)
    time.sleep(REQUEST_DELAY)
    if img:
        return img, "bing"

    img = search_duckduckgo_images(query)
    time.sleep(REQUEST_DELAY)
    if img:
        return img, "duckduckgo"

    return None, ""


def parse_products(content: str) -> tuple[list[Product], list[Product]]:
    """Parse testedProducts og listedProducts fra TypeScript-fil."""
    tested: list[Product] = []
    listed: list[Product] = []

    # Finn listedProducts-seksjonen (flat struktur, enkel å parse)
    listed_start = content.find("export const listedProducts")
    listed_end = content.find("export const sourceLinks")
    if listed_start >= 0 and listed_end > listed_start:
        listed_section = content[listed_start:listed_end]
        listed = _parse_product_blocks(listed_section, "listed", content, listed_start)

    # For testedProducts: finn alle id+image par med enklere mønster
    tested_start = content.find("export const testedProducts")
    tested_end = content.find("]\n\ntestedProducts.forEach")
    if tested_start >= 0 and tested_end > tested_start:
        tested_section = content[tested_start:tested_end]
        tested = _parse_product_blocks(tested_section, "tested", content, tested_start)

    return tested, listed


def _parse_product_blocks(block_text: str, section: str, full_content: str, offset: int) -> list[Product]:
    products: list[Product] = []
    # Match product objects starting with id field (skip spread/map entries)
    for m in re.finditer(
        r"\{\s*\n\s*id:\s*'([^']+)'.*?\n\s*\}",
        block_text,
        re.DOTALL,
    ):
        block = m.group(0)
        pid = m.group(1)

        if "product.id" in block or "...testedProducts" in block:
            continue

        def field(name: str) -> str | None:
            fm = re.search(rf"{name}:\s*'([^']*)'", block)
            return fm.group(1) if fm else None

        name = field("name") or ""
        brand = field("brand") or ""
        merchant = field("merchant") or ""
        url = field("url") or ""
        image = field("image")

        abs_pos = offset + m.start()
        line_start = full_content[:abs_pos].count("\n") + 1
        line_end = full_content[:offset + m.end()].count("\n") + 1

        products.append(
            Product(
                id=pid,
                name=name,
                brand=brand,
                merchant=merchant,
                url=url,
                image=image,
                section=section,
                line_start=line_start,
                line_end=line_end,
            )
        )
    return products


def add_image_to_product(content: str, product_id: str, image_url: str) -> str:
    """Legg til image-felt i et listedProduct uten bilde."""
    escaped_url = image_url.replace("'", "\\'")
    image_line = f"    image: '{escaped_url}',"

    # Begrens søk til listedProducts-seksjonen
    listed_start = content.find("export const listedProducts")
    listed_end = content.find("export const sourceLinks")
    if listed_start < 0 or listed_end < 0:
        return content

    before = content[:listed_start]
    section = content[listed_start:listed_end]
    after = content[listed_end:]

    pattern = rf"(  \{{\n    id: '{re.escape(product_id)}',.*?\n  \}},)"
    match = re.search(pattern, section, re.DOTALL)
    if not match:
        return content

    block = match.group(1)
    if re.search(r"\n    image:", block):
        new_block = re.sub(
            r"\n    image: '[^']*',",
            f"\n{image_line}",
            block,
        )
    else:
        new_block = re.sub(
            r"(\n    url: '[^']*',)",
            rf"\1\n{image_line}",
            block,
        )

    section = section[: match.start(1)] + new_block + section[match.end(1) :]
    return before + section + after


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"processed": {}, "last_run": None}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False))


def save_report(report: RunReport) -> None:
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    REPORT_FILE.write_text(json.dumps(asdict(report), indent=2, ensure_ascii=False))


def run(dry_run: bool = False, limit: int | None = None, skip_state: bool = False) -> RunReport:
    report = RunReport(
        started_at=datetime.now(timezone.utc).isoformat(),
        dry_run=dry_run,
    )
    state = load_state()

    content = PRODUCTS_FILE.read_text()
    tested, listed = parse_products(content)

    # Produkter som trenger bilde: listed uten image
    needs_image = [p for p in listed if not p.image]
    # Produkter med bilde som bør verifiseres
    has_image = tested + [p for p in listed if p.image]

    to_process = needs_image
    if limit:
        to_process = to_process[:limit]

    print(f"Fant {len(tested)} testede, {len(listed)} listede produkter")
    print(f"{len(needs_image)} mangler bilde, sjekker {len(to_process)} denne kjøringen")

    updated_content = content

    for product in to_process:
        result = CheckResult(product_id=product.id, name=product.name)
        report.products_checked += 1

        if not skip_state and product.id in state.get("processed", {}):
            prev = state["processed"][product.id]
            if prev.get("image") and prev.get("status") == "ok":
                result.action = "skipped"
                result.note = "Allerede behandlet"
                report.results.append(asdict(result))
                print(f"  SKIP {product.id} (allerede behandlet)")
                continue

        # Faktasjekk: produkt-URL
        if product.url:
            result.url_ok = is_url_ok(product.url)
            time.sleep(REQUEST_DELAY)
            if not result.url_ok:
                report.url_failures += 1
                result.note = f"Produkt-URL utilgjengelig: {product.url}"
                print(f"  WARN {product.id}: URL utilgjengelig")

        # Finn bilde
        print(f"  Søker bilde for {product.brand} {product.name}...")
        image_url, source = find_image(product)

        if image_url:
            result.image_found = image_url
            result.image_source = source
            result.action = "added"
            report.images_added += 1
            print(f"  OK   {product.id}: {source} → {image_url[:80]}")

            if not dry_run:
                updated_content = add_image_to_product(updated_content, product.id, image_url)
                state.setdefault("processed", {})[product.id] = {
                    "image": image_url,
                    "source": source,
                    "status": "ok",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
        else:
            result.action = "failed"
            report.image_failures += 1
            result.note = "Fant ikke bilde"
            state.setdefault("processed", {})[product.id] = {
                "status": "failed",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            print(f"  FAIL {product.id}: fant ikke bilde")

        report.results.append(asdict(result))

    # Verifiser eksisterende bilder (sample)
    broken_images = []
    for product in has_image:
        if not product.image:
            continue
        if not is_image_ok(product.image):
            broken_images.append(product)
            report.image_failures += 1
            time.sleep(REQUEST_DELAY)

    if broken_images:
        print(f"\n{len(broken_images)} produkter med ødelagt bilde-URL:")
        for p in broken_images[:10]:
            print(f"  {p.id}: {p.image[:80]}")

    if not dry_run and report.images_added > 0:
        PRODUCTS_FILE.write_text(updated_content)
        save_state(state)
        print(f"\nOppdatert {PRODUCTS_FILE} med {report.images_added} nye bilder")

    report.finished_at = datetime.now(timezone.utc).isoformat()
    save_report(report)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Kosttest produkt-bilde automasjon")
    parser.add_argument("--dry-run", action="store_true", help="Kjør uten å skrive endringer")
    parser.add_argument("--limit", type=int, default=None, help="Maks antall produkter å behandle")
    parser.add_argument("--skip-state", action="store_true", help="Ignorer tidligere state")
    args = parser.parse_args()

    report = run(dry_run=args.dry_run, limit=args.limit, skip_state=args.skip_state)

    print(f"\n--- Rapport ---")
    print(f"Sjekket: {report.products_checked}")
    print(f"Bilder lagt til: {report.images_added}")
    print(f"URL-feil: {report.url_failures}")
    print(f"Bilde-feil: {report.image_failures}")
    print(f"Rapport: {REPORT_FILE}")

    return 0 if report.image_failures == 0 or report.images_added > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
