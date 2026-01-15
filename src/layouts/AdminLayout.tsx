import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import KingBedOutlinedIcon from "@mui/icons-material/KingBedOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { storage } from "../lib/storage";

export default function AdminLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const admin = storage.getAdminSession();

  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Box
        sx={{
          width: 240,
          p: 3,
          bgcolor: "white",
          borderRight: "1px solid rgba(0,0,0,0.08)",
          display: { xs: "none", md: "block" },
        }}
      >
        <Stack spacing={2}>
          <Stack>
            <Typography fontWeight={900} variant="h6">PRM</Typography>
            <Typography variant="caption" color="text.secondary">Hotel Booking Admin</Typography>
          </Stack>

          <Stack spacing={1}>
            <Button
              startIcon={<DashboardOutlinedIcon />}
              onClick={() => nav("/admin/dashboard")}
              variant={location.pathname.includes("/admin/dashboard") ? "contained" : "text"}
            >
              Dashboard
            </Button>
            <Button
              startIcon={<KingBedOutlinedIcon />}
              onClick={() => nav("/admin/rooms")}
              variant={location.pathname.includes("/admin/rooms") ? "contained" : "text"}
            >
              Rooms
            </Button>
            <Button
              startIcon={<SpaOutlinedIcon />}
              onClick={() => nav("/admin/amenities")}
              variant={location.pathname.includes("/admin/amenities") ? "contained" : "text"}
            >
              Amenities
            </Button>
            <Button
              startIcon={<LocalOfferOutlinedIcon />}
              onClick={() => nav("/admin/promos")}
              variant={location.pathname.includes("/admin/promos") ? "contained" : "text"}
            >
              Promos
            </Button>
            <Button
              startIcon={<CalendarMonthOutlinedIcon />}
              onClick={() => nav("/admin/calendar")}
              variant={location.pathname.includes("/admin/calendar") ? "contained" : "text"}
            >
              Calendar
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Chip label={admin.email} variant="outlined" />
            <Button
              color="inherit"
              onClick={() => {
                storage.clearAdminSession();
                nav("/admin/login");
              }}
            >
              ออกจากระบบ
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <TextField
              placeholder="Search anything here..."
              fullWidth
              sx={{
                bgcolor: "white",
                borderRadius: 999,
                "& fieldset": { border: "none" },
              }}
            />
            <Chip label={admin.role} color="primary" variant="outlined" />
          </Stack>
          <Outlet />
        </Stack>
      </Box>
    </Box>
  );
}
