import { createFileRoute } from "@tanstack/react-router";
import { dbSource, getSql } from "@/lib/db";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const sql = await getSql();
          await sql.query("select 1 as ok");
          return Response.json({ ok: true, db: dbSource });
        } catch {
          return Response.json({ ok: false, db: dbSource }, { status: 503 });
        }
      },
    },
  },
});
