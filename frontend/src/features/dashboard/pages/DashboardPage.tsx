import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import {
  clientService,
  SeasonClient,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import { useSeasonStore } from "../../../store/seasonStore";
import { LinkClientModal } from "../../clients/components/LinkClientModal";
import { ClientDetailsModal } from "../../clients/components/ClientDetailsModal";

export const DashboardPage = () => {
  const { activeSeason } = useSeasonStore();

  const [clients, setClients] = useState<SeasonClient[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const seasonId = activeSeason?.id;

  const loadData = useCallback(async () => {
    if (!seasonId) return;
    try {
      setLoading(true);
      const [clientRes, peopleList] = await Promise.all([
        clientService.list({
          season_id: seasonId,
          search: debouncedSearch || undefined,
          page: page + 1,
          limit: rowsPerPage,
        }),
        personService.list(),
      ]);

      setClients(clientRes?.data || []);
      setTotal(clientRes?.total ?? 0);
      setPeople(peopleList || []);
    } catch (err) {
      console.error("Erro ao carregar clientes da temporada:", err);
    } finally {
      setLoading(false);
    }
  }, [seasonId, debouncedSearch, page, rowsPerPage]);

  useEffect(() => {
    if (seasonId) {
      loadData();
    } else {
      setClients([]);
      setTotal(0);
    }
  }, [seasonId, loadData]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setDetailsModalOpen(true);
  };

  const getPersonName = (personId: string) => {
    const person = people.find((p) => p.id === personId);
    return person?.name || "Desconhecido";
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Visão Geral
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeSeason
              ? `Clientes e fotografias vinculados à temporada "${activeSeason.name}".`
              : "Selecione uma temporada no cabeçalho para gerenciar os clientes."}
          </Typography>
        </Box>

        {activeSeason && (
          <Button
            variant="contained"
            startIcon={<PersonAddRoundedIcon />}
            onClick={() => setLinkModalOpen(true)}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Vincular Cliente
          </Button>
        )}
      </Box>

      {/* Estado sem temporada ativa */}
      {!activeSeason ? (
        <Alert
          severity="info"
          icon={<EventNoteRoundedIcon fontSize="inherit" />}
          sx={{
            p: 2.5,
            borderRadius: 2,
            alignItems: "center",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Nenhuma temporada selecionada
          </Typography>
          <Typography variant="body2">
            Por favor, selecione uma temporada no menu superior para visualizar
            a listagem de clientes, cachorros e fotografias.
          </Typography>
        </Alert>
      ) : (
        <>
          {/* Barra de Filtros e Busca */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <TextField
              size="small"
              placeholder="Buscar por pessoa, cão ou número da foto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ maxWidth: 450, width: "100%" }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Paper>

          {/* Tabela de Clientes */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 8,
                }}
              >
                <CircularProgress size={36} />
              </Box>
            ) : total === 0 ? (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <PeopleOutlineRoundedIcon
                  sx={{ fontSize: 48, color: "text.secondary" }}
                />
                {debouncedSearch ? (
                  <>
                    <Typography variant="h6" color="text.secondary">
                      Nenhum cliente encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum cliente corresponde ao termo pesquisado &ldquo;
                      {debouncedSearch}&rdquo;.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Nenhum cliente vinculado nesta temporada
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ maxWidth: 420 }}
                    >
                      Esta temporada ainda não possui clientes cadastrados.
                      Comece vinculando uma pessoa e seus cães.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddRoundedIcon />}
                      onClick={() => setLinkModalOpen(true)}
                      sx={{ mt: 1, textTransform: "none" }}
                    >
                      Vincular Primeiro Cliente
                    </Button>
                  </>
                )}
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: "#fafafa" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Pessoa</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Cachorros
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Total de Fotos
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clients.map((client) => {
                        const totalPhotos = (client.dogs || []).reduce(
                          (acc, dog) => acc + (dog.photos?.length || 0),
                          0,
                        );

                        return (
                          <TableRow
                            key={client.id}
                            hover
                            sx={{
                              cursor: "pointer",
                              "&:last-child td, &:last-child th": { border: 0 },
                            }}
                            onClick={() => handleOpenDetails(client.id)}
                          >
                            <TableCell sx={{ fontWeight: 500 }}>
                              {getPersonName(client.person_id)}
                            </TableCell>
                            <TableCell>{client.dogs?.length || 0}</TableCell>
                            <TableCell>{totalPhotos}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityRoundedIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(client.id);
                                }}
                                sx={{ textTransform: "none" }}
                              >
                                Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={handlePageChange}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Itens por página:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
                  }
                />
              </>
            )}
          </Paper>

          {/* Modais */}
          <LinkClientModal
            open={linkModalOpen}
            onClose={() => setLinkModalOpen(false)}
            seasonId={activeSeason.id}
            onSuccess={loadData}
          />

          <ClientDetailsModal
            clientId={selectedClientId}
            open={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false);
              setSelectedClientId(null);
            }}
            onSuccess={loadData}
          />
        </>
      )}
    </Box>
  );
};
