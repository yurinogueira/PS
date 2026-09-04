import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  Tab,
  Tabs,
  CircularProgress,
  Avatar,
  Autocomplete,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PetsIcon from "@mui/icons-material/Pets";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslation } from "react-i18next";
import {
  clientService,
  SeasonClient,
  Dog,
  Photo,
  CURRENCIES,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";
import { formatPhone } from "../../../utils/phone";

const PAYMENT_METHODS = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "Não pago",
];

const getPaymentColor = (
  method?: string,
): "success" | "primary" | "warning" | "error" | "default" => {
  switch (method) {
    case "Pix":
      return "success";
    case "Cartão de Crédito":
    case "Cartão de Débito":
    case "Credit Card":
    case "Debit Card":
      return "primary";
    case "Dinheiro":
    case "Cash":
      return "warning";
    case "Não pago":
      return "error";
    default:
      return "default";
  }
};

export const PersonDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeSeason } = useSeasonStore();

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [client, setClient] = useState<SeasonClient | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);

  // Selected Dog index for Master-Detail view
  const [selectedDogIndex, setSelectedDogIndex] = useState<number>(0);

  // Dog Dialog (Create / Edit)
  const [dogDialogOpen, setDogDialogOpen] = useState(false);
  const [editingDogIndex, setEditingDogIndex] = useState<number | null>(null);
  const [dogForm, setDogForm] = useState<{
    breed: string;
    competitions_won: number;
    won_competitions: string[];
    is_owner: boolean;
  }>({
    breed: "",
    competitions_won: 0,
    won_competitions: [],
    is_owner: true,
  });
  const [newCompetitionInput, setNewCompetitionInput] = useState("");

  // Photo Dialog (Add - Batch / Single)
  const [addPhotoDialogOpen, setAddPhotoDialogOpen] = useState(false);
  const [photoTab, setPhotoTab] = useState<"batch" | "single">("batch");
  const [batchPhotoForm, setBatchPhotoForm] = useState<{
    fileNumbersText: string;
    photographer_id: string;
    payment_method: string;
    currency: string;
    amount_paid: number;
    judges: string[];
  }>({
    fileNumbersText: "",
    photographer_id: "",
    payment_method: "Pix",
    currency: "BRL",
    amount_paid: 0,
    judges: [],
  });
  const [singlePhotoForm, setSinglePhotoForm] = useState<Omit<Photo, "id">>({
    file_number: "",
    photographer_id: "",
    payment_method: "Pix",
    currency: "BRL",
    amount_paid: 0,
    judges: [],
  });

  // Edit Photo Dialog
  const [editPhotoDialogOpen, setEditPhotoDialogOpen] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null,
  );
  const [editPhotoForm, setEditPhotoForm] = useState<Omit<Photo, "id">>({
    file_number: "",
    photographer_id: "",
    payment_method: "Pix",
    currency: "BRL",
    amount_paid: 0,
    judges: [],
  });

  // Delete Confirm Dialogs
  const [deleteDogConfirm, setDeleteDogConfirm] = useState<{
    open: boolean;
    index: number | null;
  }>({
    open: false,
    index: null,
  });
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState<{
    open: boolean;
    index: number | null;
  }>({
    open: false,
    index: null,
  });

  // Feedback Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [pData, clientsData, phData] = await Promise.all([
        personService.getById(id),
        clientService.list(
          activeSeason ? { season_id: activeSeason.id } : undefined,
        ),
        photographerService.list(),
      ]);

      setPerson(pData);
      setPhotographers(phData || []);

      if (activeSeason) {
        const clientList = Array.isArray(clientsData)
          ? clientsData
          : clientsData?.data || [];
        const currentClient = clientList.find(
          (c: SeasonClient) =>
            c.person_id === id && c.season_id === activeSeason.id,
        );
        setClient(currentClient || null);
      } else {
        setClient(null);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da pessoa:", err);
      showNotification(t("shared.error"), "error");
    } finally {
      setLoading(false);
    }
  }, [id, activeSeason, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ensure selected dog index is within bounds
  const dogsList = client?.dogs || [];
  const selectedDog = dogsList[selectedDogIndex] || null;

  useEffect(() => {
    if (dogsList.length > 0 && selectedDogIndex >= dogsList.length) {
      setSelectedDogIndex(0);
    }
  }, [dogsList.length, selectedDogIndex]);

  // Persist helper for client updates
  const saveClientData = async (updatedDogs: Dog[]) => {
    if (!id || !activeSeason) {
      showNotification(t("personDetails.selectSeasonWarning"), "warning");
      return;
    }

    try {
      if (client?.id) {
        const updated = await clientService.update(client.id, {
          ...client,
          dogs: updatedDogs,
        });
        setClient(updated);
      } else {
        const created = await clientService.create({
          person_id: id,
          season_id: activeSeason.id,
          dogs: updatedDogs,
        });
        setClient(created);
      }
      showNotification(t("personDetails.successSave"));
    } catch (err) {
      console.error("Erro ao salvar dados do cliente:", err);
      showNotification(t("personDetails.failSave"), "error");
    }
  };

  // Dog CRUD Handlers
  const handleOpenAddDog = () => {
    setEditingDogIndex(null);
    setNewCompetitionInput("");
    setDogForm({
      breed: "",
      competitions_won: 0,
      won_competitions: [],
      is_owner: true,
    });
    setDogDialogOpen(true);
  };

  const handleOpenEditDog = (index: number) => {
    const d = dogsList[index];
    if (!d) return;
    setEditingDogIndex(index);
    setNewCompetitionInput("");
    setDogForm({
      breed: d.breed || "",
      competitions_won: d.competitions_won || 0,
      won_competitions: d.won_competitions || [],
      is_owner: d.is_owner ?? true,
    });
    setDogDialogOpen(true);
  };

  const handleAddCompetitionName = () => {
    const trimmed = newCompetitionInput.trim();
    if (!trimmed) return;
    setDogForm((prev) => ({
      ...prev,
      won_competitions: [...(prev.won_competitions || []), trimmed],
    }));
    setNewCompetitionInput("");
  };

  const handleRemoveCompetitionName = (compIndex: number) => {
    setDogForm((prev) => ({
      ...prev,
      won_competitions: (prev.won_competitions || []).filter(
        (_, i) => i !== compIndex,
      ),
    }));
  };

  const handleSaveDog = async () => {
    if (!dogForm.breed.trim()) {
      showNotification(t("personDetails.fillBreedWarning"), "warning");
      return;
    }

    const wonCount = Number(dogForm.competitions_won) || 0;
    let finalWonCompetitions = [...(dogForm.won_competitions || [])];
    if (newCompetitionInput.trim() && wonCount > 0) {
      finalWonCompetitions.push(newCompetitionInput.trim());
    }
    finalWonCompetitions =
      wonCount > 0
        ? finalWonCompetitions.map((c) => c.trim()).filter((c) => c.length > 0)
        : [];

    const newDogs = [...dogsList];
    if (editingDogIndex !== null) {
      newDogs[editingDogIndex] = {
        ...newDogs[editingDogIndex],
        breed: dogForm.breed.trim(),
        competitions_won: wonCount,
        won_competitions: finalWonCompetitions,
        is_owner: dogForm.is_owner,
      };
    } else {
      newDogs.unshift({
        breed: dogForm.breed.trim(),
        competitions_won: wonCount,
        won_competitions: finalWonCompetitions,
        is_owner: dogForm.is_owner,
        photos: [],
      });
      setSelectedDogIndex(0);
    }

    setDogDialogOpen(false);
    setNewCompetitionInput("");
    await saveClientData(newDogs);
  };

  const handleConfirmDeleteDog = async () => {
    if (deleteDogConfirm.index === null) return;
    const newDogs = [...dogsList];
    newDogs.splice(deleteDogConfirm.index, 1);
    setDeleteDogConfirm({ open: false, index: null });
    setSelectedDogIndex((prev) => Math.max(0, prev - 1));
    await saveClientData(newDogs);
  };

  // Photo Handlers
  const handleOpenAddPhoto = () => {
    if (!selectedDog) {
      showNotification(t("personDetails.selectDogFirstWarning"), "warning");
      return;
    }
    const defaultPhotog = photographers[0]?.id || "";

    setBatchPhotoForm({
      fileNumbersText: "",
      photographer_id: defaultPhotog,
      payment_method: "Pix",
      currency: "BRL",
      amount_paid: 0,
      judges: [],
    });
    setSinglePhotoForm({
      file_number: "",
      photographer_id: defaultPhotog,
      payment_method: "Pix",
      currency: "BRL",
      amount_paid: 0,
      judges: [],
    });
    setAddPhotoDialogOpen(true);
  };

  const handleSaveAddPhotos = async () => {
    if (selectedDogIndex < 0 || selectedDogIndex >= dogsList.length) return;

    const newDogs = [...dogsList];
    const currentDog = { ...newDogs[selectedDogIndex] };
    const currentPhotos = [...(currentDog.photos || [])];
    const nowIso = new Date().toISOString();

    if (photoTab === "batch") {
      const numbers = batchPhotoForm.fileNumbersText
        .split(/[\n,;]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (numbers.length === 0) {
        showNotification(t("personDetails.atLeastOneFileWarning"), "warning");
        return;
      }

      const isUnpaid = batchPhotoForm.payment_method === "Não pago";
      const newPhotos: Photo[] = numbers.map((num) => ({
        file_number: num,
        photographer_id: batchPhotoForm.photographer_id,
        payment_method: batchPhotoForm.payment_method,
        currency: isUnpaid ? undefined : batchPhotoForm.currency || "BRL",
        amount_paid: isUnpaid
          ? 0
          : Math.max(0, Number(batchPhotoForm.amount_paid) || 0),
        judges:
          batchPhotoForm.judges && batchPhotoForm.judges.length > 0
            ? batchPhotoForm.judges
            : undefined,
        created_at: nowIso,
      }));
      currentPhotos.unshift(...newPhotos);
    } else {
      if (!singlePhotoForm.file_number.trim()) {
        showNotification(t("personDetails.enterFileNumberWarning"), "warning");
        return;
      }

      const isUnpaid = singlePhotoForm.payment_method === "Não pago";
      currentPhotos.unshift({
        file_number: singlePhotoForm.file_number.trim(),
        photographer_id: singlePhotoForm.photographer_id,
        payment_method: singlePhotoForm.payment_method,
        currency: isUnpaid ? undefined : singlePhotoForm.currency || "BRL",
        amount_paid: isUnpaid
          ? 0
          : Math.max(0, Number(singlePhotoForm.amount_paid) || 0),
        judges:
          singlePhotoForm.judges && singlePhotoForm.judges.length > 0
            ? singlePhotoForm.judges
            : undefined,
        created_at: nowIso,
      });
    }

    currentDog.photos = currentPhotos;
    newDogs[selectedDogIndex] = currentDog;
    setAddPhotoDialogOpen(false);
    await saveClientData(newDogs);
  };

  const handleOpenEditPhoto = (pIdx: number) => {
    if (!selectedDog) return;
    const photo = selectedDog.photos[pIdx];
    if (!photo) return;
    setEditingPhotoIndex(pIdx);
    setEditPhotoForm({
      file_number: photo.file_number || "",
      photographer_id: photo.photographer_id || "",
      payment_method: photo.payment_method || "Pix",
      currency: photo.currency || "BRL",
      amount_paid: photo.amount_paid || 0,
      judges: photo.judges || [],
    });
    setEditPhotoDialogOpen(true);
  };

  const handleSaveEditPhoto = async () => {
    if (editingPhotoIndex === null || !selectedDog) return;
    if (!editPhotoForm.file_number.trim()) {
      showNotification(t("personDetails.enterFileNumberWarning"), "warning");
      return;
    }

    const newDogs = [...dogsList];
    const currentDog = { ...newDogs[selectedDogIndex] };
    const currentPhotos = [...(currentDog.photos || [])];
    const existingPhoto = currentPhotos[editingPhotoIndex];
    const isUnpaid = editPhotoForm.payment_method === "Não pago";

    currentPhotos[editingPhotoIndex] = {
      ...existingPhoto,
      file_number: editPhotoForm.file_number.trim(),
      photographer_id: editPhotoForm.photographer_id,
      payment_method: editPhotoForm.payment_method,
      currency: isUnpaid ? undefined : editPhotoForm.currency || "BRL",
      amount_paid: isUnpaid
        ? 0
        : Math.max(0, Number(editPhotoForm.amount_paid) || 0),
      judges:
        editPhotoForm.judges && editPhotoForm.judges.length > 0
          ? editPhotoForm.judges
          : undefined,
      created_at: existingPhoto.created_at || new Date().toISOString(),
    };

    currentDog.photos = currentPhotos;
    newDogs[selectedDogIndex] = currentDog;
    setEditPhotoDialogOpen(false);
    setEditingPhotoIndex(null);
    await saveClientData(newDogs);
  };

  const handleConfirmDeletePhoto = async () => {
    if (deletePhotoConfirm.index === null || !selectedDog) return;
    const newDogs = [...dogsList];
    const currentDog = { ...newDogs[selectedDogIndex] };
    const currentPhotos = [...(currentDog.photos || [])];

    currentPhotos.splice(deletePhotoConfirm.index, 1);
    currentDog.photos = currentPhotos;
    newDogs[selectedDogIndex] = currentDog;

    setDeletePhotoConfirm({ open: false, index: null });
    await saveClientData(newDogs);
  };

  const photographerMap = useMemo(() => {
    const map = new Map<string, string>();
    photographers.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [photographers]);

  const dogStats = useMemo(() => {
    if (!selectedDog)
      return { totalPhotos: 0, totalPaidBRL: 0, totalPaidUSD: 0 };
    const photos = selectedDog.photos || [];
    let totalPaidBRL = 0;
    let totalPaidUSD = 0;
    photos.forEach((p) => {
      if (p.payment_method !== "Não pago" && p.amount_paid) {
        if (p.currency === "USD") {
          totalPaidUSD += p.amount_paid;
        } else {
          totalPaidBRL += p.amount_paid;
        }
      }
    });
    return {
      totalPhotos: photos.length,
      totalPaidBRL,
      totalPaidUSD,
    };
  }, [selectedDog]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!person) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" color="error" gutterBottom>
          {t("personDetails.notFound")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
        >
          {t("personDetails.backToOverview")}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Top Navigation & Person Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{ bgcolor: "action.hover" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: "primary.main", width: 52, height: 52 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                {person.name}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 0.5,
                }}
              >
                {person.email && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "text.secondary",
                      fontSize: "0.875rem",
                    }}
                  >
                    <EmailIcon fontSize="inherit" />
                    <span>{person.email}</span>
                  </Box>
                )}
                {person.phone && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "text.secondary",
                      fontSize: "0.875rem",
                    }}
                  >
                    <PhoneIcon fontSize="inherit" />
                    <span>{formatPhone(person.phone)}</span>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {activeSeason ? (
              <Chip
                icon={<EventNoteIcon />}
                label={t("dashboard.eventLabel", { name: activeSeason.name })}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600, px: 1, py: 2.2, borderRadius: 2 }}
              />
            ) : (
              <Chip
                label={t("personDetails.noEventSelected")}
                color="warning"
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Event Warning Banner if not selected */}
      {!activeSeason && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          {t("personDetails.eventWarning")}
        </Alert>
      )}

      {/* Master-Detail Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Master List of Dogs */}
        <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              minHeight: 520,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PetsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("personDetails.dogs")}
                </Typography>
                <Chip
                  label={dogsList.length}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDog}
                disabled={!activeSeason}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {t("shared.add")}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {dogsList.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  px: 2,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "grey.100",
                    color: "grey.400",
                    mb: 1,
                  }}
                >
                  <PetsIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  {t("personDetails.noDogsRegistered")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("personDetails.noDogsRegisteredDesc")}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDog}
                  disabled={!activeSeason}
                  sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
                >
                  {t("personDetails.registerDogBtn")}
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                {dogsList.map((dog, idx) => {
                  const isSelected = idx === selectedDogIndex;
                  const photoCount = dog.photos?.length || 0;
                  return (
                    <Card
                      key={idx}
                      elevation={0}
                      onClick={() => setSelectedDogIndex(idx)}
                      sx={{
                        borderRadius: 2.5,
                        cursor: "pointer",
                        border: "2px solid",
                        borderColor: isSelected ? "primary.main" : "divider",
                        bgcolor: isSelected
                          ? "rgba(25, 118, 210, 0.04)"
                          : "background.paper",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor: isSelected ? "primary.main" : "grey.400",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              color: isSelected
                                ? "primary.main"
                                : "text.primary",
                            }}
                          >
                            {dog.breed || t("personDetails.noDefinedBreed")}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              dog.is_owner
                                ? t("personDetails.owner")
                                : t("personDetails.handler")
                            }
                            color={dog.is_owner ? "success" : "default"}
                            variant="outlined"
                            sx={{ fontSize: "0.75rem", height: 22 }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 1,
                          }}
                        >
                          <Chip
                            icon={<PhotoCameraIcon style={{ fontSize: 14 }} />}
                            label={t("dashboard.photoCount", {
                              count: photoCount,
                            })}
                            size="small"
                            color={photoCount > 0 ? "primary" : "default"}
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title={t("personDetails.editDog")}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDog(idx);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("personDetails.deleteDog")}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDogConfirm({
                                    open: true,
                                    index: idx,
                                  });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Detail View of Selected Dog & Photos */}
        <Grid size={{ xs: 12, md: 8, lg: 8.5 }}>
          {selectedDog ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                minHeight: 520,
              }}
            >
              {/* Dog Overview Card */}
              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2.5,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {selectedDog.breed || t("personDetails.selectedDog")}
                    </Typography>
                    <Chip
                      label={
                        selectedDog.is_owner
                          ? t("personDetails.registeredOwner")
                          : t("personDetails.handler")
                      }
                      color={selectedDog.is_owner ? "success" : "default"}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      color: "text.secondary",
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <EmojiEventsIcon fontSize="small" color="warning" />
                      <Typography variant="body2">
                        <strong>{t("personDetails.victories")}</strong>{" "}
                        {selectedDog.competitions_won || 0}
                      </Typography>
                    </Box>
                  </Box>
                  {selectedDog.won_competitions &&
                    selectedDog.won_competitions.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          flexWrap: "wrap",
                          mt: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: "text.secondary",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {t("personDetails.wonCompetitionsTitle", {
                            count: selectedDog.won_competitions.length,
                          })}
                        </Typography>
                        {selectedDog.won_competitions.map((comp, cIdx) => (
                          <Chip
                            key={cIdx}
                            size="small"
                            icon={
                              <EmojiEventsIcon
                                style={{ fontSize: 13, color: "#d97706" }}
                              />
                            }
                            label={comp}
                            sx={{
                              bgcolor: "rgba(245, 158, 11, 0.1)",
                              color: "#b45309",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              borderRadius: 1.5,
                              border: "1px solid rgba(245, 158, 11, 0.25)",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDog(selectedDogIndex)}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    {t("personDetails.editDogData")}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddPhoto}
                    disabled={!activeSeason}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {t("personDetails.addPhotosBtn")}
                  </Button>
                </Box>
              </Box>

              {/* Photos Header & Statistics */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhotoCameraIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("personDetails.photosRegistered", {
                      count: dogStats.totalPhotos,
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {dogStats.totalPaidUSD > 0 && (
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={t("personDetails.totalCollected", {
                        currency: "$",
                        amount: dogStats.totalPaidUSD.toFixed(2),
                      })}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                  {dogStats.totalPaidBRL > 0 && (
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={t("personDetails.totalCollected", {
                        currency: "R$",
                        amount: dogStats.totalPaidBRL.toFixed(2),
                      })}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                  {dogStats.totalPaidBRL === 0 &&
                    dogStats.totalPaidUSD === 0 && (
                      <Chip
                        icon={<AttachMoneyIcon />}
                        label={t("personDetails.totalCollected", {
                          currency: "R$",
                          amount: "0.00",
                        })}
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                </Box>
              </Box>

              {/* Photos Grid */}
              {!selectedDog.photos || selectedDog.photos.length === 0 ? (
                <Box
                  sx={{
                    py: 8,
                    textAlign: "center",
                    bgcolor: "#fafcff",
                    border: "2px dashed #d0d7de",
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: "primary.light",
                      color: "primary.main",
                    }}
                  >
                    <PhotoCameraIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t("personDetails.noPhotosForDog")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 400 }}
                  >
                    {t("personDetails.noPhotosForDogDesc")}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddPhoto}
                    disabled={!activeSeason}
                    sx={{
                      mt: 1,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {t("personDetails.addPhotosNow")}
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {selectedDog.photos.map((photo, pIdx) => {
                    const photogName =
                      photographerMap.get(photo.photographer_id) ||
                      t("personDetails.unassignedPhotographer");
                    const paymentColor = getPaymentColor(photo.payment_method);
                    return (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={pIdx}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: "primary.light",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: "primary.main",
                                  fontSize: "0.85rem",
                                  fontWeight: 700,
                                }}
                              >
                                #{photo.file_number || "?"}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 700 }}
                                >
                                  {t("personDetails.file", {
                                    number: photo.file_number,
                                  })}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {photogName}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title={t("personDetails.editPhoto")}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditPhoto(pIdx)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t("personDetails.deletePhoto")}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    setDeletePhotoConfirm({
                                      open: true,
                                      index: pIdx,
                                    })
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          {photo.judges && photo.judges.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                                mb: 1,
                              }}
                            >
                              {photo.judges.map((j) => (
                                <Chip
                                  key={j}
                                  label={`${t("seasons.fields.judgeName")}: ${j}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.7rem", height: 20 }}
                                />
                              ))}
                            </Box>
                          )}

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <Chip
                              label={
                                photo.payment_method === "Não pago"
                                  ? t("personDetails.unpaid")
                                  : photo.payment_method ||
                                    t("personDetails.pendingPayment")
                              }
                              size="small"
                              color={paymentColor}
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                            />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700, color: "text.primary" }}
                            >
                              {photo.payment_method === "Não pago"
                                ? t("personDetails.unpaid")
                                : photo.amount_paid !== undefined
                                  ? `${photo.currency === "USD" ? "$" : "R$"} ${Number(photo.amount_paid).toFixed(2)}`
                                  : `${photo.currency === "USD" ? "$" : "R$"} 0.00`}
                            </Typography>
                          </Box>

                          {photo.created_at && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                mt: 1,
                                color: "text.secondary",
                                fontSize: "0.75rem",
                              }}
                            >
                              <AccessTimeIcon sx={{ fontSize: 13 }} />
                              <span>
                                {t("personDetails.registeredAt", {
                                  date: new Date(
                                    photo.created_at,
                                  ).toLocaleString("pt-BR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  }),
                                })}
                              </span>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                minHeight: 520,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "grey.100",
                  color: "grey.400",
                }}
              >
                <PetsIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("personDetails.noSelectedDog")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 450 }}
              >
                {t("personDetails.noSelectedDogDesc")}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDog}
                disabled={!activeSeason}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  mt: 1,
                }}
              >
                {t("personDetails.registerDogBtn")}
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Modal: Adicionar / Editar Cachorro */}
      <Dialog
        open={dogDialogOpen}
        onClose={() => setDogDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDogIndex !== null
            ? t("personDetails.editDogTitle")
            : t("personDetails.newDogTitle")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
        >
          <TextField
            label={t("clients.fields.breed")}
            placeholder={t("personDetails.breedPlaceholder")}
            fullWidth
            required
            autoFocus
            value={dogForm.breed}
            onChange={(e) => setDogForm({ ...dogForm, breed: e.target.value })}
          />
          <TextField
            label={t("personDetails.fields.competitions")}
            type="number"
            fullWidth
            value={dogForm.competitions_won}
            onChange={(e) => {
              const val = Math.max(0, parseInt(e.target.value) || 0);
              setDogForm({
                ...dogForm,
                competitions_won: val,
                won_competitions:
                  val === 0 ? [] : dogForm.won_competitions || [],
              });
            }}
          />

          {dogForm.competitions_won > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                p: 2,
                bgcolor: "#f8fafc",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <EmojiEventsIcon fontSize="small" color="warning" />
                {t("personDetails.wonCompetitionsTitle", {
                  count: dogForm.won_competitions?.length || 0,
                })}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t("personDetails.competitionPlaceholder")}
                  value={newCompetitionInput}
                  onChange={(e) => setNewCompetitionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCompetitionName();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddCompetitionName}
                  disabled={!newCompetitionInput.trim()}
                  startIcon={<AddIcon />}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {t("shared.add")}
                </Button>
              </Box>

              {dogForm.won_competitions &&
                dogForm.won_competitions.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.8,
                      mt: 0.5,
                    }}
                  >
                    {dogForm.won_competitions.map((compName, cIdx) => (
                      <Chip
                        key={cIdx}
                        label={compName}
                        onDelete={() => handleRemoveCompetitionName(cIdx)}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 500,
                          bgcolor: "background.paper",
                        }}
                      />
                    ))}
                  </Box>
                )}
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={dogForm.is_owner}
                onChange={(e) =>
                  setDogForm({ ...dogForm, is_owner: e.target.checked })
                }
                color="primary"
              />
            }
            label={t("personDetails.isOwnerLabel")}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setDogDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            {t("personDetails.cancel")}
          </Button>
          <Button
            onClick={handleSaveDog}
            variant="contained"
            disabled={!dogForm.breed.trim()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {t("personDetails.saveDog")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Adicionar Fotos (Lote ou Individual) */}
      <Dialog
        open={addPhotoDialogOpen}
        onClose={() => setAddPhotoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("personDetails.addPhotosForDog", {
            dog: selectedDog?.breed || "",
          })}
        </DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
          <Tabs
            value={photoTab}
            onChange={(_, val) => setPhotoTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              label={t("personDetails.batchTab")}
              value="batch"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              label={t("personDetails.singleTab")}
              value="single"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          </Tabs>
        </Box>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2.5 }}
        >
          {photoTab === "batch" ? (
            <>
              <TextField
                label={t("personDetails.batchFileNumbers")}
                placeholder={t("personDetails.batchPlaceholder")}
                multiline
                rows={3}
                fullWidth
                required
                autoFocus
                value={batchPhotoForm.fileNumbersText}
                onChange={(e) =>
                  setBatchPhotoForm({
                    ...batchPhotoForm,
                    fileNumbersText: e.target.value,
                  })
                }
                helperText={t("personDetails.batchHelper")}
              />
              <FormControl fullWidth size="small">
                <InputLabel>
                  {t("personDetails.fields.photographer")}
                </InputLabel>
                <Select
                  value={batchPhotoForm.photographer_id}
                  label={t("personDetails.fields.photographer")}
                  onChange={(e) =>
                    setBatchPhotoForm({
                      ...batchPhotoForm,
                      photographer_id: e.target.value,
                    })
                  }
                >
                  <MenuItem value="">
                    <em>{t("personDetails.fields.noneInformed")}</em>
                  </MenuItem>
                  {photographers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Autocomplete
                multiple
                size="small"
                options={activeSeason?.judges || []}
                value={batchPhotoForm.judges || []}
                onChange={(_, val) => {
                  setBatchPhotoForm({
                    ...batchPhotoForm,
                    judges: val,
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("personDetails.fields.judges")}
                    placeholder={
                      batchPhotoForm.judges?.length
                        ? ""
                        : activeSeason?.judges?.length
                          ? t("personDetails.fields.judgesPlaceholder")
                          : t("personDetails.fields.noJudges")
                    }
                    helperText={
                      activeSeason?.judges?.length
                        ? t("personDetails.fields.judgesHelper")
                        : t("personDetails.fields.judgesNoEventHelper")
                    }
                  />
                )}
              />
              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    sm: batchPhotoForm.payment_method === "Não pago" ? 12 : 4,
                  }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel>
                      {t("personDetails.fields.paymentMethod")}
                    </InputLabel>
                    <Select
                      value={batchPhotoForm.payment_method}
                      label={t("personDetails.fields.paymentMethod")}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        setBatchPhotoForm({
                          ...batchPhotoForm,
                          payment_method: newMethod,
                          amount_paid:
                            newMethod === "Não pago"
                              ? 0
                              : batchPhotoForm.amount_paid,
                        });
                      }}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {batchPhotoForm.payment_method !== "Não pago" && (
                  <>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{t("shared.currency")}</InputLabel>
                        <Select
                          value={batchPhotoForm.currency || "BRL"}
                          label={t("shared.currency")}
                          onChange={(e) =>
                            setBatchPhotoForm({
                              ...batchPhotoForm,
                              currency: e.target.value,
                            })
                          }
                        >
                          {CURRENCIES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label={t("personDetails.valuePerPhoto")}
                        type="number"
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                        value={batchPhotoForm.amount_paid}
                        onChange={(e) =>
                          setBatchPhotoForm({
                            ...batchPhotoForm,
                            amount_paid: Math.max(
                              0,
                              parseFloat(e.target.value) || 0,
                            ),
                          })
                        }
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          ) : (
            <>
              <TextField
                label={t("personDetails.singleFileNumber")}
                placeholder={t("personDetails.singleFilePlaceholder")}
                fullWidth
                required
                autoFocus
                value={singlePhotoForm.file_number}
                onChange={(e) =>
                  setSinglePhotoForm({
                    ...singlePhotoForm,
                    file_number: e.target.value,
                  })
                }
              />
              <FormControl fullWidth size="small">
                <InputLabel>
                  {t("personDetails.fields.photographer")}
                </InputLabel>
                <Select
                  value={singlePhotoForm.photographer_id}
                  label={t("personDetails.fields.photographer")}
                  onChange={(e) =>
                    setSinglePhotoForm({
                      ...singlePhotoForm,
                      photographer_id: e.target.value,
                    })
                  }
                >
                  <MenuItem value="">
                    <em>{t("personDetails.fields.noneInformed")}</em>
                  </MenuItem>
                  {photographers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Autocomplete
                multiple
                size="small"
                options={activeSeason?.judges || []}
                value={singlePhotoForm.judges || []}
                onChange={(_, val) => {
                  setSinglePhotoForm({
                    ...singlePhotoForm,
                    judges: val,
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("personDetails.fields.judges")}
                    placeholder={
                      singlePhotoForm.judges?.length
                        ? ""
                        : activeSeason?.judges?.length
                          ? t("personDetails.fields.judgesPlaceholder")
                          : t("personDetails.fields.noJudges")
                    }
                    helperText={
                      activeSeason?.judges?.length
                        ? t("personDetails.fields.judgesHelper")
                        : t("personDetails.fields.judgesNoEventHelper")
                    }
                  />
                )}
              />
              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    sm: singlePhotoForm.payment_method === "Não pago" ? 12 : 4,
                  }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel>
                      {t("personDetails.fields.paymentMethod")}
                    </InputLabel>
                    <Select
                      value={singlePhotoForm.payment_method}
                      label={t("personDetails.fields.paymentMethod")}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        setSinglePhotoForm({
                          ...singlePhotoForm,
                          payment_method: newMethod,
                          amount_paid:
                            newMethod === "Não pago"
                              ? 0
                              : singlePhotoForm.amount_paid,
                        });
                      }}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {singlePhotoForm.payment_method !== "Não pago" && (
                  <>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{t("shared.currency")}</InputLabel>
                        <Select
                          value={singlePhotoForm.currency || "BRL"}
                          label={t("shared.currency")}
                          onChange={(e) =>
                            setSinglePhotoForm({
                              ...singlePhotoForm,
                              currency: e.target.value,
                            })
                          }
                        >
                          {CURRENCIES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label={t("linkClient.fields.amountPaid")}
                        type="number"
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                        value={singlePhotoForm.amount_paid}
                        onChange={(e) =>
                          setSinglePhotoForm({
                            ...singlePhotoForm,
                            amount_paid: Math.max(
                              0,
                              parseFloat(e.target.value) || 0,
                            ),
                          })
                        }
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setAddPhotoDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            {t("personDetails.cancel")}
          </Button>
          <Button
            onClick={handleSaveAddPhotos}
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {t("personDetails.addPhotosAction")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Editar Foto */}
      <Dialog
        open={editPhotoDialogOpen}
        onClose={() => setEditPhotoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("personDetails.editPhotoTitle")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
        >
          <TextField
            label={t("personDetails.singleFileNumber")}
            fullWidth
            required
            autoFocus
            value={editPhotoForm.file_number}
            onChange={(e) =>
              setEditPhotoForm({
                ...editPhotoForm,
                file_number: e.target.value,
              })
            }
          />
          <FormControl fullWidth size="small">
            <InputLabel>{t("personDetails.fields.photographer")}</InputLabel>
            <Select
              value={editPhotoForm.photographer_id}
              label={t("personDetails.fields.photographer")}
              onChange={(e) =>
                setEditPhotoForm({
                  ...editPhotoForm,
                  photographer_id: e.target.value,
                })
              }
            >
              <MenuItem value="">
                <em>{t("personDetails.fields.noneInformed")}</em>
              </MenuItem>
              {photographers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            size="small"
            options={activeSeason?.judges || []}
            value={editPhotoForm.judges || []}
            onChange={(_, val) => {
              setEditPhotoForm({
                ...editPhotoForm,
                judges: val,
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("personDetails.fields.judges")}
                placeholder={
                  editPhotoForm.judges?.length
                    ? ""
                    : activeSeason?.judges?.length
                      ? t("personDetails.fields.judgesPlaceholder")
                      : t("personDetails.fields.noJudges")
                }
                helperText={
                  activeSeason?.judges?.length
                    ? t("personDetails.fields.judgesHelper")
                    : t("personDetails.fields.judgesNoEventHelper")
                }
              />
            )}
          />
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                sm: editPhotoForm.payment_method === "Não pago" ? 12 : 4,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>
                  {t("personDetails.fields.paymentMethod")}
                </InputLabel>
                <Select
                  value={editPhotoForm.payment_method}
                  label={t("personDetails.fields.paymentMethod")}
                  onChange={(e) => {
                    const newMethod = e.target.value;
                    setEditPhotoForm({
                      ...editPhotoForm,
                      payment_method: newMethod,
                      amount_paid:
                        newMethod === "Não pago"
                          ? 0
                          : editPhotoForm.amount_paid,
                    });
                  }}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {editPhotoForm.payment_method !== "Não pago" && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("shared.currency")}</InputLabel>
                    <Select
                      value={editPhotoForm.currency || "BRL"}
                      label={t("shared.currency")}
                      onChange={(e) =>
                        setEditPhotoForm({
                          ...editPhotoForm,
                          currency: e.target.value,
                        })
                      }
                    >
                      {CURRENCIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label={t("linkClient.fields.amountPaid")}
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                    value={editPhotoForm.amount_paid}
                    onChange={(e) =>
                      setEditPhotoForm({
                        ...editPhotoForm,
                        amount_paid: Math.max(
                          0,
                          parseFloat(e.target.value) || 0,
                        ),
                      })
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setEditPhotoDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            {t("personDetails.cancel")}
          </Button>
          <Button
            onClick={handleSaveEditPhoto}
            variant="contained"
            disabled={!editPhotoForm.file_number.trim()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {t("personDetails.savePhotoAction")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Cachorro */}
      <Dialog
        open={deleteDogConfirm.open}
        onClose={() => setDeleteDogConfirm({ open: false, index: null })}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("personDetails.deleteDog")}
        </DialogTitle>
        <DialogContent>
          <Typography>{t("personDetails.confirmDeleteDog")}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDogConfirm({ open: false, index: null })}
            sx={{ textTransform: "none" }}
          >
            {t("personDetails.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDeleteDog}
            color="error"
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            {t("personDetails.deleteDog")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Foto */}
      <Dialog
        open={deletePhotoConfirm.open}
        onClose={() => setDeletePhotoConfirm({ open: false, index: null })}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("personDetails.deletePhoto")}
        </DialogTitle>
        <DialogContent>
          <Typography>{t("personDetails.confirmDeletePhoto")}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeletePhotoConfirm({ open: false, index: null })}
            sx={{ textTransform: "none" }}
          >
            {t("personDetails.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDeletePhoto}
            color="error"
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            {t("personDetails.deletePhoto")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
