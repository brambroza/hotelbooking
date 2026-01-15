import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { supabase } from "../../lib/supabase";

type Promo = {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: "PERCENT" | "AMOUNT";
  percent: number | null;
  amount: number | null;
  max_discount: number | null;
  min_total: number;
  min_nights: number;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
};

export default function AdminPromosPage() {
  const [loading, setLoading] = useState(false);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promo | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [percent, setPercent] = useState("10");
  const [amount, setAmount] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minTotal, setMinTotal] = useState("0");
  const [minNights, setMinNights] = useState("1");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchPromos = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPromos((data ?? []) as Promo[]);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const resetForm = () => {
    setCode("");
    setName("");
    setDescription("");
    setDiscountType("PERCENT");
    setPercent("10");
    setAmount("0");
    setMaxDiscount("");
    setMinTotal("0");
    setMinNights("1");
    setStartAt("");
    setEndAt("");
    setIsActive(true);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (promo: Promo) => {
    setEditing(promo);
    setCode(promo.code);
    setName(promo.name ?? "");
    setDescription(promo.description ?? "");
    setDiscountType(promo.discount_type);
    setPercent(String(promo.percent ?? 0));
    setAmount(String(promo.amount ?? 0));
    setMaxDiscount(promo.max_discount == null ? "" : String(promo.max_discount));
    setMinTotal(String(promo.min_total ?? 0));
    setMinNights(String(promo.min_nights ?? 1));
    setStartAt(promo.start_at ?? "");
    setEndAt(promo.end_at ?? "");
    setIsActive(!!promo.is_active);
    setOpen(true);
  };

  const onSave = async () => {
    setError("");
    const payload = {
      code,
      name,
      description,
      discount_type: discountType,
      percent: discountType === "PERCENT" ? Number(percent) : null,
      amount: discountType === "AMOUNT" ? Number(amount) : null,
      max_discount: maxDiscount.trim() === "" ? null : Number(maxDiscount),
      min_total: Number(minTotal),
      min_nights: Number(minNights),
      start_at: startAt.trim() === "" ? null : startAt,
      end_at: endAt.trim() === "" ? null : endAt,
      is_active: isActive,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from("promos")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promos").insert(payload);
        if (error) throw error;
      }
      setOpen(false);
      await fetchPromos();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    }
  };

  const onDisable = async (id: string) => {
    setError("");
    try {
      const { error } = await supabase
        .from("promos")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await fetchPromos();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={900}>จัดการโปรโมชัน</Typography>
          <Typography variant="body2" color="text.secondary">
            สร้างคูปองส่วนลดแบบเปอร์เซ็นต์หรือจำนวนเงิน
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate}>+ เพิ่มโปรโมชัน</Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {promos.map((p) => (
          <Grid item xs={12} md={6} key={p.id}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography fontWeight={800}>{p.name || p.code}</Typography>
                  <Typography variant="body2" color="text.secondary">{p.description || "—"}</Typography>
                  <Typography fontWeight={700}>
                    {p.discount_type === "PERCENT" ? `${p.percent}%` : `฿${Number(p.amount).toFixed(0)}`}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => openEdit(p)}>แก้ไข</Button>
                    <Button color="error" variant="contained" onClick={() => onDisable(p.id)}>
                      ปิดใช้งาน
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && promos.length === 0 && (
        <Card>
          <CardContent>
            <Typography fontWeight={800}>ยังไม่มีโปรโมชัน</Typography>
            <Typography variant="body2" color="text.secondary">
              เพิ่มโปรโมชันแรกเพื่อเริ่มใช้งาน
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "แก้ไขโปรโมชัน" : "สร้างโปรโมชันใหม่"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              </Grid>
            </Grid>

            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Discount Type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "AMOUNT")}
                  fullWidth
                  select
                >
                  <MenuItem value="PERCENT">PERCENT</MenuItem>
                  <MenuItem value="AMOUNT">AMOUNT</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Percent"
                  type="number"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  fullWidth
                  disabled={discountType !== "PERCENT"}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  disabled={discountType !== "AMOUNT"}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Max Discount" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Min Total" value={minTotal} onChange={(e) => setMinTotal(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Min Nights" value={minNights} onChange={(e) => setMinNights(e.target.value)} fullWidth />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Start At" value={startAt} onChange={(e) => setStartAt(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="End At" value={endAt} onChange={(e) => setEndAt(e.target.value)} fullWidth />
              </Grid>
            </Grid>

            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label="เปิดใช้งาน"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={onSave} disabled={!code}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
