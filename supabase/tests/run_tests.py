#!/usr/bin/env python3
"""
Ephemeral Postgres integration test runner for the Supabase schema.

Spins up a throwaway PostgreSQL instance, applies the Supabase compatibility
shim, applies every migration in supabase/migrations/ in filename order, then
runs each case in supabase/tests/cases/ inside its own transaction.

Why this exists: two full code-review passes could not resolve several RLS
questions, because reading DDL cannot tell you how PostgREST embeds behave or
whether a policy actually restricts what its name claims. This closes that gap
without Docker or a hosted project.

Requirements:
    pip install pgserver --break-system-packages

Usage:
    python3 supabase/tests/run_tests.py
    python3 supabase/tests/run_tests.py --keep      # leave the DB up for psql
    python3 supabase/tests/run_tests.py -k certificate   # filter cases

Case convention: each .sql file in cases/ raises an exception to fail. Use the
assert_* helpers installed by shim/01_assert.sql. A case that completes without
raising has passed. Cases run in a transaction that is always rolled back, so
they cannot see each other's writes.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import shutil
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase" / "migrations"
SHIM = ROOT / "supabase" / "tests" / "shim"
CASES = ROOT / "supabase" / "tests" / "cases"

GREEN, RED, YELLOW, DIM, RESET = (
    "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[0m"
)


def log(msg: str = "") -> None:
    print(msg, flush=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep", action="store_true",
                    help="leave the database running and print its URI")
    ap.add_argument("-k", "--filter", default="",
                    help="only run cases whose filename contains this substring")
    args = ap.parse_args()

    try:
        import pgserver  # noqa: WPS433
    except ImportError:
        log(f"{RED}pgserver not installed.{RESET}  "
            f"Run: pip install pgserver --break-system-packages")
        return 2

    import psycopg  # noqa: WPS433

    install_pgcrypto_stub(pgserver)

    datadir = tempfile.mkdtemp(prefix="lbd_pgdata_")
    log(f"{DIM}Starting ephemeral PostgreSQL in {datadir}{RESET}")
    server = pgserver.get_server(datadir)
    uri = server.get_uri()

    failures: list[tuple[str, str]] = []
    try:
        with psycopg.connect(uri, autocommit=True) as conn:
            # ---- shim -------------------------------------------------------
            for path in sorted(SHIM.glob("*.sql")):
                log(f"{DIM}shim      {path.name}{RESET}")
                conn.execute(path.read_text())

            # ---- migrations -------------------------------------------------
            migrations = sorted(MIGRATIONS.glob("*.sql"))
            if not migrations:
                log(f"{RED}No migrations found in {MIGRATIONS}{RESET}")
                return 2
            log("")
            for path in migrations:
                try:
                    conn.execute(path.read_text())
                    log(f"  {GREEN}ok{RESET}   {path.name}")
                except Exception as exc:  # noqa: BLE001
                    log(f"  {RED}FAIL{RESET} {path.name}")
                    log(f"       {exc}")
                    failures.append((f"migration:{path.name}", str(exc)))
                    return report(failures, 0, 0)

            # Idempotency: applying the full set twice must be a no-op. This is
            # the property the DO/EXCEPTION blocks in these migrations claim.
            log("")
            log(f"{DIM}Re-applying all migrations to check idempotency{RESET}")
            for path in migrations:
                try:
                    conn.execute(path.read_text())
                except Exception as exc:  # noqa: BLE001
                    log(f"  {YELLOW}NOT IDEMPOTENT{RESET} {path.name}")
                    log(f"       {exc}")
                    failures.append((f"idempotency:{path.name}", str(exc)))

            # ---- cases ------------------------------------------------------
            cases = sorted(CASES.glob("*.sql"))
            if args.filter:
                cases = [c for c in cases if args.filter in c.name]
            log("")
            log(f"Running {len(cases)} case(s)")
            log("")

            passed = 0
            for path in cases:
                title = case_title(path)
                try:
                    # Each case gets a fresh transaction that is always rolled
                    # back, so cases are order-independent.
                    with psycopg.connect(uri) as case_conn:
                        case_conn.execute(path.read_text())
                        case_conn.rollback()
                    log(f"  {GREEN}PASS{RESET}  {title}")
                    passed += 1
                except Exception as exc:  # noqa: BLE001
                    log(f"  {RED}FAIL{RESET}  {title}")
                    for line in first_lines(str(exc)):
                        log(f"        {line}")
                    failures.append((title, str(exc)))

            if args.keep:
                log("")
                log(f"{YELLOW}--keep set. Database left running:{RESET}")
                log(f"  psql '{uri}'")
                return report(failures, passed, len(cases), cleanup=False)

            return report(failures, passed, len(cases))
    finally:
        if not args.keep:
            try:
                server.cleanup()
            except Exception:  # noqa: BLE001, S110
                pass
            shutil.rmtree(datadir, ignore_errors=True)


def install_pgcrypto_stub(pgserver) -> None:
    """
    pgserver's bundled PostgreSQL has no contrib/pgcrypto, but the migrations
    call CREATE EXTENSION pgcrypto. Drop a stub into the server's extension
    directory so migrations apply unmodified. Skipped if real pgcrypto exists.
    """
    ext_dir = (
        pathlib.Path(pgserver.__file__).parent
        / "pginstall" / "share" / "postgresql" / "extension"
    )
    if not ext_dir.is_dir():
        log(f"{YELLOW}Could not locate pgserver extension dir; "
            f"skipping pgcrypto stub{RESET}")
        return
    if (ext_dir / "pgcrypto.so").exists() or (ext_dir / "pgcrypto--1.3.sql").exists():
        return
    stub = SHIM / "pgcrypto_stub"
    for src in stub.glob("pgcrypto*"):
        shutil.copy2(src, ext_dir / src.name)
    log(f"{DIM}Installed pgcrypto test stub into {ext_dir}{RESET}")


def case_title(path: pathlib.Path) -> str:
    """First `-- TEST: ...` comment in the file, else the filename."""
    match = re.search(r"^--\s*TEST:\s*(.+)$", path.read_text(), re.MULTILINE)
    return match.group(1).strip() if match else path.name


def first_lines(text: str, limit: int = 4) -> list[str]:
    lines = [ln for ln in text.splitlines() if ln.strip()]
    return lines[:limit]


def report(failures, passed, total, cleanup=True) -> int:
    log("")
    log("=" * 64)
    if failures:
        log(f"{RED}{len(failures)} failure(s){RESET}, {passed}/{total} cases passed")
        log("")
        for name, _ in failures:
            log(f"  {RED}x{RESET} {name}")
        return 1
    log(f"{GREEN}All {passed} case(s) passed{RESET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
