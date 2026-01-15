import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { storage } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

const statusColor = (status: string) => {
  if (status === "PAID") return "success";
  if (status === "CONFIRMED") return "warning";
  if (status === "PENDING_PAYMENT") return "info";
  if (status === "CANCELLED") return "default";
  return "default";
};

export default function MiniAppBookingsPage() {
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    setError("");
    setLoading(true);
    try {
      const lineUserId = storage.getLineUser()?.lineUserId;
      if (!lineUserId) throw new Error("กรุณาเชื่อมต่อ LINE ก่อนใช้งาน");
      const { data, error } = await supabase
        .from("bookings")
        .select("*, villas(name)")
        .eq("line_user_id", lineUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onCancel = async (id: string) => {
    setError("");
    try {
      const lineUserId = storage.getLineUser()?.lineUserId;
      if (!lineUserId) throw new Error("กรุณาเชื่อมต่อ LINE ก่อนใช้งาน");

      const { data: booking, error: readErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .eq("line_user_id", lineUserId)
        .single();
      if (readErr) throw readErr;

      const todayStr = new Date().toISOString().slice(0, 10);
      if (String(booking.checkin_date) <= todayStr) {
        throw new Error("เกินวันเข้าพัก ไม่สามารถยกเลิกได้");
      }

      const { error } = await supabase
        .from("bookings")
        .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await fetchBookings();
    } catch (e: any) {
      setError(e?.message ?? "ยกเลิกไม่สำเร็จ");
    }
  };

  if (loading) return <Alert severity="info">กำลังโหลด...</Alert>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={900}>การจองของฉัน</Typography>
        <Typography variant="body2" color="text.secondary">
          ตรวจสอบสถานะ ยืนยันการจอง และยกเลิกก่อนวันเข้าพัก
        </Typography>
      </Box>

      {bookings.map((b) => (
        <Card key={b.id} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography fontWeight={800}>{b.villas?.name ?? "Hotel Booking"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.checkin_date} → {b.checkout_date}
                  </Typography>
                </Box>
                <Chip label={b.status} color={statusColor(b.status) as any} variant="outlined" />
              </Stack>

              <Divider />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
                <Typography fontWeight={700}>ยอดรวม ฿{Number(b.total_amount).toFixed(2)}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => nav(`/booking/${b.id}`)}
                    fullWidth
                    sx={{ width: { sm: "auto" } }}
                  >
                    ดูใบจอง
                  </Button>
                  {b.status !== "CANCELLED" && b.status !== "PAID" && (
                    <Button
                      color="error"
                      variant="contained"
                      onClick={() => onCancel(b.id)}
                      fullWidth
                      sx={{ width: { sm: "auto" } }}
                    >
                      ยกเลิกการจอง
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!bookings.length && (
        <Card>
          <CardContent>
            <Typography fontWeight={800}>ยังไม่มีการจอง</Typography>
            <Typography variant="body2" color="text.secondary">
              ไปที่หน้าค้นหาเพื่อจองห้องพักแรกของคุณ
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
