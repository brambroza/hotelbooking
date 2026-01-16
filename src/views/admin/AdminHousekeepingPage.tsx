import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { supabase } from "../../lib/supabase";

type Villa = { id: string; name: string };

type Housekeeper = { id: string; name: string; phone: string | null; is_active: boolean };

type Task = {
  id: string;
  villa_id: string;
  scheduled_date: string;
  status: string;
  note: string | null;
  housekeepers?: { name: string } | null;
  villas?: { name: string } | null;
};

const statusColor = (status: string) => {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  if (status === "ISSUE") return "error";
  return "default";
};

export default function AdminHousekeepingPage() {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  const [hkName, setHkName] = useState("");
  const [hkPhone, setHkPhone] = useState("");

  const [taskVillaId, setTaskVillaId] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [vRes, hkRes, tRes] = await Promise.all([
        supabase.from("villas").select("id, name").order("name"),
        supabase.from("housekeepers").select("*").order("created_at", { ascending: false }),
        supabase
          .from("housekeeping_tasks")
          .select("id, villa_id, scheduled_date, status, note, housekeepers(name), villas(name)")
          .order("scheduled_date", { ascending: false })
          .limit(30),
      ]);

      setVillas((vRes.data ?? []) as Villa[]);
      setHousekeepers((hkRes.data ?? []) as Housekeeper[]);
      setTasks((tRes.data ?? []) as unknown as Task[]);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onAddHousekeeper = async () => {
    setError("");
    try {
      await supabase.from("housekeepers").insert({
        name: hkName,
        phone: hkPhone || null,
        is_active: true,
      });
      setHkName("");
      setHkPhone("");
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "เพิ่มแม่บ้านไม่สำเร็จ");
    }
  };

  const onAddTask = async () => {
    setError("");
    try {
      await supabase.from("housekeeping_tasks").insert({
        villa_id: taskVillaId,
        scheduled_date: taskDate,
        note: taskNote || null,
        assigned_to: taskAssignee || null,
        status: "PENDING",
      });
      setTaskVillaId("");
      setTaskDate("");
      setTaskNote("");
      setTaskAssignee("");
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "สร้างงานไม่สำเร็จ");
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    setError("");
    try {
      await supabase
        .from("housekeeping_tasks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", taskId);
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>Housekeeping</Typography>
        <Typography variant="body2" color="text.secondary">
          จัดการคิวแม่บ้านและสถานะทำความสะอาด
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>เพิ่มแม่บ้าน</Typography>
                <TextField label="ชื่อ" value={hkName} onChange={(e) => setHkName(e.target.value)} fullWidth />
                <TextField label="เบอร์โทร" value={hkPhone} onChange={(e) => setHkPhone(e.target.value)} fullWidth />
                <Button variant="contained" onClick={onAddHousekeeper} disabled={!hkName}>
                  เพิ่มแม่บ้าน
                </Button>

                <Divider />

                <Typography fontWeight={800}>รายชื่อแม่บ้าน</Typography>
                <Stack spacing={1}>
                  {housekeepers.map((h) => (
                    <Stack key={h.id} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography>{h.name}</Typography>
                      <Chip label={h.is_active ? "Active" : "Inactive"} size="small" />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>สร้างงานทำความสะอาด</Typography>
                <TextField
                  select
                  label="ห้องพัก"
                  value={taskVillaId}
                  onChange={(e) => setTaskVillaId(e.target.value)}
                  fullWidth
                >
                  {villas.map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="date"
                  label="วันที่ทำความสะอาด"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  select
                  label="แม่บ้าน"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">ไม่ระบุ</MenuItem>
                  {housekeepers.map((h) => (
                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                  ))}
                </TextField>
                <TextField label="หมายเหตุ" value={taskNote} onChange={(e) => setTaskNote(e.target.value)} fullWidth />
                <Button variant="contained" onClick={onAddTask} disabled={!taskVillaId || !taskDate}>
                  สร้างงาน
                </Button>

                <Divider />

                <Typography fontWeight={800}>คิวงานล่าสุด</Typography>
                <Stack spacing={1}>
                  {tasks.map((t) => (
                    <Box key={t.id} sx={{ p: 2, borderRadius: 2, bgcolor: "#f7f8fa" }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography fontWeight={700}>{t.villas?.name ?? "Pool Villa"}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t.scheduled_date} • {t.housekeepers?.name ?? "ไม่ระบุแม่บ้าน"}
                          </Typography>
                        </Box>
                        <Chip label={t.status} color={statusColor(t.status) as any} />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => updateStatus(t.id, "IN_PROGRESS")}>เริ่มงาน</Button>
                        <Button size="small" variant="outlined" onClick={() => updateStatus(t.id, "DONE")}>เสร็จสิ้น</Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => updateStatus(t.id, "ISSUE")}>มีปัญหา</Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
