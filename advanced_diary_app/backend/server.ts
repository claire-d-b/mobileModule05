import express from "express";
import type { Request, Response, NextFunction } from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

app.get("/", (req, res) => {
  res.send("Backend works");
});

// Middlewares Express avant les routes
// Active CORS (Cross-Origin Resource Sharing). Sans ça, un navigateur bloquerait par défaut les requêtes venant d'une origine différente (par exemple, ton frontend sur localhost:8081 qui appelle ton backend sur localhost:3000
app.use(cors());
// Permet à Express de comprendre et parser automatiquement le corps des requêtes envoyées au format JSON (Content-Type: application/json). Sans ce middleware, req.body serait undefined quand un client envoie du JSON — avec lui, Express le parse et le rend disponible directement en objet JavaScript via req.body.
app.use(express.json());
// Pour les forms - parse les données du corps de la requete et les traduit en objet javascript accessible via req.body.
app.use(express.urlencoded({ extended: true }));

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || "claire",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "advanced_diary_app",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT) || 5432,
});

interface RegisterBody {
  login: string;
  password: string;
}
interface LoginBody {
  login: string;
  password: string;
}
interface GithubAuthBody {
  code: string;
}
interface GoogleAuthBody {
  token: string;
}
interface DiaryEntryBody {
  email: string;
  date: string;
  title: string;
  feeling: number;
  content: string;
}
interface GithubTokenResponse {
  access_token?: string;
  error?: string;
}
interface GithubProfile {
  id: number;
  login: string;
  email: string | null;
}
interface GoogleProfile {
  sub?: string;
  email: string;
}

interface JwtPayload {
  id: number;
  login: string;
}

// Étend Request pour porter l'utilisateur authentifié une fois le token vérifié
interface AuthRequest<P = {}, ResBody = any, ReqBody = any> extends Request<
  P,
  ResBody,
  ReqBody
> {
  userId?: number;
  userLogin?: string;
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "30d" });
}

// Middleware : vérifie le header "Authorization: Bearer <token>" et attache userId/userLogin à la requête
function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    req.userId = payload.id;
    req.userLogin = payload.login;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// REGISTER USER
app.post(
  "/user/register",
  async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const { login, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO users(login, password, provider)
       VALUES($1, $2, 'local')
       RETURNING id, login, provider, created_at`,
        [login, hashedPassword],
      );
      const user = result.rows[0];
      const token = signToken({ id: user.id, login: user.login });

      console.log("User registered:", user);
      res.json({ message: "Registration success", user, token });
    } catch (e: any) {
      console.error(e);
      // 23505 est le code d'erreur PostgreSQL pour une violation de contrainte unique
      if (e.code === "23505") {
        return res.status(400).json({ error: "Login already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  },
);

// LOGIN USER
app.post(
  "/user/login",
  async (req: Request<{}, {}, LoginBody>, res: Response) => {
    const { login, password } = req.body;
    try {
      const result = await pool.query("SELECT * FROM users WHERE login = $1", [
        login,
      ]);

      if (result.rows.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      const user = result.rows[0];

      if (user.provider !== "local") {
        return res.status(400).json({
          error: `Ce compte utilise ${user.provider}.`,
        });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid password" });
      }

      await pool.query("UPDATE users SET updated_at = NOW() WHERE id = $1", [
        user.id,
      ]);

      const token = signToken({ id: user.id, login: user.login });

      console.log("User logged in:", user.login);
      res.json({
        message: "Login success",
        user: { id: user.id, login: user.login, provider: user.provider },
        token,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

// AUTH GITHUB
app.post(
  "/auth/github",
  async (req: Request<{}, {}, GithubAuthBody>, res: Response) => {
    const { code } = req.body;
    console.log("GitHub code reçu:", code);
    try {
      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
          }),
        },
      );
      const data = (await response.json()) as GithubTokenResponse;
      if (data.error) return res.status(400).json({ error: data.error });

      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const emails = (await emailsRes.json()) as {
        email: string;
        primary: boolean;
      }[];
      const login = emails
        .filter((e) => e.primary === true)
        .map((e) => e.email)[0];

      const profile = (await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }).then((r) => r.json())) as GithubProfile;

      const result = await pool.query(
        `INSERT INTO users (login, provider, provider_id, created_at)
        VALUES ($1, 'github', $2, NOW())
        ON CONFLICT (login) DO UPDATE
        SET provider = 'github', provider_id = $2, updated_at = NOW()
        RETURNING id, login, provider`,
        [login, String(profile.id)],
      );

      const user = result.rows[0];
      const token = signToken({ id: user.id, login: user.login });

      console.log("GitHub user upserted:", user);
      // result.rows[0] -> la première — et seule — ligne renvoyée par le RETURNING de la requête SQL juste avant)
      res.json({ user, token });
    } catch (e) {
      console.error("GitHub auth error:", e);
      res.status(500).json({ error: "GitHub auth failed" });
    }
  },
);

// AUTH GOOGLE
app.post(
  "/auth/google",
  async (req: Request<{}, {}, GoogleAuthBody>, res: Response) => {
    const { token: googleAccessToken } = req.body;
    try {
      const profile = (await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        },
      ).then((r) => r.json())) as GoogleProfile;
      console.log("Google profile:", profile);

      if (!profile.sub)
        return res.status(400).json({ error: "Invalid Google token" });

      // Upsert — crée ou met à jour l'utilisateur
      const result = await pool.query(
        `INSERT INTO users (login, provider, provider_id, created_at)
       VALUES ($1, 'google', $2, NOW())
       ON CONFLICT (login) DO UPDATE
       SET provider = 'google',
           provider_id = $2,
           updated_at = NOW()
       RETURNING id, login, provider`,
        [profile.email, String(profile.sub)],
      ); // Concrètement, sub est l'identifiant unique et permanent de ce compte Google — un numéro qui ne change jamais, propre à ce compte utilisateur spécifique.

      const user = result.rows[0];
      const token = signToken({ id: user.id, login: user.login });

      console.log("Google user upserted:", user);
      res.json({ user, token });
    } catch (e) {
      console.error("Google auth error:", e);
      res.status(500).json({ error: "Google auth failed" });
    }
  },
);

// CREATE DIARY ENTRY
app.post(
  "/entries",
  requireAuth,
  async (req: AuthRequest<{}, {}, DiaryEntryBody>, res: Response) => {
    const { date, title, feeling, content } = req.body;
    try {
      // On utilise l'utilisateur authentifié (req.userId), pas un email envoyé par le client
      const user_id = req.userId!;
      const result = await pool.query(
        `INSERT INTO diary_entries (user_id, date, title, feeling, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_id, date, title, feeling, content],
      );
      res.json(result.rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create entry" });
    }
  },
);

