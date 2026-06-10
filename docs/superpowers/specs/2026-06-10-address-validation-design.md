# Address Validation UX — Design Spec
**Date:** 2026-06-10
**Status:** Approved

## Problem

When a user types into the address field but does not select from the Google Places autocomplete dropdown, the hidden `suburb` field remains empty. On submit, two errors fire:

1. Browser constraint validation tries to focus the hidden `required` suburb/postcode inputs and fails: *"An invalid form control with name='suburb' is not focusable"* — this blocks the custom JS validation from running.
2. Even if JS validation runs, the error message appears at the bottom of the form with no visual cue on the address field itself.

## Goals

- Fix the browser constraint validation error (hidden required fields).
- Give the user a clear visual signal — on blur and on submit — when they have typed an address but not properly confirmed it.
- Keep existing manual entry toggle behaviour intact.

## Out of Scope

- Migration from `google.maps.places.Autocomplete` to `PlaceAutocompleteElement` (cosmetic warning only; deferred).

---

## Section 1: Fix Hidden Required Fields

**File:** `index.html`

Remove the `required` attribute from the `suburb` (`#suburbField`) and `postcode` (`#postcodeField`) inputs in the HTML. They are hidden by default (`display: none`) and the browser must never attempt to validate them in that state.

The manual entry toggle (`#manualEntryToggle`) already adds `required` when the fields are shown and removes it when hidden — that logic is unchanged.

The JS submit handler continues to enforce address completeness via the `addressConfirmed` flag (Section 4).

---

## Section 2: Autocomplete Selection Tracking

**File:** `index.html` — `setupPlacesAutocomplete()` and surrounding JS

Add a module-level boolean `let addressConfirmed = false`.

| Event | Action |
|---|---|
| `place_changed` fires with valid `address_components` | `addressConfirmed = true` |
| User edits `#addressInput` (`input` event) | `addressConfirmed = false`, clear any inline hint |
| Manual entry toggle opened | `addressConfirmed = true` |
| Manual entry toggle closed | `addressConfirmed = false` |

---

## Section 3: Inline Blur Hint

**File:** `index.html`

Add a `<p id="addressHint">` element directly below `#addressInput` (initially hidden).

On `blur` of `#addressInput`:
- If `addressInput.value` is non-empty AND `addressConfirmed === false` AND manual entry is not open:
  - Show `#addressHint` with text: *"Please select an address from the suggestions above, or use 'Can't find your address?' below."*
  - Style: amber text (`#856404`), amber background (`#fff3cd`), small padding, `font-size: 12px`, border-radius.

On `focus` of `#addressInput`:
- Hide `#addressHint`.

When `addressConfirmed` becomes `true`:
- Hide `#addressHint`.
- Remove any red border from `#addressInput`.

---

## Section 4: Submit Validation

**File:** `index.html` — form `submit` handler

Replace the existing `if (!suburbInput.value)` check with:

```
const manualOpen = suburbField.style.display !== 'none';
if (!addressConfirmed && !manualOpen) {
  // show red error near address field, scroll into view
  return;
}
```

On failure:
- Add `border: 2px solid #dc3545` to `#addressInput`.
- Show `#addressHint` in red style (`#721c24` / `#f8d7da`) with: *"Please select your address from the suggestions, or click 'Can't find your address?' to enter manually."*
- `addressInput.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- Do **not** show the bottom `formMessage` for this error (the inline hint is sufficient).

The downstream `SYDNEY_POSTCODES` postcode check is unaffected — it runs after address is confirmed.

---

## Error Message Copy

| Trigger | Style | Text |
|---|---|---|
| Blur (soft) | Amber | "Please select an address from the suggestions above, or use 'Can't find your address?' below." |
| Submit (hard) | Red | "Please select your address from the suggestions, or click 'Can't find your address?' to enter manually." |
