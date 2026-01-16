import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/CloudUpload";
import { supabase } from "../../lib/supabase";

type Amenity = { code: string; title: string; category: string };
type RoomImage = { id: string; url: string };

type Room = {
  id: string;
  name: string;
  base_price: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  included_guests: number;
  extra_guest_price: number;
  map_url?: string | null;
  description: string;
  details: any;
  rating_score: number;
  rating_note: string;
  is_active: boolean;
  villa_images?: RoomImage[];
  villa_amenities?: { amenity_code: string; amenities?: Amenity }[];
};

export default function AdminRoomEditor() {
  const nav = useNavigate();
  const params = useParams();
  const roomId = params.id;
  const isNew = roomId === undefined;

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [room, setRoom] = useState<Room | null>(null);

  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState<number>(2500);
  const [maxGuests, setMaxGuests] = useState<number>(2);
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [includedGuests, setIncludedGuests] = useState<number>(2);
  const [extraGuestPrice, setExtraGuestPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [detailsJson, setDetailsJson] = useState<string>(JSON.stringify({
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    check_in_after: "14:00",
    check_out_before: "12:00",
    house_rules: "งดสูบบุหรี่ในห้อง",
  }, null, 2));
  const [ratingScore, setRatingScore] = useState<number>(0);
  const [ratingNote, setRatingNote] = useState<string>("");

  const [active, setActive] = useState<boolean>(true);
  const [selectedAmenityCodes, setSelectedAmenityCodes] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canUploadMore = useMemo(() => {
    const existing = room?.villa_images?.length ?? 0;
    return existing + pendingFiles.length < 10;
  }, [room, pendingFiles]);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from("amenities")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setAmenities((data ?? []) as Amenity[]);
    } catch (e: any) {
      setError(e?.message ?? "โหลดสิ่งอำนวยความสะดวกไม่สำเร็จ");
    }
  };

  const fetchRoom = async () => {
    if (!roomId) return;
    try {
      const { data, error } = await supabase
        .from("villas")
        .select("*, villa_images(*), villa_amenities(amenity_code, amenities(*))")
        .eq("id", roomId)
        .single();
      if (error) throw error;
      const rr: Room = data as Room;
      setRoom(rr);

      setName(rr.name);
      setBasePrice(Number(rr.base_price));
      setMaxGuests(rr.max_guests);
      setBedrooms(rr.bedrooms ?? 1);
      setBathrooms(rr.bathrooms ?? 1);
      setIncludedGuests(rr.included_guests ?? 2);
      setExtraGuestPrice(Number(rr.extra_guest_price ?? 0));
    setDescription(rr.description);
    setMapUrl(rr.map_url ?? "");
      setActive(rr.is_active);
      setRatingScore(Number(rr.rating_score ?? 0));
      setRatingNote(rr.rating_note ?? "");

      setDetailsJson(JSON.stringify(rr.details ?? {}, null, 2));

      const codes = (rr.villa_amenities ?? []).map((a) => a.amenity_code);
      setSelectedAmenityCodes(codes);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลห้องพักไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchAmenities();
    fetchRoom();
  }, []);

  const toggleAmenity = (code: string) => {
    setSelectedAmenityCodes((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  };

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;

    const list = Array.from(files);
    const merged = [...pendingFiles, ...list].slice(0, 10);
    setPendingFiles(merged);
  };

  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const parseDetails = () => {
    try {
      return JSON.parse(detailsJson || "{}");
    } catch {
      throw new Error("details JSON ไม่ถูกต้อง กรุณาตรวจสอบ");
    }
  };

  const saveRoom = async () => {
    setError("");
    setSuccess("");

    try {
      const details = parseDetails();

      // create/update
      if (isNew) {
        const { data, error } = await supabase
          .from("villas")
          .insert({
            name,
            base_price: basePrice,
            max_guests: maxGuests,
            bedrooms,
            bathrooms,
            included_guests: includedGuests,
            extra_guest_price: extraGuestPrice,
            map_url: mapUrl || null,
            description,
            details,
            rating_score: ratingScore,
            rating_note: ratingNote,
            is_active: active,
          })
          .select("*")
          .single();
        if (error) throw error;

        const created: Room = data as Room;
        setRoom(created);
        setSuccess("บันทึกห้องพักเรียบร้อย ✅");

        if (selectedAmenityCodes.length) {
          const rows = selectedAmenityCodes.map((code) => ({ villa_id: created.id, amenity_code: code }));
          const { error: joinErr } = await supabase.from("villa_amenities").insert(rows);
          if (joinErr) throw joinErr;
        }

        // upload images after create
        if (pendingFiles.length) {
          await uploadImages(created.id);
        }

        nav(`/admin/rooms/${created.id}`, { replace: true });
      } else {
        const { error } = await supabase
          .from("villas")
          .update({
            name,
            base_price: basePrice,
            max_guests: maxGuests,
            bedrooms,
            bathrooms,
            included_guests: includedGuests,
            extra_guest_price: extraGuestPrice,
            map_url: mapUrl || null,
            description,
            details,
            rating_score: ratingScore,
            rating_note: ratingNote,
            is_active: active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId);
        if (error) throw error;

        const { error: delErr } = await supabase.from("villa_amenities").delete().eq("villa_id", roomId);
        if (delErr) throw delErr;

        if (selectedAmenityCodes.length) {
          const rows = selectedAmenityCodes.map((code) => ({ villa_id: roomId, amenity_code: code }));
          const { error: joinErr } = await supabase.from("villa_amenities").insert(rows);
          if (joinErr) throw joinErr;
        }
        setSuccess("อัปเดตห้องพักเรียบร้อย ✅");
        await fetchRoom();

        if (pendingFiles.length && roomId) {
          await uploadImages(roomId);
        }
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    }
  };

  const uploadImages = async (id: string) => {
    const bucket = import.meta.env.VITE_SUPABASE_ROOM_IMAGE_BUCKET as string;
    if (!bucket) throw new Error("กรุณาตั้งค่า VITE_SUPABASE_ROOM_IMAGE_BUCKET");
    const uploads = pendingFiles.slice(0, 10);

    for (const file of uploads) {
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `rooms/${id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      const url = data.publicUrl;

      const { error: imgErr } = await supabase
        .from("villa_images")
        .insert({
          villa_id: id,
          url,
          storage_path: storagePath,
          sort_order: 999,
        });
      if (imgErr) throw imgErr;
    }

    setPendingFiles([]);
    await fetchRoom();
  };

  const removeImage = async (imageId: string) => {
    if (!room?.id) return;
    const { data: img, error: readErr } = await supabase
      .from("villa_images")
      .select("*")
      .eq("id", imageId)
      .eq("villa_id", room.id)
      .single();
    if (readErr) throw readErr;

    if (img?.storage_path) {
      const bucket = import.meta.env.VITE_SUPABASE_ROOM_IMAGE_BUCKET as string;
      await supabase.storage.from(bucket).remove([img.storage_path]);
    }

    const { error: delErr } = await supabase.from("villa_images").delete().eq("id", imageId);
    if (delErr) throw delErr;
    await fetchRoom();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            {isNew ? "เพิ่มห้องพัก" : "แก้ไขห้องพัก"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            เก็บข้อมูลห้องพัก : ราคา/รองรับกี่คน/รูปภาพ 10 รูป/สิ่งอำนวยความสะดวก + รายละเอียดเพิ่มเติม
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => nav("/admin/rooms")}>กลับ</Button>
          <Button variant="contained" onClick={saveRoom}>บันทึก</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <TextField label="ชื่อห้องพัก" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="ราคาเริ่มต้น/คืน (THB)"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    fullWidth
                  />
                  <TextField
                    label="รองรับสูงสุด (คน)"
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(Number(e.target.value))}
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="ห้องนอน"
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    fullWidth
                  />
                  <TextField
                    label="ห้องน้ำ"
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="จำนวนผู้เข้าพักรวมในราคา"
                    type="number"
                    value={includedGuests}
                    onChange={(e) => setIncludedGuests(Number(e.target.value))}
                    fullWidth
                  />
                  <TextField
                    label="ค่าผู้เข้าพักเพิ่ม/คน (THB)"
                    type="number"
                    value={extraGuestPrice}
                    onChange={(e) => setExtraGuestPrice(Number(e.target.value))}
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="รายละเอียดห้องพัก (สั้น)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
                <TextField
                  label="ลิงก์แผนที่ (Google Maps)"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  fullWidth
                  placeholder="https://maps.google.com/..."
                />

                <Divider />

                <Typography fontWeight={900}>รายละเอียดเพิ่มเติม (JSON)</Typography>
                <Typography variant="body2" color="text.secondary">
                  เก็บข้อมูลแบบยืดหยุ่น เช่น จำนวนห้องนอน/ห้องน้ำ/กฎที่พัก/เวลา Check‑in/out ฯลฯ
                </Typography>

                <TextField
                  value={detailsJson}
                  onChange={(e) => setDetailsJson(e.target.value)}
                  fullWidth
                  multiline
                  minRows={10}
                  sx={{ fontFamily: "monospace" }}
                />

                <Divider />

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Rating score (optional)"
                    type="number"
                    value={ratingScore}
                    onChange={(e) => setRatingScore(Number(e.target.value))}
                    fullWidth
                  />
                  <TextField
                    label="Rating note (optional)"
                    value={ratingNote}
                    onChange={(e) => setRatingNote(e.target.value)}
                    fullWidth
                    placeholder="เช่น 50% Positive based on guest reviews"
                  />
                </Stack>

                <FormControlLabel
                  control={<Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />}
                  label={active ? "เปิดขาย" : "ปิดขาย"}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography fontWeight={900}>สิ่งอำนวยความสะดวก</Typography>
             

              <Stack spacing={0.5}>
                {amenities.map((a) => (
                  <FormControlLabel
                    key={a.code}
                    control={
                      <Checkbox
                        checked={selectedAmenityCodes.includes(a.code)}
                        onChange={() => toggleAmenity(a.code)}
                      />
                    }
                    label={a.title}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography fontWeight={900}>รูปภาพห้องพัก (สูงสุด 10 รูป)</Typography>
              <Typography variant="body2" color="text.secondary">
                แนะนำรูป: 16:9, ความกว้าง 1600px+  
              </Typography>

              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={!canUploadMore}
                >
                  เพิ่มรูป
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                </Button>
                <Chip size="small" label={`รออัปโหลด: ${pendingFiles.length}`} />
                      <Chip size="small" label={`มีแล้ว: ${room?.villa_images?.length ?? 0}`} />
              </Stack>

              {!!pendingFiles.length && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Typography fontWeight={700}>ไฟล์รออัปโหลด</Typography>
                  {pendingFiles.map((f, idx) => (
                    <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{f.name}</Typography>
                      <IconButton size="small" onClick={() => removePending(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Alert severity="info">กด “บันทึก” เพื่ออัปโหลดรูปเข้าระบบ</Alert>
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography fontWeight={900}>รูปที่อัปโหลดแล้ว</Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {(room?.villa_images ?? []).slice(0, 10).map((img) => (
                  <Grid item xs={6} key={img.id}>
                    <Box
                      sx={{
                        position: "relative",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box
                        sx={{
                          height: 110,
                          backgroundImage: `url(${img.url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(255,255,255,0.9)" }}
                        onClick={() => removeImage(img.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {!room?.id && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  ต้องบันทึกห้องพักก่อน ถึงจะอัปโหลดรูปได้
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
