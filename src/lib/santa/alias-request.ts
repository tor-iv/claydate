import { cache } from "react";
import { connection } from "next/server";
import { pickAlias, type Alias } from "./aliases";

/**
 * One alias per request, shared by generateMetadata (the <title>) and the
 * layout (header + hero) so they always agree. `connection()` opts the
 * render out of build-time prerendering, otherwise one alias would be baked
 * into the static HTML forever.
 *
 * ✍️ Optional (learning spot 3): if the header changing on every reload feels
 * jumpy for relatives, store an alias index in the session cookie at login
 * and read it here instead of rolling fresh.
 */
export const getRequestAlias = cache(async (): Promise<Alias> => {
  await connection();
  return pickAlias(Math.random);
});
