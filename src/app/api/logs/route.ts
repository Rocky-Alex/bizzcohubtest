import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const logs = await db.select({
            id: activityLogs.id,
            action: activityLogs.action,
            details: activityLogs.details,
            ip: activityLogs.ip,
            timestamp: activityLogs.timestamp,
            userName: activityLogs.userName,
            role: activityLogs.role,
            status: activityLogs.status
        })
            .from(activityLogs)
            .orderBy(desc(activityLogs.timestamp));

        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
