import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";

import MiniAppSearchPage from "../views/miniapp/MiniAppSearchPage";
import BookingReceiptPage from "../views/miniapp/BookingReceiptPage";
import MiniAppBookingsPage from "../views/miniapp/MiniAppBookingsPage";
import MiniAppPromosPage from "../views/miniapp/MiniAppPromosPage";
import AdminLoginPage from "../views/admin/AdminLoginPage";
import AdminCalendarPage from "../views/admin/AdminCalendarPage";
import AdminLayout from "../layouts/AdminLayout"; 
import AdminRoomsPage from "../views/admin/AdminRoomsPage";
import AdminRoomEditor from "../views/admin/AdminRoomEditor"; 
import AdminPromosPage from "../views/admin/AdminPromosPage";
import AdminAmenitiesPage from "../views/admin/AdminAmenitiesPage";
import AdminDashboardPage from "../views/admin/AdminDashboardPage";
import MiniAppLayout from "../layouts/MiniAppLayout";


export default function App() {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={<MiniAppLayout />}>
          <Route index element={<MiniAppSearchPage />} />
          <Route path="booking/:id" element={<BookingReceiptPage />} />
          <Route path="bookings" element={<MiniAppBookingsPage />} />
          <Route path="promos" element={<MiniAppPromosPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="rooms/new" element={<AdminRoomEditor />} />
          <Route path="rooms/:id" element={<AdminRoomEditor />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
          <Route path="promos" element={<AdminPromosPage />} />
          <Route path="amenities" element={<AdminAmenitiesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Box>
  );
}
