# Vercel upload filesystem fix

The backend previously tried to create upload folders inside the deployed application bundle (`/var/task/backend/uploads`). Vercel's deployed function filesystem is not a persistent writable location.

The upload middleware now uses the writable temporary directory (`os.tmpdir()`) when `VERCEL` is set, and keeps the existing `backend/uploads` location for local development. The Express static `/uploads` route and old-file cleanup use the same selected directory.

## Important limitation

Vercel temporary storage is ephemeral and may not be shared between function instances. This change prevents the startup crash and allows temporary uploads to be processed, but it is **not durable image storage**. For production profile photos and booking photos that must remain available, configure a persistent object-storage service (for example, Cloudinary, AWS S3, or another compatible storage provider) and update the upload flow to store files there.
