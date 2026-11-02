"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Small, optional sign in link for the header. Hidden when accounts are turned off.
export default function AccountLink() {
  const [state, setState] = useState<{ accounts: boolean; email: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/plus/status")
      .then((r) => r.json())
      .then((d) => setState({ accounts: Boolean(d.accounts), email: d.email ?? null }))
      .catch(() => {});
  }, []);

  if (!state?.accounts) return null;
  return (
    <Link href="/account" className="account-link">
      {state.email ? "Account" : "Sign in"}
    </Link>
  );
}
