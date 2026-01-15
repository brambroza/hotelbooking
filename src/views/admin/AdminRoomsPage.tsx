import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

type Amenity = { code: string; title: string };
type RoomImage = { id: string; url: string };
type RoomAmenity = { amenity_code: string; amenities?: Amenity };

type Room = {
  id: string;
  name: string;
  base_price: number;
  max_guests: number;
  description: string;
  is_active: boolean;
  villa_images?: RoomImage[];
  villa_amenities?: RoomAmenity[];
};

export default function AdminRoomsPage() {
  const nav = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("villas")
        .select("*, villa_images(*), villa_amenities(amenity_code, amenities(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRooms((data ?? []) as Room[]);
    } catch (e) {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fmt = useMemo(() => new Intl.NumberFormat("th-TH"), []);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={900}>จัดการห้องพัก</Typography>
          <Typography variant="body2" color="text.secondary">
            เพิ่ม/แก้ไขข้อมูลห้องพัก + ราคา + รูปภาพ + สิ่งอำนวยความสะดวก  
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => nav("/admin/rooms/new")}>
          + เพิ่มห้องพัก
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {rooms.map((room) => {
          const cover = room.villa_images?.[0]?.url;
          const amenities = (room.villa_amenities ?? [])
            .map((a) => a.amenities?.title ?? a.amenity_code)
            .slice(0, 6);

          return (
            <Grid item xs={12} md={6} lg={4} key={room.id}>
              <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
                {cover ? (
                  <Box
                    sx={{
                      height: 160,
                      backgroundImage: `url(${cover})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ) : (
                  <Box sx={{ height: 160, bgcolor: "grey.100" }} />
                )}

                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography fontWeight={900}>{room.name}</Typography>
                      <Chip
                        size="small"
                        label={room.is_active ? "เปิดขาย" : "ปิดขาย"}
                        color={room.is_active ? "success" : "default"}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 36 }}>
                      {room.description || "—"}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={`฿${fmt.format(room.base_price)}/คืน`} />
                      <Chip size="small" label={`รองรับ ${room.max_guests} คน`} />
                      <Chip size="small" label={`${room.villa_images?.length ?? 0}/10 รูป`} />
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {amenities.map((a) => (
                        <Chip key={a} size="small" variant="outlined" label={a} />
                      ))}
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                      <Button fullWidth variant="outlined" onClick={() => nav(`/admin/rooms/${room.id}`)}>
                        แก้ไข
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {!loading && rooms.length === 0 && (
        <Card sx={{ mt: 2, borderRadius: 3 }}>
          <CardContent>
            <Typography fontWeight={900}>ยังไม่มีห้องพัก</Typography>
            <Typography variant="body2" color="text.secondary">
              กด “เพิ่มห้องพัก” เพื่อเริ่มสร้างห้องแรกของคุณ
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
