import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { sql } from "./db";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.username || !credentials?.password) return null;

                const { username, password } = credentials;
                const passwordHash = createHash('sha256').update(password).digest('hex');

                try {
                    // Check against DB
                    const users = await sql`
                        SELECT * FROM users 
                        WHERE LOWER(username) = LOWER(${username}) 
                        AND password_hash = ${passwordHash}
                    `;

                    // Special handling for Admin (DB Persistence like in custom API)
                    if (users.length === 0 && username.toLowerCase() === 'admin' && password === 'Bizzcohub@2025') {
                        const existingAdmin = await sql`SELECT * FROM users WHERE LOWER(username) = 'admin'`;
                        let adminUser;

                        if (existingAdmin.length === 0) {
                            // Create Admin User
                            const newAdmin = await sql`
                                INSERT INTO users (username, password_hash, role, status, email, first_name, last_name)
                                VALUES ('admin', ${passwordHash}, 'admin', 'active', 'bizzcohubllc@gmail.com', 'Super', 'Admin')
                                RETURNING *
                            `;
                            adminUser = newAdmin[0];
                        } else {
                            adminUser = existingAdmin[0];
                            // Update password if mismatch (Self-healing)
                            if (adminUser.password_hash !== passwordHash) {
                                await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${adminUser.id}`;
                                adminUser.password_hash = passwordHash;
                            }
                        }
                        if (adminUser) users.push(adminUser);
                    }

                    // Special handling for Super Admin
                    if (users.length === 0 && username.toLowerCase() === 'superadmin' && password === 'Rishu0226@Bizzcohub') {
                        const existing = await sql`SELECT * FROM users WHERE LOWER(username) = 'superadmin'`;
                        let superUser;
                        if (existing.length === 0) {
                            superUser = (await sql`
                                INSERT INTO users (username, password_hash, role, status, email, first_name, last_name, phone)
                                VALUES ('superadmin', ${passwordHash}, 'superadmin', 'active', 'rishadpnpmksa@gmail.com', 'Super', 'Admin', '971')
                                RETURNING *
                             `)[0];
                        } else {
                            superUser = existing[0];
                            if (superUser.password_hash !== passwordHash) {
                                await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${superUser.id}`;
                                superUser.password_hash = passwordHash;
                            }
                        }
                        if (superUser) users.push(superUser);
                    }

                    if (users.length > 0) {
                        const user = users[0];
                        if (user.status !== 'active') return null;

                        return {
                            id: String(user.id),
                            name: (user.first_name || user.last_name) ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.username,
                            email: user.email,
                            role: user.role,
                            status: user.status,
                            image: user.avatar || user.image_url
                        };
                    }
                } catch (error) {
                    console.error("Auth error:", error);
                }

                return null;
            }
        })
    ],
    pages: {
        signIn: '/admin/login', // Redirect to the nice custom login page
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    }
};

