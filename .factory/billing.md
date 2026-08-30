# Billing status for this release

The factory product `rhythm-pedal-tidy` is not registered with the Sociobot
billing API: its checkout endpoint returned `404 {"error":"enabled factory
product"}` during repair. Repository instructions forbid this product repo from
changing billing infrastructure.

This release therefore ships **no billing flow**. It has no checkout link,
license field, license storage, license verification request, or Sociobot
billing origin in its CSP. The client’s billing-request allowance is exactly
zero; a `429` or `Retry-After` response cannot occur because the browser does
not call a billing endpoint. The `@claim:no-checkout` browser regression checks
that the public page has no billing URL and that available device controls are
not purchase-gated.

If the factory later registers a paid product, reintroduce the Sociobot-only
flow with an explicit checkout test. Verify once on a new token and then at
most once per 24 hours, cache the result locally, and honor any `429`
`Retry-After` response before issuing another verification request. Do not make
that change until a registered hosted checkout returns a successful redirect.