// GET ENTRIES FOR USER
app.get(
  "/entries/:email",
  requireAuth,
  async (req: AuthRequest<{ email: string }>, res: Response) => {
    const { email } = req.params;

    // Un utilisateur ne peut lire que ses propres entrées
    if (req.userLogin !== email) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const page = Number(req.query.page ?? 0);
    const limit = 6;
    const offset = page * limit;

    try {
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM diary_entries e
       JOIN users u ON e.user_id = u.id
       WHERE u.login = $1`,
        [email],
      );
      const total = Number(countResult.rows[0].count);
      // offset : combien d'entrées "sauter" avant de commencer à lire (page 0 → offset 0, page 1 → offset 6, page 2 → offset 12...).
      // e and u aliases for diary entries and users
      const result = await pool.query(
        `SELECT e.* FROM diary_entries e
       JOIN users u ON e.user_id = u.id
       WHERE u.login = $1
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
        [email, limit, offset],
      );

      res.json({
        entries: result.rows,
        hasNext: offset + limit < total,
        hasPrev: page > 0,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  },
);

// GET COUNT OF ENTRIES FOR USER
app.get(
  "/entries/:login/count",
  requireAuth,
  async (req: AuthRequest<{ login: string }>, res: Response) => {
    const { login } = req.params;

    if (req.userLogin !== login) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const result = await pool.query(
        `SELECT COUNT(*) 
         FROM diary_entries e
         JOIN users u ON e.user_id = u.id
         WHERE u.login = $1`,
        [login],
      );

      res.json({ count: parseInt(result.rows[0].count) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to count entries" });
    }
  },
);

// GET FEELING STATS FOR USER
app.get(
  "/entries/:email/stats",
  requireAuth,
  async (req: AuthRequest<{ email: string }>, res: Response) => {
    const { email } = req.params;

    if (req.userLogin !== email) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const result = await pool.query(
        `SELECT feeling, COUNT(*) as count
       FROM diary_entries e
       JOIN users u ON e.user_id = u.id
       WHERE u.login = $1
       GROUP BY feeling
       ORDER BY feeling`,
        [email],
      );
      // sum : l'accumulateur — la somme calculée jusqu'à présent.
      // r : la ligne actuelle du tableau (ex: { feeling: "2", count: "3" }).
      // parseInt(r.count) : convertit le count (qui est du texte, car PostgreSQL renvoie les nombres sous forme de string) en vrai nombre.
      // 0 : la valeur de départ de sum (on commence à compter à partir de zéro).
      const total = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
      const stats = [1, 2, 3, 4, 5].reduce(
        (acc, f) => {
          const row = result.rows.find((r) => parseInt(r.feeling) === f);
          const count = row ? parseInt(row.count) : 0;
          acc[f] = {
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          };
          return acc;
        },
        {} as Record<number, { count: number; percentage: number }>,
      );

      res.json({ stats, total });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
);

// DELETE DIARY ENTRY
app.delete(
  "/entries/:id",
  requireAuth,
  async (req: AuthRequest<{ id: string }>, res: Response) => {
    const { id } = req.params;
    try {
      // On vérifie que l'entrée appartient bien à l'utilisateur authentifié avant de supprimer
      const result = await pool.query(
        "DELETE FROM diary_entries WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, req.userId],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }
      console.log("Entry deleted:", result.rows[0]);
      res.json({ message: "Entry deleted", entry: result.rows[0] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete entry" });
    }
  },
);

// GET ENTRIES FOR USER BY DATE
app.get(
  "/entries/:email/date/:date",
  requireAuth,
  async (req: AuthRequest<{ email: string; date: string }>, res: Response) => {
    const { email, date } = req.params;

    if (req.userLogin !== email) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const page = Number(req.query.page ?? 0);
    const limit = 4;
    const offset = page * limit;

    try {
      // Count total pour la pagination
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM diary_entries e
         JOIN users u ON e.user_id = u.id
         WHERE u.login = $1 AND e.date = $2`,
        [email, date],
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT e.* FROM diary_entries e
         JOIN users u ON e.user_id = u.id
         WHERE u.login = $1 AND e.date = $2
         ORDER BY e.updated_at DESC
         LIMIT $3 OFFSET $4`,
        [email, date, limit, offset],
      );

      res.json({
        entries: result.rows,
        page,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 0,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch entries by date" });
    }
  },
);

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on 3000");
});
