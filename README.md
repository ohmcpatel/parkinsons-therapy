# Parkinson's therapy prototype

A drawing and motor-practice interface with calibration exercises, image-to-stencil exploration, and progress views.

Built with Next.js 15, React 19, TypeScript, and Tailwind. This is an early prototype, not a clinically validated therapy or diagnostic tool.

## Explore the source

| Area | Path |
| --- | --- |
| Calibration | `app/calibration/` |
| Drawing interface | `app/drawing/`, `components/CanvasDraw.tsx` |
| Image upload and gallery | `app/upload/`, `app/gallery/` |
| Analytics | `app/analytics/`, `components/Graphs.tsx` |
| Upload and storage routes | `app/api/`, `lib/s3.js` |

## Local setup status

The repository is a source snapshot, not a complete standalone installation. Several routes import `@/lib/firebase`, but that module is not included. You must supply your own Firebase configuration and the AWS storage configuration before those flows can work.

The S3 client reads `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`; upload routes also use `AWS_BUCKET_NAME`. Keep credentials in local environment variables.

After restoring the required configuration, the frontend commands are:

```bash
npm install
npm run dev
```

The default development URL is `http://localhost:3000`. Dependencies are from the original prototype and may need reconciliation before a fresh deployment.

For questions or implementation details, [open an issue](https://github.com/ohmcpatel/parkinsons-therapy/issues).
