import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const logs = await db.select({
            logId: activityLogs.logId,
            action: activityLogs.action,
            ipAddress: activityLogs.ipAddress,
            timestamp: activityLogs.timestamp,
            user: users.fullName
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.userId))
            .orderBy(desc(activityLogs.timestamp));

        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
