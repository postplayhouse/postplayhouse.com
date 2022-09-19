throw new Error("@migration task: Update load function (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");

import { load as p } from "../../data/load"
export const load = p
