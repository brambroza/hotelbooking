import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { supabase } from "../../lib/supabase";

export default function MiniAppPromosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setError("");
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("promos")
          .select("id, code, name, description, discount_type, percent, amount, max_discount, start_at, end_at, is_active")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const now = Date.now();
        const filtered = (data ?? []).filter((p) => {
          const startOk = !p.start_at || new Date(p.start_at).getTime() <= now;
          const endOk = !p.end_at || new Date(p.end_at).getTime() >= now;
          return startOk && endOk;
        });
        setPromos(filtered);
      } catch (e: any) {
        setError(e?.message ?? "โหลดโปรโมชันไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <Alert severity="info">กำลังโหลด...</Alert>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={900}>โปรโมชันล่าสุด</Typography>
        <Typography variant="body2" color="text.secondary">
          ใช้รหัสส่วนลดในหน้าค้นหาเพื่อรับราคาพิเศษ
        </Typography>
      </Box>

      {promos.map((p) => (
        <Card key={p.id} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                <Typography variant="h6" fontWeight={800}>{p.name || p.code}</Typography>
                <Chip label={p.code} color="secondary" variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {p.description || "—"}
              </Typography>
              <Typography fontWeight={700}>
                {p.discount_type === "PERCENT" ? `${p.percent}%` : `฿${Number(p.amount).toFixed(0)}`}
                {p.max_discount ? ` (ลดสูงสุด ฿${Number(p.max_discount).toFixed(0)})` : ""}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!promos.length && (
        <Card>
          <CardContent>
            <Typography fontWeight={800}>ยังไม่มีโปรโมชัน</Typography>
            <Typography variant="body2" color="text.secondary">
              ติดตามโปรโมชันใหม่ได้เร็ว ๆ นี้
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
