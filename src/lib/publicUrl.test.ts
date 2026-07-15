// Run with: npx tsx src/lib/publicUrl.test.ts
// Guards the URLs against the canonicals the brand sites actually emit
// (`${baseUrl}/${locale}${pathname}` — see build-brand-page-metadata.ts).
import assert from "node:assert/strict";
import { BRAND_APEX_HOSTS, buildPublicUrl } from "./publicUrl";

assert.equal(
  buildPublicUrl("blog", "happy", { slug: "foo", language: "fr" }),
  "https://www.happy-milo.com/fr/blog/foo",
);
assert.equal(
  buildPublicUrl("blog", "support", { slug: "foo", language: "en" }),
  "https://www.support-milo.com/en/blog/foo",
);
assert.equal(
  buildPublicUrl("template", "happy", { slug: "moms", language: "en" }),
  "https://www.happy-milo.com/en/happy-wall/audience/moms",
);
assert.equal(
  buildPublicUrl("date", "happy", { slug: "noel", language: "fr" }),
  "https://www.happy-milo.com/fr/happy-dates/noel",
);
assert.equal(
  buildPublicUrl("dateCategory", "happy", { slug: "fetes", language: "fr" }),
  "https://www.happy-milo.com/fr/happy-dates/categorie/fetes",
);
assert.equal(
  buildPublicUrl("spot", "happy", { slug: "parc", language: "fr" }),
  "https://www.happy-milo.com/fr/happy-spots/spot/parc",
);
assert.equal(
  buildPublicUrl("spotTag", "happy", { slug: "calme", language: "fr" }),
  "https://www.happy-milo.com/fr/happy-spots/tag/calme",
);

// Rows that are not addressable yet must not produce a bogus URL.
assert.equal(buildPublicUrl("blog", "happy", { language: "fr" }), null);
assert.equal(buildPublicUrl("blog", "happy", { slug: "foo" }), null);
assert.equal(buildPublicUrl("blog", "other", { slug: "a", language: "fr" }), null);
assert.equal(buildPublicUrl("blog", "happy", { slug: "  ", language: "fr" }), null);

// The API route validates inspection targets against these.
assert.deepEqual(
  [...BRAND_APEX_HOSTS].sort(),
  ["forever-milo.com", "happy-milo.com", "support-milo.com"],
);

console.log("publicUrl: all checks passed");
