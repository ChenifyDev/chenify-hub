import { getStorage, toPublicUser } from "../storage";
import { signToken } from "../jwt";
import { FORM_REQUIRED, jsonError, getAuthUser } from "./util";
import { saveAvatar, type RouteMap } from "../utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const routes = {
    "/api/auth/register": async (req) => {
        const storage = getStorage();
        const form = await req.formData().catch(() => null);
        if (!form) return jsonError(400, FORM_REQUIRED);
        const field = (name: string) => form.get(name)?.toString().trim() ?? "";
        const username = field("username");
        const email = field("email").toLowerCase();
        const password = field("password");

        if (!username || !email || !password) {
            return jsonError(400, "用户名、密码、邮箱均为必填项");
        }
        if (username.length < 2 || username.length > 32) {
            return jsonError(400, "用户名长度需在 2-32 个字符之间");
        }
        if (password.length < 6) {
            return jsonError(400, "密码长度至少为 6 位");
        }
        if (!EMAIL_REGEX.test(email)) {
            return jsonError(400, "邮箱格式不正确");
        }

        const [emailTaken, nameTaken] = await Promise.all([
            storage.users.findUserByEmail(email),
            storage.users.findUserByUsername(username),
        ]);
        if (emailTaken) return jsonError(409, "该邮箱已被注册");
        if (nameTaken) return jsonError(409, "该用户名已被使用");

        let avatar: string | null = null;
        const avatarFile = form.get("avatar");
        if (avatarFile instanceof File && avatarFile.size > 0) {
            const saved = await saveAvatar(avatarFile);
            if ("error" in saved) return saved.error;
            avatar = saved.path;
        }

        const passwordHash = await Bun.password.hash(password, {
            algorithm: "argon2id",
            memoryCost: 65536,
            timeCost: 3,
        });
        const user = await storage.users.createUser(username, email, passwordHash, avatar);
        return Response.json(user, { status: 201 });
    },

    "/api/auth/login": async (req) => {
        const body = (await req.json().catch(() => null)) as { login?: string; password?: string } | null;
        const login = body?.login?.trim() ?? "";
        const password = body?.password ?? "";
        if (!login || !password) {
            return jsonError(400, "用户名和密码均为必填项");
        }

        const user = await getStorage().users.findUserByUsernameOrEmail(login);
        if (!user || !(await Bun.password.verify(password, user.password_hash))) {
            return jsonError(401, "用户名或密码错误");
        }

        const token = await signToken({ sub: user.id, username: user.username, email: user.email });
        return Response.json({ token, user: toPublicUser(user) });
    },

    "/api/auth/me": async (req) => {
        const user = await getAuthUser(req);
        if (!user) return jsonError(401, "未提供有效登录凭证");
        return Response.json(user);
    },
} satisfies RouteMap;
