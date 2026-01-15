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
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";
import { supabase } from "../../lib/supabase";

type Amenity = {
  code: string;
  title: string;
  category: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminAmenitiesPage() {
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Amenity | null>(null);

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const fetchAmenities = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("amenities")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setAmenities((data ?? []) as Amenity[]);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const resetForm = () => {
    setCode("");
    setTitle("");
    setCategory("");
    setSortOrder("0");
    setIsActive(true);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (amenity: Amenity) => {
    setEditing(amenity);
    setCode(amenity.code);
    setTitle(amenity.title);
    setCategory(amenity.category ?? "");
    setSortOrder(String(amenity.sort_order ?? 0));
    setIsActive(!!amenity.is_active);
    setOpen(true);
  };

  const onSave = async () => {
    setError("");
    const payload = {
      code,
      title,
      category,
      sort_order: Number(sortOrder),
      is_active: isActive,
    };

    try {
      if (editing) {
        const { error } = await supabase.from("amenities").update({
          code: payload.code,
          title: payload.title,
          category: payload.category,
          sort_order: payload.sort_order,
          is_active: payload.is_active,
          updated_at: new Date().toISOString(),
        }).eq("code", editing.code);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("amenities").insert(payload);
        if (error) throw error;
      }
      setOpen(false);
      await fetchAmenities();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    }
  };

  const onDisable = async (codeValue: string) => {
    setError("");
    try {
      const { error } = await supabase
        .from("amenities")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("code", codeValue);
      if (error) throw error;
      await fetchAmenities();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={900}>สิ่งอำนวยความสะดวก</Typography>
          <Typography variant="body2" color="text.secondary">
            จัดหมวดหมู่สิ่งอำนวยความสะดวกเพื่อแสดงในหน้า Mini App
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate}>+ เพิ่มสิ่งอำนวยความสะดวก</Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {amenities.map((a) => (
          <Grid item xs={12} md={6} key={a.code}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography fontWeight={800}>{a.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{a.category || "—"}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => openEdit(a)}>แก้ไข</Button>
                    <Button color="error" variant="contained" onClick={() => onDisable(a.code)}>
                      ปิดใช้งาน
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && amenities.length === 0 && (
        <Card>
          <CardContent>
            <Typography fontWeight={800}>ยังไม่มีรายการ</Typography>
            <Typography variant="body2" color="text.secondary">
              เพิ่มสิ่งอำนวยความสะดวกแรกเพื่อใช้งานกับห้องพัก
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "แก้ไขสิ่งอำนวยความสะดวก" : "เพิ่มสิ่งอำนวยความสะดวก"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} fullWidth />
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
            <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth />
            <TextField label="Sort order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} fullWidth />
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label="เปิดใช้งาน"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={onSave} disabled={!code || !title}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
