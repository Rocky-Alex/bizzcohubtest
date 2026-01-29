import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "Super Admin" | "admin" | "Accountant" | "Customer" | "staff" | "Salesman";
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: "Super Admin" | "admin" | "Accountant" | "Customer" | "staff" | "Salesman";
        status: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "Super Admin" | "admin" | "Accountant" | "Customer" | "staff" | "Salesman";
    }
}
