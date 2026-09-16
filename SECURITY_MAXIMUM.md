# Security setup

## No-billing baseline

- Firestore Rules protect user data by Firebase Auth UID.
- Knowledge Base is publicly readable and admin-only writable.
- Firebase Storage is not required and is not activated on the Spark plan.
- Cloud Functions are included as optional server-side code, but deploying them requires a billing-enabled Firebase project.

## Optional App Check

The frontend supports the current Firebase Web App Check provider: `ReCaptchaEnterpriseProvider`.

1. Create a reCAPTCHA Enterprise score-based Web key in Google Cloud.
2. Register it under Firebase Console → App Check → your Web app → Fraud Defense.
3. Put the public site key in `.env.local` as:

```env
VITE_FIREBASE_APPCHECK_ENTERPRISE_SITE_KEY=your_public_site_key
```

4. Rebuild and redeploy the frontend.
5. Monitor App Check metrics before enabling enforcement.

The code intentionally does not initialize App Check when the environment variable is empty, so local development continues to work.

## Important billing note

Cloud Functions and Cloud Storage may require the Blaze plan. Do not enable them if the project must remain strictly on Spark.
