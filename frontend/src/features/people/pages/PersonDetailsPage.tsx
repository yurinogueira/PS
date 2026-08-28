import { useState, useEffect, useMemo } from "react";
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
  CardActionArea,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  Tab,
  Tabs,
  CircularProgress,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PetsIcon from "@mui/icons-material/Pets";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GavelIcon from "@mui/icons-material/Gavel";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import {
  clientService,
  SeasonClient,
  Dog,
  Photo,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";

const PAYMENT_METHODS = [
  "Pix",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Não pago",
];

const getPaymentColor = (
  method?: string,
): "success" | "primary" | "warning" | "error" | "default" => {
  switch (method) {
    case "Pix":
      return "success";
    case "Credit Card":
    case "Debit Card":
      return "primary";
    case "Cash":
      return "warning";
    case "Não pago":
      return "error";
    default:
      return "default";
  }
};

export const PersonDetailsPage = () => {
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
  const [dogForm, setDogForm] = useState({
    breed: "",
    judge: "",
    competitions_won: 0,
    is_owner: true,
  });

  // Photo Dialog (Add - Batch / Single)
  const [addPhotoDialogOpen, setAddPhotoDialogOpen] = useState(false);
  const [photoTab, setPhotoTab] = useState<"batch" | "single">("batch");
  const [batchPhotoForm, setBatchPhotoForm] = useState({
    fileNumbersText: "",
    photographer_id: "",
    payment_method: "Pix",
    amount_paid: 0,
  });
  const [singlePhotoForm, setSinglePhotoForm] = useState<Omit<Photo, "id">>({
    file_number: "",
    photographer_id: "",
    payment_method: "Pix",
    amount_paid: 0,
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
    amount_paid: 0,
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

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [pData, clientsData, phData] = await Promise.all([
        personService.getById(id),
        clientService.list(),
        photographerService.list(),
      ]);

      setPerson(pData);
      setPhotographers(phData || []);

      if (activeSeason) {
        const currentClient = (clientsData || []).find(
          (c) => c.person_id === id && c.season_id === activeSeason.id,
        );
        setClient(currentClient || null);
      } else {
        setClient(null);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da pessoa:", err);
      showNotification("Erro ao carregar os dados.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, activeSeason?.id]);

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
      showNotification(
        "Selecione uma temporada ativa para salvar alterações.",
        "warning",
      );
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
      showNotification("Alterações salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar dados do cliente:", err);
      showNotification("Falha ao salvar as alterações.", "error");
    }
  };

  // Dog CRUD Handlers
  const handleOpenAddDog = () => {
    setEditingDogIndex(null);
    setDogForm({
      breed: "",
      judge: "",
      competitions_won: 0,
      is_owner: true,
    });
    setDogDialogOpen(true);
  };

  const handleOpenEditDog = (index: number) => {
    const d = dogsList[index];
    if (!d) return;
    setEditingDogIndex(index);
    setDogForm({
      breed: d.breed || "",
      judge: d.judge || "",
      competitions_won: d.competitions_won || 0,
      is_owner: d.is_owner ?? true,
    });
    setDogDialogOpen(true);
  };

  const handleSaveDog = async () => {
    if (!dogForm.breed.trim()) {
      showNotification("Por favor, preencha a raça do cachorro.", "warning");
      return;
    }

    const newDogs = [...dogsList];
    if (editingDogIndex !== null) {
      newDogs[editingDogIndex] = {
        ...newDogs[editingDogIndex],
        breed: dogForm.breed.trim(),
        judge: dogForm.judge.trim(),
        competitions_won: Number(dogForm.competitions_won) || 0,
        is_owner: dogForm.is_owner,
      };
    } else {
      newDogs.push({
        id: "dog_" + Date.now(),
        breed: dogForm.breed.trim(),
        judge: dogForm.judge.trim(),
        competitions_won: Number(dogForm.competitions_won) || 0,
        is_owner: dogForm.is_owner,
        photos: [],
      });
      setSelectedDogIndex(newDogs.length - 1);
    }

    setDogDialogOpen(false);
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
      showNotification(
        "Selecione ou cadastre um cachorro primeiro.",
        "warning",
      );
      return;
    }
    const defaultPhotog = photographers[0]?.id || "";
    setBatchPhotoForm({
      fileNumbersText: "",
      photographer_id: defaultPhotog,
      payment_method: "Pix",
      amount_paid: 0,
    });
    setSinglePhotoForm({
      file_number: "",
      photographer_id: defaultPhotog,
      payment_method: "Pix",
      amount_paid: 0,
    });
    setAddPhotoDialogOpen(true);
  };

  const handleSaveAddPhotos = async () => {
    if (selectedDogIndex < 0 || selectedDogIndex >= dogsList.length) return;

    const newDogs = [...dogsList];
    const currentDog = { ...newDogs[selectedDogIndex] };
    const currentPhotos = [...(currentDog.photos || [])];

    if (photoTab === "batch") {
      const numbers = batchPhotoForm.fileNumbersText
        .split(/[\n,;]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (numbers.length === 0) {
        showNotification(
          "Digite ao menos um número de arquivo de foto.",
          "warning",
        );
        return;
      }

      numbers.forEach((num, i) => {
        currentPhotos.push({
          id: "photo_" + Date.now() + "_" + i,
          file_number: num,
          photographer_id: batchPhotoForm.photographer_id,
          payment_method: batchPhotoForm.payment_method,
          amount_paid: Number(batchPhotoForm.amount_paid) || 0,
        });
      });
    } else {
      if (!singlePhotoForm.file_number.trim()) {
        showNotification("Digite o número do arquivo da foto.", "warning");
        return;
      }

      currentPhotos.push({
        id: "photo_" + Date.now(),
        file_number: singlePhotoForm.file_number.trim(),
        photographer_id: singlePhotoForm.photographer_id,
        payment_method: singlePhotoForm.payment_method,
        amount_paid: Number(singlePhotoForm.amount_paid) || 0,
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
      amount_paid: photo.amount_paid || 0,
    });
    setEditPhotoDialogOpen(true);
  };

  const handleSaveEditPhoto = async () => {
    if (editingPhotoIndex === null || !selectedDog) return;
    if (!editPhotoForm.file_number.trim()) {
      showNotification("Digite o número do arquivo da foto.", "warning");
      return;
    }

    const newDogs = [...dogsList];
    const currentDog = { ...newDogs[selectedDogIndex] };
    const currentPhotos = [...(currentDog.photos || [])];

    currentPhotos[editingPhotoIndex] = {
      ...currentPhotos[editingPhotoIndex],
      file_number: editPhotoForm.file_number.trim(),
      photographer_id: editPhotoForm.photographer_id,
      payment_method: editPhotoForm.payment_method,
      amount_paid: Number(editPhotoForm.amount_paid) || 0,
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
    if (!selectedDog) return { totalPhotos: 0, totalPaid: 0 };
    const photos = selectedDog.photos || [];
    const totalPaid = photos.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    return {
      totalPhotos: photos.length,
      totalPaid,
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
          Pessoa não encontrada
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
        >
          Voltar para a Visão Geral
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: "0 auto" }}>
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
                    <span>{person.phone}</span>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {activeSeason ? (
              <Chip
                icon={<EventNoteIcon />}
                label={`Temporada: ${activeSeason.name}`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600, px: 1, py: 2.2, borderRadius: 2 }}
              />
            ) : (
              <Chip
                label="Nenhuma temporada selecionada"
                color="warning"
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Season Warning Banner if not selected */}
      {!activeSeason && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Por favor, selecione uma temporada no topo da página para cadastrar e
          gerenciar os cachorros e fotos de competições desta pessoa.
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
                  Cachorros
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
                Adicionar
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
                  Nenhum cachorro cadastrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adicione o primeiro cachorro para registrar fotos nesta
                  temporada.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDog}
                  disabled={!activeSeason}
                  sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
                >
                  Cadastrar Cachorro
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
                      key={dog.id || idx}
                      elevation={0}
                      sx={{
                        borderRadius: 2.5,
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
                      <CardActionArea
                        onClick={() => setSelectedDogIndex(idx)}
                        sx={{ p: 1.5 }}
                      >
                        <CardContent sx={{ p: "0 !important" }}>
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
                              {dog.breed || "Sem raça definida"}
                            </Typography>
                            <Chip
                              size="small"
                              label={dog.is_owner ? "Dono" : "Apresentador"}
                              color={dog.is_owner ? "success" : "default"}
                              variant="outlined"
                              sx={{ fontSize: "0.75rem", height: 22 }}
                            />
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              color: "text.secondary",
                              fontSize: "0.8rem",
                              mb: 1,
                            }}
                          >
                            {dog.judge ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <GavelIcon fontSize="inherit" />
                                <span>Juiz: {dog.judge}</span>
                              </Box>
                            ) : null}
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
                              icon={
                                <PhotoCameraIcon style={{ fontSize: 14 }} />
                              }
                              label={`${photoCount} ${photoCount === 1 ? "foto" : "fotos"}`}
                              size="small"
                              color={photoCount > 0 ? "primary" : "default"}
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                            />
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="Editar Cão">
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
                              <Tooltip title="Excluir Cão">
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
                      </CardActionArea>
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
                      {selectedDog.breed || "Cachorro Selecionado"}
                    </Typography>
                    <Chip
                      label={
                        selectedDog.is_owner
                          ? "Proprietário Registrado"
                          : "Apresentador"
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
                      gap: 3,
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
                      <GavelIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Juiz:</strong>{" "}
                        {selectedDog.judge || "Não informado"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <EmojiEventsIcon fontSize="small" color="warning" />
                      <Typography variant="body2">
                        <strong>Vitórias:</strong>{" "}
                        {selectedDog.competitions_won || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDog(selectedDogIndex)}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Editar Dados
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
                    Adicionar Fotos
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
                    Fotos Cadastradas ({dogStats.totalPhotos})
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip
                    icon={<AttachMoneyIcon />}
                    label={`Total Arrecadado: R$ ${dogStats.totalPaid.toFixed(2)}`}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
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
                    Nenhuma foto cadastrada para este cachorro
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 400 }}
                  >
                    Clique no botão abaixo para adicionar fotos individualmente
                    ou em lote informando os números dos arquivos.
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
                    Adicionar Fotos Agora
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {selectedDog.photos.map((photo, pIdx) => {
                    const photogName =
                      photographerMap.get(photo.photographer_id) ||
                      "Não atribuído";
                    const paymentColor = getPaymentColor(photo.payment_method);
                    return (
                      <Grid
                        size={{ xs: 12, sm: 6, lg: 4 }}
                        key={photo.id || pIdx}
                      >
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
                                  Arquivo: {photo.file_number}
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
                              <Tooltip title="Editar Foto">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditPhoto(pIdx)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir Foto">
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

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Chip
                              label={photo.payment_method || "Pendente"}
                              size="small"
                              color={paymentColor}
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                            />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700, color: "text.primary" }}
                            >
                              {photo.amount_paid !== undefined
                                ? `R$ ${Number(photo.amount_paid).toFixed(2)}`
                                : "R$ 0.00"}
                            </Typography>
                          </Box>
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
                Nenhum cachorro selecionado
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 450 }}
              >
                Selecione um cachorro na lista à esquerda ou cadastre um novo
                cachorro para gerenciar suas fotos e informações.
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
                Cadastrar Cachorro
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
            ? "Editar Cachorro"
            : "Cadastrar Novo Cachorro"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
        >
          <TextField
            label="Raça do Cão"
            placeholder="Ex: Golden Retriever, Pastor Alemão..."
            fullWidth
            required
            autoFocus
            value={dogForm.breed}
            onChange={(e) => setDogForm({ ...dogForm, breed: e.target.value })}
          />
          <TextField
            label="Nome do Juiz"
            placeholder="Ex: Dr. Roberto Carlos"
            fullWidth
            value={dogForm.judge}
            onChange={(e) => setDogForm({ ...dogForm, judge: e.target.value })}
          />
          <TextField
            label="Competições Ganhas"
            type="number"
            fullWidth
            value={dogForm.competitions_won}
            onChange={(e) =>
              setDogForm({
                ...dogForm,
                competitions_won: Math.max(0, parseInt(e.target.value) || 0),
              })
            }
          />
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
            label="A pessoa é a proprietária (dona) deste cão?"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setDogDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveDog}
            variant="contained"
            disabled={!dogForm.breed.trim()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Salvar Cachorro
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
          Adicionar Fotos para {selectedDog?.breed || "o cão"}
        </DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
          <Tabs
            value={photoTab}
            onChange={(_, val) => setPhotoTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              label="Inserção em Lote (Ágil)"
              value="batch"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              label="Inserção Individual"
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
                label="Números dos Arquivos das Fotos"
                placeholder="Ex: 0101, 0102, 0103, 0104 (separados por vírgula ou linhas)"
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
                helperText="Você pode colar vários números de uma vez."
              />
              <FormControl fullWidth size="small">
                <InputLabel>Fotógrafo</InputLabel>
                <Select
                  value={batchPhotoForm.photographer_id}
                  label="Fotógrafo"
                  onChange={(e) =>
                    setBatchPhotoForm({
                      ...batchPhotoForm,
                      photographer_id: e.target.value,
                    })
                  }
                >
                  <MenuItem value="">
                    <em>Nenhum / Não informado</em>
                  </MenuItem>
                  {photographers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Forma de Pagamento</InputLabel>
                    <Select
                      value={batchPhotoForm.payment_method}
                      label="Forma de Pagamento"
                      onChange={(e) =>
                        setBatchPhotoForm({
                          ...batchPhotoForm,
                          payment_method: e.target.value,
                        })
                      }
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Valor por Foto (R$)"
                    type="number"
                    size="small"
                    fullWidth
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
              </Grid>
            </>
          ) : (
            <>
              <TextField
                label="Número do Arquivo da Foto"
                placeholder="Ex: DSC_0142"
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
                <InputLabel>Fotógrafo</InputLabel>
                <Select
                  value={singlePhotoForm.photographer_id}
                  label="Fotógrafo"
                  onChange={(e) =>
                    setSinglePhotoForm({
                      ...singlePhotoForm,
                      photographer_id: e.target.value,
                    })
                  }
                >
                  <MenuItem value="">
                    <em>Nenhum / Não informado</em>
                  </MenuItem>
                  {photographers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Forma de Pagamento</InputLabel>
                    <Select
                      value={singlePhotoForm.payment_method}
                      label="Forma de Pagamento"
                      onChange={(e) =>
                        setSinglePhotoForm({
                          ...singlePhotoForm,
                          payment_method: e.target.value,
                        })
                      }
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Valor Pago (R$)"
                    type="number"
                    size="small"
                    fullWidth
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
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setAddPhotoDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAddPhotos}
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Adicionar Fotos
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
        <DialogTitle sx={{ fontWeight: 700 }}>Editar Foto</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
        >
          <TextField
            label="Número do Arquivo da Foto"
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
            <InputLabel>Fotógrafo</InputLabel>
            <Select
              value={editPhotoForm.photographer_id}
              label="Fotógrafo"
              onChange={(e) =>
                setEditPhotoForm({
                  ...editPhotoForm,
                  photographer_id: e.target.value,
                })
              }
            >
              <MenuItem value="">
                <em>Nenhum / Não informado</em>
              </MenuItem>
              {photographers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Forma de Pagamento</InputLabel>
                <Select
                  value={editPhotoForm.payment_method}
                  label="Forma de Pagamento"
                  onChange={(e) =>
                    setEditPhotoForm({
                      ...editPhotoForm,
                      payment_method: e.target.value,
                    })
                  }
                >
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Valor Pago (R$)"
                type="number"
                size="small"
                fullWidth
                value={editPhotoForm.amount_paid}
                onChange={(e) =>
                  setEditPhotoForm({
                    ...editPhotoForm,
                    amount_paid: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setEditPhotoDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEditPhoto}
            variant="contained"
            disabled={!editPhotoForm.file_number.trim()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Salvar Foto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Cachorro */}
      <Dialog
        open={deleteDogConfirm.open}
        onClose={() => setDeleteDogConfirm({ open: false, index: null })}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirmar Exclusão de Cachorro
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir este cachorro e todas as suas fotos
            associadas nesta temporada?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDogConfirm({ open: false, index: null })}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDeleteDog}
            color="error"
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Excluir Cachorro
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Foto */}
      <Dialog
        open={deletePhotoConfirm.open}
        onClose={() => setDeletePhotoConfirm({ open: false, index: null })}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirmar Exclusão de Foto
        </DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja remover esta foto?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeletePhotoConfirm({ open: false, index: null })}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDeletePhoto}
            color="error"
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Excluir Foto
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
