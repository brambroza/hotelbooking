import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { supabase } from "../../lib/supabase";

type Row = {
  id: string;
  villa_id: string;
  villa_name: string;
  date: string;
  is_closed: boolean;
  price_override: number | null;
  booked_status: string;
};

const statusChip = (status: string, closed: boolean) => {
  if (closed) return <Chip label="CLOSED" size="small" color="default" variant="outlined" />;
  if (status === "PAID") return <Chip label="PAID" size="small" color="success" variant="filled" />;
  if (status === "CONFIRMED") return <Chip label="CONFIRMED" size="small" color="warning" variant="filled" />;
  if (status === "PENDING_PAYMENT") return <Chip label="HOLD" size="small" color="info" variant="filled" />;
  return <Chip label="AVAILABLE" size="small" color="primary" variant="outlined" />;
};

export default function AdminCalendarPage() {
  const [from, setFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // override dialog
  const [open, setOpen] = useState(false);
  const [villaId, setVillaId] = useState("");
  const [rangeFrom, setRangeFrom] = useState(from);
  const [rangeTo, setRangeTo] = useState(to);
  const [priceOverride, setPriceOverride] = useState<string>("");
  const [isClosed, setIsClosed] = useState(false);
  const [note, setNote] = useState("");

  const fetchCalendar = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_calendar_matrix", {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      setRows(
        (data ?? []).map((x: any) => ({
          id: `${x.villa_id}_${x.date}`,
          villa_id: x.villa_id,
          villa_name: x.villa_name,
          date: x.date,
          is_closed: x.is_closed,
          price_override: x.price_override,
          booked_status: x.booked_status,
        }))
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo<GridColDef<Row>[]>(() => [
    { field: "villa_name", headerName: "Villa", width: 200 },
    { field: "date", headerName: "Date", width: 120 },
    {
      field: "booked_status",
      headerName: "Status",
      width: 160,
      renderCell: (p) => statusChip(p.row.booked_status, p.row.is_closed),
      sortable: false,
    },
    {
      field: "price_override",
      headerName: "Override",
      width: 130,
       
    },
    { field: "villa_id", headerName: "VillaId", width: 260 },
  ], []);

  const onOpenSetRange = () => {
    setOpen(true);
    setVillaId("");
    setRangeFrom(from);
    setRangeTo(to);
    setPriceOverride("");
    setIsClosed(false);
    setNote("");
  };

  const onSetRange = async () => {
    setError("");
    try {
      const { error } = await supabase.rpc("admin_set_override_range", {
        p_villa_id: villaId,
        p_from: rangeFrom,
        p_to: rangeTo,
        p_price_override: priceOverride.trim() === "" ? null : Number(priceOverride),
        p_is_closed: !!isClosed,
        p_note: note || null,
      });
      if (error) throw error;

      setOpen(false);
      await fetchCalendar();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    }
  };

  return (
    <Stack spacing={2}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={900}>ปฏิทินห้องพัก (Admin)</Typography>
          <Typography variant="body2" color="text.secondary">
            ดูสถานะรายวัน + ตั้งราคา override + ปิดขายช่วงวัน
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <TextField label="From" value={from} onChange={(e) => setFrom(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="To" value={to} onChange={(e) => setTo(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} sx={{ height: "100%" }} alignItems="center" justifyContent="flex-end">
                <Button variant="outlined" onClick={onOpenSetRange}>ตั้งค่า Override ช่วงวัน</Button>
                <Button variant="contained" onClick={fetchCalendar} disabled={loading}>
                  {loading ? "กำลังโหลด..." : "Refresh"}
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {error && <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={800}>Calendar Matrix</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ height: 560 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 50, page: 0 } } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ตั้งราคา / ปิดขาย (ช่วงวัน)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              ใส่ VillaId (copy จากตาราง) แล้วเลือกช่วงวัน + ราคาหรือปิดขาย
            </Alert>
            <TextField label="VillaId" value={villaId} onChange={(e) => setVillaId(e.target.value)} fullWidth />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="From" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="To" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} fullWidth />
              </Grid>
            </Grid>

            <TextField
              label="Price Override (THB) (ปล่อยว่าง = ใช้ราคาปกติ)"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={<Switch checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} />}
              label="ปิดขาย (Stop Sell)"
            />

            <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={onSetRange} disabled={!villaId}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
