import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: Record<string, string> | undefined, req) {
                // This is a placeholder. You should implement your own authentication logic here.
                if (credentials?.username === "admin" && credentials?.password === "admin") {
                    return { id: "1", name: "Admin", email: "admin@example.com", role: "Super Admin", status: "Active" }
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
    },
};
