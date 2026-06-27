"use server";

import { revalidatePath } from "next/cache";

// Purge the cached live data (sheet + API-Football) for every route under the
// root layout. Triggered from the header logo so an open PWA can pull fresh
// scores/standings without being swiped closed and reopened.
export async function refreshData() {
  revalidatePath("/", "layout");
}
