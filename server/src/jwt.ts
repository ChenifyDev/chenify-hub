import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET 必须设置");
}
if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set. Using default secret for development.");
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "chenify-dev-secret");
const DEFAULT_TTL = `${Number(process.env.JWT_EXPIRES_DAYS ?? 7)}d`;

export async function signToken(payload: Record<string, unknown>, expiresIn = DEFAULT_TTL): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(SECRET);
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as Record<string, unknown>;
    } catch {
        return null;
    }
}
