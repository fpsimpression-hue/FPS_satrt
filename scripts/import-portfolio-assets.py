"""Copy curated portfolio photos into their numbered website folders."""

from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "apps" / "web" / "lib" / "portfolio.ts"
DESTINATION = ROOT / "apps" / "web" / "public" / "portfolio"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=Path.home() / "Downloads")
    args = parser.parse_args()

    content = MANIFEST.read_text(encoding="utf-8")
    categories = re.finditer(
        r'id: "([a-z0-9-]+)".*?photos: \[(.*?)\n    \],',
        content,
        flags=re.DOTALL,
    )
    copies: list[tuple[Path, Path]] = []
    for category_match in categories:
        category_id, photo_block = category_match.groups()
        sources = re.findall(r'source: "([^"]+)"', photo_block)
        if not sources:
            raise SystemExit(f"No photos listed for category {category_id}")
        for number, filename in enumerate(sources, start=1):
            source = args.source_dir / filename
            target = DESTINATION / category_id / f"{number:02}.jpg"
            if not source.is_file():
                raise SystemExit(f"Missing source photo: {source}")
            copies.append((source, target))

    if not copies:
        raise SystemExit("No portfolio photos found in the manifest")

    for source, target in copies:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    size_mb = sum(target.stat().st_size for _, target in copies) / (1024 * 1024)
    print(f"Imported {len(copies)} photos into {DESTINATION} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
