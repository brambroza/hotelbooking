import  { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { supabase } from "../../lib/supabase";

type BookingRow = {
  id: string;
  status: string;
  total_amount: number;
  checkin_date: string;
  checkout_date: string;
  customer_name: string;
  villas?: { name: string } | null;
};

type Metrics = {
  total: number;
  pending: number;
  confirmed: number;
  paid: number;
  cancelled: number;
};

const statusColor = (status: string) => {
  if (status === "PAID") return "success";
  if (status === "CONFIRMED") return "warning";
  if (status === "PENDING_PAYMENT") return "info";
  if (status === "CANCELLED") return "default";
  return "default";
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    pending: 0,
    confirmed: 0,
    paid: 0,
    cancelled: 0,
  });
  const [recent, setRecent] = useState<BookingRow[]>([]);

  const fmt = useMemo(() => new Intl.NumberFormat("th-TH"), []);

  useEffect(() => {
    const fetchMetrics = async () => {
      const [total, pending, confirmed, paid, cancelled] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "PENDING_PAYMENT"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "PAID"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "CANCELLED"),
      ]);

      setMetrics({
        total: total.count ?? 0,
        pending: pending.count ?? 0,
        confirmed: confirmed.count ?? 0,
        paid: paid.count ?? 0,
        cancelled: cancelled.count ?? 0,
      });
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, status, total_amount, checkin_date, checkout_date, customer_name, villas(name)")
        .order("created_at", { ascending: false })
        .limit(6);

     
    };

    fetchMetrics();
    fetchRecent();
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ภาพรวมการจองและสถานะล่าสุดของพูลวิลล่า
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {[
          { label: "Total Bookings", value: metrics.total, tone: "#dff3ee", chip: "All" },
          { label: "Pending Payment", value: metrics.pending, tone: "#e6f1ff", chip: "Hold" },
          { label: "Confirmed", value: metrics.confirmed, tone: "#fff4d8", chip: "Confirm" },
          { label: "Paid", value: metrics.paid, tone: "#e3f7e9", chip: "Paid" },
          { label: "Cancelled", value: metrics.cancelled, tone: "#fbe7e9", chip: "Cancel" },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.label}>
            <Card sx={{ background: card.tone }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Chip label={card.chip} size="small" />
                  </Stack>
                  <Typography variant="h4" fontWeight={800}>
                    {fmt.format(card.value)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={800}>Recent Bookings</Typography>
                  <Typography variant="body2" color="text.secondary">
                    อัปเดตล่าสุด 6 รายการ
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {recent.map((b) => (
                    <Box
                      key={b.id}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.75)",
                        border: "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                        <Box>
                          <Typography fontWeight={700}>{b.villas?.name ?? "Hotel Booking"}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {b.customer_name} • {b.checkin_date} → {b.checkout_date}
                          </Typography>
                        </Box>
                        <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.5}>
                          <Chip label={b.status} size="small" color={statusColor(b.status) as any} />
                          <Typography fontWeight={700}>฿{fmt.format(Number(b.total_amount || 0))}</Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>Today Overview</Typography>
                <Stack spacing={1}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f6f8fb" }}>
                    <Typography variant="body2" color="text.secondary">Check-in วันนี้</Typography>
                    <Typography variant="h5" fontWeight={800}>{fmt.format(metrics.confirmed + metrics.paid)}</Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f6f8fb" }}>
                    <Typography variant="body2" color="text.secondary">Hold ที่รอชำระ</Typography>
                    <Typography variant="h5" fontWeight={800}>{fmt.format(metrics.pending)}</Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f6f8fb" }}>
                    <Typography variant="body2" color="text.secondary">ยกเลิกสะสม</Typography>
                    <Typography variant="h5" fontWeight={800}>{fmt.format(metrics.cancelled)}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
