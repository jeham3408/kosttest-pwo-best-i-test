#!/usr/bin/env python3
"""Inngangspunkt for kosttest produkt-bilde automasjon."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "scripts"))
from product_image_automation import main

if __name__ == "__main__":
    sys.exit(main())
