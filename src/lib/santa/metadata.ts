import type { Metadata } from "next";
import { getRequestAlias } from "./alias-request";

/** Shared generateMetadata for every /santa page: the tab title follows the alias. */
export async function santaMetadata(): Promise<Metadata> {
  const alias = await getRequestAlias();
  return { title: `${alias.name} · ClayDate`, description: alias.tagline };
}
