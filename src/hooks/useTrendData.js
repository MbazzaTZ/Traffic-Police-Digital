// ============================================================
// useTrendData — fetches 7-day daily counts for a Supabase table
// ------------------------------------------------------------
// Returns an array of { date, v } objects (7 entries, oldest first)
// suitable for passing to the Sparkline component.
//
// Usage:
//   const trend = useTrendData("incident_reports", "created_at");
//   // trend = [{date:"Mon",v:3},{date:"Tue",v:5},...]
//   <Sparkline data={trend} color="#DC2626" />
// ============================================================

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useTrendData(table, dateColumn = "created_at", filter = null) {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        let q = supabase
          .from(table)
          .select(dateColumn)
          .gte(dateColumn, sevenDaysAgo)
          .order(dateColumn, { ascending: true });

        // Apply optional filter (e.g. { column: "status", value: "open" })
        if (filter && filter.column && filter.value) {
          q = q.eq(filter.column, filter.value);
        }

        const { data, error } = await q;
        if (error) { setTrend([]); return; }

        // Initialize 7-day buckets (Mon-Sun or last 7 days)
        const days = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const key = d.toLocaleDateString("en-GB", { weekday: "short" });
          days[key] = 0;
        }

        // Count records per day
        (data || []).forEach(row => {
          const d = new Date(row[dateColumn]);
          const key = d.toLocaleDateString("en-GB", { weekday: "short" });
          if (key in days) days[key]++;
        });

        setTrend(Object.entries(days).map(([date, v]) => ({ date, v })));
      } catch {
        setTrend([]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [table, dateColumn, JSON.stringify(filter)]);

  return { trend, loading };
}

// Helper to build sparkline data from an existing array of records
// (avoids an extra DB query if you already have the data)
export function buildTrendFromRecords(records, dateColumn = "created_at") {
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toLocaleDateString("en-GB", { weekday: "short" });
    days[key] = 0;
  }
  (records || []).forEach(row => {
    if (!row[dateColumn]) return;
    const d = new Date(row[dateColumn]);
    const key = d.toLocaleDateString("en-GB", { weekday: "short" });
    if (key in days) days[key]++;
  });
  return Object.entries(days).map(([date, v]) => ({ date, v }));
}
