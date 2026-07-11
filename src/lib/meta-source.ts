import { runtimeEnv } from "@/lib/runtime-env";

/** Lead.source value for Meta Lead Ads instant forms (not website LP). */
export const META_INSTANT_FORM_SOURCE = "meta_instant_form";

export function isMetaInstantFormSource(source: string | null | undefined): boolean {
  return source === META_INSTANT_FORM_SOURCE;
}

export function metaInstantFormEnabled(): boolean {
  return runtimeEnv("META_INSTANT_FORM_ENABLED") !== "false";
}
