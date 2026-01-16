import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { supabase } from "../../lib/supabase";

type ProfitRow = { day?: string; month?: string; total_revenue: number; total_expense: number; net_profit: number };

type RevenueRoomRow = { day: string; villa_name: string; total_revenue: number };
type ExpenseRow = { expense_date: string; category: string; amount: number; note: string | null };

export default function AdminReportsPage() {
  const [daily, setDaily] = useState<ProfitRow[]>([]);
  const [monthly, setMonthly] = useState<ProfitRow[]>([]);
  const [roomDaily, setRoomDaily] = useState<RevenueRoomRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

  const [expenseDate, setExpenseDate] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("WATER");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const fmt = useMemo(() => new Intl.NumberFormat("th-TH"), []);

  useEffect(() => {
    const run = async () => {
      const [dailyRes, monthlyRes, roomRes, expenseRes] = await Promise.all([
        supabase.from("report_profit_daily").select("*").limit(7),
        supabase.from("report_profit_monthly").select("*").limit(6),
        supabase.from("report_revenue_room_daily").select("*").limit(12),
        supabase.from("expenses").select("expense_date, category, amount, note").order("expense_date", { ascending: false }).limit(8),
      ]);

      setDaily((dailyRes.data ?? []) as ProfitRow[]);
      setMonthly((monthlyRes.data ?? []) as ProfitRow[]);
      setRoomDaily((roomRes.data ?? []) as RevenueRoomRow[]);
      setExpenses((expenseRes.data ?? []) as ExpenseRow[]);
    };

    run();
  }, []);

  const onAddExpense = async () => {
    if (!expenseDate || !expenseAmount) return;
    await supabase.from("expenses").insert({
      expense_date: expenseDate,
      category: expenseCategory,
      amount: Number(expenseAmount),
      note: expenseNote || null,
    });
    setExpenseDate("");
    setExpenseAmount("");
    setExpenseNote("");
    const { data } = await supabase
      .from("expenses")
      .select("expense_date, category, amount, note")
      .order("expense_date", { ascending: false })
      .limit(8);
    setExpenses((data ?? []) as ExpenseRow[]);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>รายงานรายได้ & กำไร</Typography>
        <Typography variant="body2" color="text.secondary">
          สรุปรายวัน รายเดือน และรายได้ตามห้อง
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>รายวัน (7 วันล่าสุด)</Typography>
                <Divider />
                {daily.map((row) => (
                  <Stack key={row.day} direction="row" justifyContent="space-between">
                    <Typography>{row.day}</Typography>
                    <Typography>รายได้ ฿{fmt.format(Number(row.total_revenue || 0))}</Typography>
                    <Typography color="text.secondary">
                      กำไร ฿{fmt.format(Number(row.net_profit || 0))}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>รายเดือน (6 เดือนล่าสุด)</Typography>
                <Divider />
                {monthly.map((row) => (
                  <Stack key={row.month} direction="row" justifyContent="space-between">
                    <Typography>{row.month}</Typography>
                    <Typography>รายได้ ฿{fmt.format(Number(row.total_revenue || 0))}</Typography>
                    <Typography color="text.secondary">
                      กำไร ฿{fmt.format(Number(row.net_profit || 0))}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography fontWeight={800}>รายได้ตามห้อง (ล่าสุด)</Typography>
            <Divider />
            {roomDaily.map((row, idx) => (
              <Stack key={`${row.day}_${row.villa_name}_${idx}`} direction="row" justifyContent="space-between">
                <Typography>{row.day}</Typography>
                <Typography>{row.villa_name}</Typography>
                <Typography>฿{fmt.format(Number(row.total_revenue || 0))}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>บันทึกค่าใช้จ่าย</Typography>
                <TextField
                  type="date"
                  label="วันที่"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  select
                  label="หมวดหมู่"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="WATER">ค่าน้ำ</MenuItem>
                  <MenuItem value="ELECTRICITY">ค่าไฟ</MenuItem>
                  <MenuItem value="HOUSEKEEPING">แม่บ้าน</MenuItem>
                  <MenuItem value="MAINTENANCE">ซ่อมบำรุง</MenuItem>
                  <MenuItem value="OTHER">อื่น ๆ</MenuItem>
                </TextField>
                <TextField
                  label="จำนวนเงิน"
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="หมายเหตุ"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  fullWidth
                />
                <Button variant="contained" onClick={onAddExpense} disabled={!expenseDate || !expenseAmount}>
                  บันทึกค่าใช้จ่าย
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>ค่าใช้จ่ายล่าสุด</Typography>
                <Divider />
                {expenses.map((e, idx) => (
                  <Stack key={`${e.expense_date}_${idx}`} direction="row" justifyContent="space-between">
                    <Typography>{e.expense_date}</Typography>
                    <Typography>{e.category}</Typography>
                    <Typography>฿{fmt.format(Number(e.amount || 0))}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
