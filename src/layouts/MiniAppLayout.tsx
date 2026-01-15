import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { storage } from "../lib/storage";

export default function MiniAppLayout() {
  const location = useLocation();
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [hasLineUser, setHasLineUser] = useState(!!storage.getLineUser());
  const [connectError, setConnectError] = useState("");
  const navValue = useMemo(() => {
    if (location.pathname.startsWith("/bookings")) return "bookings";
    if (location.pathname.startsWith("/promos")) return "promos";
    return "search";
  }, [location.pathname]);

  useEffect(() => {
    setHasLineUser(!!storage.getLineUser());
  }, [location.pathname]);

  useEffect(() => {
    const restoreLineSession = async () => {
      if (storage.getLineUser()) return;
      const liff = (window as any).liff;
      if (!liff) return;
      const liffId = import.meta.env.VITE_LIFF_ID as string;
      if (!liffId) return;
      try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) return;
        const profile = await liff.getProfile();
        if (!profile?.userId) return;
        storage.setLineUser({
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        });
        setHasLineUser(true);
      } catch {
        // silent restore; user can tap connect if needed
      }
    };
    restoreLineSession();
  }, []);

  const connectLine = async () => {
    setConnectError("");
    try {
      const liff = (window as any).liff;
      if (!liff) {
        throw new Error("ไม่พบ LIFF SDK กรุณาเปิดผ่าน LINE Mini App");
      }

      const liffId = import.meta.env.VITE_LIFF_ID as string;
      if (!liffId) throw new Error("กรุณาตั้งค่า VITE_LIFF_ID");
      await liff.init({ liffId });
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      if (!profile?.userId) throw new Error("ไม่พบ LINE user");

      storage.setLineUser({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });
      setHasLineUser(true);
    } catch (e: any) {
      setConnectError(e?.message ?? "เชื่อมต่อ LINE ไม่สำเร็จ");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", pb: { xs: 8, sm: 0 } }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1.5, flexWrap: { xs: "wrap", md: "nowrap" } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mr: 1 }}>
            Hotel Booking
          </Typography>
          {!isMobile && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flex: 1,
                minWidth: { xs: "100%", md: "auto" },
                overflowX: "auto",
                pb: { xs: 1, md: 0 },
              }}
            >
              <Button size="small" component={Link} to="/" color="inherit">ค้นหาห้อง</Button>
              <Button size="small" component={Link} to="/bookings" color="inherit">การจองของฉัน</Button>
              <Button size="small" component={Link} to="/promos" color="inherit">โปรโมชัน</Button>
            </Stack>
          )}
          {!isMobile && (
            <Button size="small" component={Link} to="/admin" variant="outlined" color="inherit">
              Admin
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth={isMobile ? "sm" : "md"} sx={{ py: { xs: 2, md: 4 } }}>
        {!hasLineUser && (
          <Box
            sx={{
              mb: 2,
              px: 3,
              py: 2,
              borderRadius: 3,
              bgcolor: "rgba(15, 106, 107, 0.08)",
              border: "1px solid rgba(15, 106, 107, 0.2)",
            }}
          >
            <Typography fontWeight={700}>เชื่อมต่อบัญชี LINE เพื่อเริ่มจอง</Typography>
            <Typography variant="body2" color="text.secondary">
              ถ้าใช้งานผ่าน LIFF ระบบจะดึงโปรไฟล์และออก token ให้อัตโนมัติ
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
              <Button fullWidth variant="contained" onClick={connectLine}>เชื่อมต่อ LINE</Button>
            </Stack>
            {connectError && <Alert severity="error" sx={{ mt: 1 }}>{connectError}</Alert>}
          </Box>
        )}
        <Outlet />
      </Container>

      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "white",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            zIndex: theme.zIndex.appBar,
          }}
        >
          <BottomNavigation
            showLabels
            value={navValue}
            onChange={(_e, value) => {
              if (value === "search") nav("/");
              if (value === "bookings") nav("/bookings");
              if (value === "promos") nav("/promos");
            }}
          >
            <BottomNavigationAction label="ค้นหา" value="search" icon={<SearchOutlinedIcon />} />
            <BottomNavigationAction label="การจอง" value="bookings" icon={<ReceiptLongOutlinedIcon />} />
            <BottomNavigationAction label="โปรโมชัน" value="promos" icon={<LocalOfferOutlinedIcon />} />
          </BottomNavigation>
        </Box>
      )}
    </Box>
  );
}
