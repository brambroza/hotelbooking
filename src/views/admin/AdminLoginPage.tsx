import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { storage } from "../../lib/storage";
import { supabase } from "../../lib/supabase";

export default function AdminLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onLogin = async () => {
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("admin_login", {
        p_email: email,
        p_password: password,
      });
      if (rpcError) throw rpcError;
      const row = data?.[0];
      if (!row) throw new Error("Email หรือรหัสผ่านไม่ถูกต้อง");

      storage.setAdminSession({
        adminUserId: row.admin_user_id,
        email: row.email,
        role: row.role,
      });
      nav("/admin/rooms");
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: "#eef1f4",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(47, 143, 107, 0.12), transparent 50%)," +
          "radial-gradient(circle at 80% 30%, rgba(242, 196, 91, 0.18), transparent 45%)," +
          "repeating-linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 14px)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 6 },
          py: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "primary.main",
            }}
          />
          <Typography fontWeight={800}>Hotel Booking Admin</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">EN</Typography>
          <Button variant="outlined">Request Demo</Button>
        </Stack>
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: 140,
          left: { xs: 16, md: 80 },
          width: 120,
          height: 120,
          borderRadius: "50%",
          bgcolor: "rgba(47, 143, 107, 0.12)",
          display: { xs: "none", md: "block" },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 120,
          right: { xs: 16, md: 120 },
          width: 160,
          height: 160,
          borderRadius: 6,
          bgcolor: "rgba(255,255,255,0.7)",
          display: { xs: "none", md: "block" },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 220,
          right: { xs: 24, md: 220 },
          width: 90,
          height: 90,
          borderRadius: "50%",
          bgcolor: "rgba(0,0,0,0.05)",
          display: { xs: "none", md: "block" },
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: { xs: 6, md: 10 },
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 520, borderRadius: 6 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Admin Login
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  กรอกข้อมูลเพื่อเข้าสู่ระบบจัดการการจอง
                </Typography>
              </Box>

              <TextField label="Business Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />

              <Typography variant="caption" color="text.secondary">
                ระบบจะบันทึกข้อมูลอย่างปลอดภัยตามเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
              </Typography>

              {error && <Alert severity="error">{error}</Alert>}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="outlined" fullWidth>Need help?</Button>
                <Button variant="contained" fullWidth onClick={onLogin} disabled={!email || !password}>
                  เข้าสู่ระบบ
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ textAlign: "center", pb: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Copyright © HotelBooking
        </Typography>
      </Box>
    </Box>
  );
}
