import { createHash, randomBytes } from "node:crypto";

import { signToken } from "../jwt";

const ACCESS_TOKEN_TTL = "1h";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export function signAccessToken(userId: number, clientId: string, scope: string): Promise<string> {
    return signToken({ sub: userId, client_id: clientId, scope }, ACCESS_TOKEN_TTL);
}

export function signIdToken(userId: number, clientId: string, issuer: string): Promise<string> {
    return signToken({ iss: issuer, sub: String(userId), aud: clientId }, ACCESS_TOKEN_TTL);
}

export function generateRefreshToken(): string {
    return randomBytes(40).toString("hex");
}

export function hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiry(): Date {
    const d = new Date();
    d.setDate(d.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return d;
}

export function generateAuthorizationCode(): string {
    return randomBytes(32).toString("base64url");
}

export function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
    const hash = createHash("sha256").update(codeVerifier).digest("base64url");
    return hash === codeChallenge;
}
