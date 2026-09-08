/**
 * Runs before any test module is imported. The unit tests only exercise pure
 * logic, but importing a service pulls in config/env.ts, which validates
 * process.env at import time and throws if these are missing. Stub the required
 * vars so the import graph loads. No real DB / Stripe / Resend is ever touched.
 */
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET ||= "test-session-secret-0123456789";
process.env.FRONTEND_URL ||= "http://localhost:5173";
process.env.NODE_ENV ||= "test";
