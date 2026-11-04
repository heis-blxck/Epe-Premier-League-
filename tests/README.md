# Tests

These are legacy/manual checks rather than an automated test suite. They are
excluded from TypeScript compilation and from the production build.

- `legacy/` — standalone Node/TypeScript scripts used for Firebase, Firestore,
  API, and data checks during development.
- `manual/` — HTML pages used to verify audio and browser behavior by hand.

Many `legacy/` scripts import modules with paths relative to the old repository
root. Update those paths if you need to run them again.
