import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { storage } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

const statusColor = (status: string) => {
  if (status === "PAID") return "success";
  if (status === "CONFIRMED") return "warning";
  if (status === "PENDING_PAYMENT") return "info";
  if (status === "CANCELLED") return "default";
  return "default";
};

export default function BookingReceiptPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        if (!id) {
          throw new Error("ไม่พบเลขที่การจอง");
        }
        const lineUserId = storage.getLineUser()?.lineUserId;
        if (!lineUserId) throw new Error("กรุณาเชื่อมต่อ LINE ก่อนใช้งาน");

        const { data, error } = await supabase
          .from("bookings")
          .select("*, villas(name)")
          .eq("id", id)
          .eq("line_user_id", lineUserId)
          .single();
        if (error) throw error;
        setBooking(data);
      } catch (e: any) {
        setError(e?.message ?? "โหลดใบจองไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (loading) return <Alert severity="info">กำลังโหลด...</Alert>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!booking) return <Alert severity="warning">ไม่พบข้อมูล</Alert>;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={900}>ใบจองห้องพัก</Typography>
          <Typography variant="body2" color="text.secondary">
            {booking.villas?.name ?? "Hotel Booking"}
          </Typography>
          <Chip
            label={booking.status}
            color={statusColor(booking.status) as any}
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Typography>Check-in: {booking.checkin_date}</Typography>
          <Typography>Check-out: {booking.checkout_date}</Typography>
          <Typography>ผู้เข้าพัก: ผู้ใหญ่ {booking.guests_adult} • เด็ก {booking.guests_child}</Typography>

          <Divider sx={{ my: 1 }} />

          <Typography>ยอดรวม: ฿{Number(booking.total_amount).toFixed(2)}</Typography>
          <Typography>ชำระแล้ว: ฿{Number(booking.paid_amount).toFixed(2)}</Typography>
          <Typography>คงเหลือ: ฿{Number(booking.balance_amount).toFixed(2)}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
