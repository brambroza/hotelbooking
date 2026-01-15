import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { storage } from "../../lib/storage";
import { supabase } from "../../lib/supabase";
import type { SearchResult } from "./types";

const fmt = (v: number | null | undefined) => (v == null ? "-" : `฿${Number(v).toFixed(2)}`);

export default function MiniAppSearchPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fieldSize = isMobile ? "small" : "medium";
  const [checkin, setCheckin] = useState(dayjs().add(2, "day").format("YYYY-MM-DD"));
  const [checkout, setCheckout] = useState(dayjs().add(3, "day").format("YYYY-MM-DD"));
  const [adult, setAdult] = useState(2);
  const [child, setChild] = useState(0);
  const [promo, setPromo] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string>("");

  const [openBook, setOpenBook] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [holdResp, setHoldResp] = useState<any>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const ensureLineUser = () => {
    if (!storage.getLineUser()?.lineUserId) {
      throw new Error("กรุณาเชื่อมต่อ LINE ก่อนใช้งาน");
    }
  };

  const onSearch = async () => {
    setError("");
    setLoading(true);
    try {
      ensureLineUser();
      const lineUserId = storage.getLineUser()!.lineUserId;
      const { data, error } = await supabase.rpc("search_villas_v3", {
        p_checkin: checkin,
        p_checkout: checkout,
        p_guests_adult: adult,
        p_guests_child: child,
        p_include_soldout: false,
        p_line_user_id: lineUserId,
        p_promo_code: promo || null,
      });
      if (error) throw error;
      setResults((data ?? []) as SearchResult[]);
    } catch (e: any) {
      setError(e?.message ?? "ค้นหาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const onOpenHold = (row: SearchResult) => {
    setSelected(row);
    setOpenBook(true);
    setHoldResp(null);
    setPaymentInfo(null);
    setCustomerName("");
    setCustomerPhone("");
  };

  const onCreateHold = async () => {
    if (!selected) return;
    setError("");
    setPaymentInfo(null);
    setHoldResp(null);
    setPaymentLoading(false);

    try {
      ensureLineUser();
      const lineUserId = storage.getLineUser()!.lineUserId;
      const holdExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { data: quoteRows, error: qErr } = await supabase.rpc("quote_villa_v3", {
        p_villa_id: selected.villa_id,
        p_checkin: checkin,
        p_checkout: checkout,
        p_guests_adult: adult,
        p_guests_child: child,
        p_line_user_id: lineUserId,
        p_promo_code: promo || null,
      });
      if (qErr) throw qErr;
      const quote = quoteRows?.[0];
      if (!quote?.is_available) {
        throw new Error("ห้องพักไม่ว่าง");
      }

      const total = Number(
        quote.total_after_discount ?? quote.total_after_member ?? quote.total_before_member ?? 0
      );
      const deposit = Math.round(total * 0.3 * 100) / 100;

      const { data: booking, error: bErr } = await supabase
        .from("bookings")
        .insert({
          villa_id: selected.villa_id,
          line_user_id: lineUserId,
          customer_name: customerName,
          customer_phone: customerPhone,
          checkin_date: checkin,
          checkout_date: checkout,
          guests_adult: adult,
          guests_child: child,
          status: "PENDING_PAYMENT",
          hold_expires_at: holdExpiresAt,
          price_snapshot: quote,
          total_amount: total,
          deposit_amount: deposit,
          paid_amount: 0,
          balance_amount: total,
          promo_code: promo || null,
        })
        .select("*")
        .single();
      if (bErr) throw bErr;

      setHoldResp({
        booking,
        paymentOptions: { depositAmount: deposit, fullAmount: total, holdExpiresAt },
      });
    } catch (e: any) {
      setError(e?.message ?? "จองไม่สำเร็จ");
    }
  };

  const onPay = async (payKind: "DEPOSIT" | "FULL") => {
    if (!holdResp?.booking?.id) return;
    setPaymentLoading(true);
    setPaymentInfo(null);
    setError("ฟีเจอร์ชำระเงินต้องใช้ Backend หรือ Edge Function");
    setPaymentLoading(false);
  };

  const onPoll = async () => {
    setPaymentInfo(null);
  };

  const onOpenDetail = async (row: SearchResult) => {
    setDetail(null);
    setDetailError("");
    setOpenDetail(true);
    setDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from("villas")
        .select("*, villa_images(*), villa_amenities(amenity_code, amenities(*))")
        .eq("id", row.villa_id)
        .single();
      if (error) throw error;
      setDetail(data);
    } catch (e: any) {
      setDetailError(e?.message ?? "โหลดรายละเอียดไม่สำเร็จ");
    } finally {
      setDetailLoading(false);
    }
  };

  const priceBadge = useMemo(() => {
    if (!results.length) return null;
    const min = Math.min(...results.map((r) => Number(r.total_after_discount ?? 999999)));
    return `เริ่มต้น ${fmt(min)}`;
  }, [results]);

  return (
    <Stack spacing={3}>
      <Card
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          background: "linear-gradient(120deg, rgba(15,106,107,0.12), rgba(244,185,91,0.18))",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800}>
                จองห้องพักแบบพรีเมียม
              </Typography>
              <Typography variant="body1" color="text.secondary">
                เลือกวันเข้าพัก ดูราคาแบบเรียลไทม์ และชำระเงินได้ทันที
              </Typography>
            </Box>

            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Check-in"
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size={fieldSize}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Check-out"
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size={fieldSize}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="ผู้ใหญ่"
                    value={adult}
                    onChange={(e) => setAdult(Number(e.target.value))}
                    size={fieldSize}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="เด็ก"
                    value={child}
                    onChange={(e) => setChild(Number(e.target.value))}
                    size={fieldSize}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Promo code"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    size={fieldSize}
                  />
                </Grid>
              </Grid>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              <Button size="large" fullWidth={isMobile} variant="contained" onClick={onSearch} disabled={loading}>
                {loading ? "กำลังค้นหา..." : "ค้นหาห้องว่าง"}
              </Button>
              {priceBadge && <Chip label={priceBadge} color="primary" variant="outlined" />}
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {results.map((r) => {
          const isAvailable = r.is_available;
          return (
          <Card key={r.villa_id} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                <Box
                  sx={{
                    width: { xs: "100%", md: 220 },
                    height: { xs: 200, md: 160 },
                    borderRadius: 3,
                    bgcolor: "rgba(15,106,107,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  Pool Villa
                </Box>

                  <Stack spacing={1} flex={1}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" fontWeight={800}>{r.villa_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {r.bedrooms} ห้องนอน • {r.bathrooms} ห้องน้ำ • รองรับสูงสุด {r.max_guests} คน
                        </Typography>
                      </Box>
                      <Chip
                        label={isAvailable ? "พร้อมจอง" : "เต็มแล้ว"}
                        color={isAvailable ? "success" : "default"}
                        variant="outlined"
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      {r.member_discount_amount && r.member_discount_amount > 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                          {fmt(r.total_before_member)}
                        </Typography>
                      ) : null}
                      <Typography variant="h6" fontWeight={900}>{fmt(r.total_after_discount)}</Typography>
                      <Typography variant="body2" color="text.secondary">/ {r.nights} คืน</Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {r.member_discount_amount && r.member_discount_amount > 0 && (
                        <Chip label={`Member -${r.member_percent}%`} size="small" color="success" variant="outlined" />
                      )}
                      {r.promo_discount_amount && r.promo_discount_amount > 0 && (
                        <Chip label={`Promo -${fmt(r.promo_discount_amount)}`} size="small" color="warning" variant="outlined" />
                      )}
                      {r.promo_message && (
                        <Chip label={r.promo_message} size="small" color={r.promo_is_valid ? "success" : "default"} />
                      )}
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
                      <Button fullWidth={isMobile} variant="outlined" onClick={() => onOpenDetail(r)}>
                        ดูรายละเอียด
                      </Button>
                      <Button fullWidth={isMobile} variant="contained" onClick={() => onOpenHold(r)} disabled={!isAvailable}>
                        จองห้องนี้
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Dialog open={openBook} onClose={() => setOpenBook(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>จองห้องพัก</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selected?.villa_name} • {checkin} → {checkout}
            </Typography>

            <TextField label="ชื่อผู้จอง" value={customerName} onChange={(e) => setCustomerName(e.target.value)} fullWidth />
            <TextField label="เบอร์โทร" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} fullWidth />
          </Stack>

          {holdResp?.booking?.id && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success">
                สร้าง Hold สำเร็จ (หมดอายุ: {holdResp.paymentOptions?.holdExpiresAt})
              </Alert>
              <Alert severity="warning" sx={{ mt: 2 }}>
                ระบบชำระเงินออนไลน์ต้องใช้ Backend หรือ Edge Function กรุณาติดต่อเจ้าหน้าที่เพื่อชำระเงิน
              </Alert>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => onPay("DEPOSIT")} disabled>
                  จ่ายมัดจำ
                </Button>
                <Button variant="contained" onClick={() => onPay("FULL")} disabled>
                  จ่ายเต็ม
                </Button>
              </Stack>

              {paymentInfo?.qr?.image && (
                <Box sx={{ mt: 2 }}>
                  <Typography fontWeight={700}>PromptPay QR</Typography>
                  <Box sx={{ mt: 1 }}>
                    <img src={paymentInfo.qr.image} alt="PromptPay QR" style={{ width: 260, borderRadius: 12 }} />
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button variant="text" onClick={onPoll} disabled={paymentLoading}>
                      เช็คสถานะการจ่าย
                    </Button>
                  </Stack>
                  {paymentInfo.latest?.payment?.status && (
                    <Typography variant="body2" color="text.secondary">
                      Payment status: {paymentInfo.latest.payment.status} / Charge: {paymentInfo.latest.provider?.chargeStatus ?? "-"}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBook(false)}>ปิด</Button>
          <Button onClick={onCreateHold} variant="contained" disabled={!customerName || !customerPhone}>
            สร้าง Hold
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>รายละเอียดห้องพัก</DialogTitle>
        <DialogContent>
          {detailLoading && <Alert severity="info">กำลังโหลดรายละเอียด...</Alert>}
          {detailError && <Alert severity="error">{detailError}</Alert>}
          {detail && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="h6" fontWeight={800}>{detail.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {detail.bedrooms} ห้องนอน • {detail.bathrooms} ห้องน้ำ • รองรับ {detail.max_guests} คน
              </Typography>

              <Grid container spacing={1}>
                {(detail.villa_images ?? []).slice(0, 6).map((img: any) => (
                  <Grid item xs={6} md={4} key={img.id}>
                    <Box
                      sx={{
                        height: 140,
                        borderRadius: 2,
                        backgroundImage: `url(${img.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography>{detail.description || "—"}</Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(detail.villa_amenities ?? []).map((a: any) => (
                  <Chip
                    key={a.amenity_code}
                    label={a.amenities?.title ?? a.amenity_code}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
