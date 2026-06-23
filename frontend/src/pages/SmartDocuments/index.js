import React, { useEffect, useState } from "react";
import {
  Button,
  Chip,
  IconButton,
  InputAdornment,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";
import CloudUploadOutlinedIcon from "@material-ui/icons/CloudUploadOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import GetAppOutlinedIcon from "@material-ui/icons/GetAppOutlined";
import SearchIcon from "@material-ui/icons/Search";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  uploadPanel: {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1.2fr) minmax(180px, 1fr) auto",
    gap: theme.spacing(1.5),
    alignItems: "center",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderColor: "rgba(95, 175, 58, 0.3)",
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  hiddenInput: {
    display: "none",
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: "center",
  },
  installWarning: {
    padding: theme.spacing(3),
    borderColor: "rgba(255, 193, 7, 0.35)",
    background: "rgba(255, 193, 7, 0.08)",
  },
  fileName: {
    maxWidth: 320,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
}));

const formatSize = (size) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorCode = (err) => err.response?.data?.error || err.response?.data?.message;

const SmartDocuments = () => {
  const classes = useStyles();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [installRequired, setInstallRequired] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    setDocuments([]);
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const delay = setTimeout(async () => {
      try {
        const { data } = await api.get("/documents", {
          params: { searchParam, pageNumber },
        });
        if (!mounted) return;
        setInstallRequired(false);
        setDocuments((current) => {
          const merged = [...current];
          data.documents.forEach((document) => {
            const index = merged.findIndex((item) => item.id === document.id);
            if (index >= 0) {
              merged[index] = document;
            } else {
              merged.push(document);
            }
          });
          return merged;
        });
        setHasMore(data.hasMore);
      } catch (err) {
        if (getErrorCode(err) === "ERR_SMART_DOCUMENTS_NOT_INSTALLED") {
          setInstallRequired(true);
        } else {
          toastError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(delay);
    };
  }, [searchParam, pageNumber]);

  const handleUpload = async () => {
    if (!file) {
      toast.warn("Seleccione un archivo para subir.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("category", category);

    setSaving(true);
    try {
      const { data } = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInstallRequired(false);
      setDocuments((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setTitle("");
      setCategory("");
      setFile(null);
      toast.success("Documento guardado correctamente.");
    } catch (err) {
      if (getErrorCode(err) === "ERR_SMART_DOCUMENTS_NOT_INSTALLED") {
        setInstallRequired(true);
      } else {
        toastError(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      const { data } = await api.get(`/documents/${document.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute("download", document.originalName);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/documents/${deletingDocument.id}`);
      setDocuments((current) =>
        current.filter((document) => document.id !== deletingDocument.id)
      );
      toast.success("Documento eliminado correctamente.");
    } catch (err) {
      toastError(err);
    } finally {
      setDeletingDocument(null);
      setConfirmModalOpen(false);
    }
  };

  const handleScroll = (event) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      setPageNumber((current) => current + 1);
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingDocument
            ? `Eliminar documento ${deletingDocument.title}?`
            : "Eliminar documento"
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleDelete}
      >
        Esta acción quitará el documento del módulo y eliminará el archivo
        almacenado.
      </ConfirmationModal>

      <MainHeader>
        <Title>Documentos inteligentes</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder="Buscar documento"
            type="search"
            variant="outlined"
            size="small"
            value={searchParam}
            onChange={(event) => setSearchParam(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
        </MainHeaderButtonsWrapper>
      </MainHeader>

      {installRequired && (
        <Paper className={classes.installWarning} variant="outlined">
          <Typography variant="h6">Instalación pendiente</Typography>
          <Typography color="textSecondary">
            El módulo está integrado, pero falta crear la tabla
            SmartDocuments. Revise el archivo SQL_MANUAL_STEPS.md antes de
            habilitar el uso operativo.
          </Typography>
        </Paper>
      )}

      {!installRequired && (
        <>
          <Paper className={classes.uploadPanel} variant="outlined">
            <TextField
              label="Nombre del documento"
              variant="outlined"
              size="small"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <TextField
              label="Categoría"
              variant="outlined"
              size="small"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <div>
              <input
                accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                className={classes.hiddenInput}
                id="smart-document-file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <label htmlFor="smart-document-file">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadOutlinedIcon />}
                >
                  {file ? "Cambiar archivo" : "Seleccionar archivo"}
                </Button>
              </label>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !file}
                onClick={handleUpload}
                style={{ marginLeft: 8 }}
              >
                Guardar
              </Button>
              {file && (
                <Typography variant="caption" display="block">
                  {file.name}
                </Typography>
              )}
            </div>
          </Paper>

          <Paper
            className={classes.mainPaper}
            variant="outlined"
            onScroll={handleScroll}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Documento</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Subido por</TableCell>
                  <TableCell>Tamaño</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Typography className={classes.fileName}>
                        {document.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {document.originalName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {document.category ? (
                        <Chip size="small" label={document.category} />
                      ) : (
                        "General"
                      )}
                    </TableCell>
                    <TableCell>{document.uploadedBy?.name || "-"}</TableCell>
                    <TableCell>{formatSize(document.size)}</TableCell>
                    <TableCell>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(document)}
                      >
                        <GetAppOutlinedIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDeletingDocument(document);
                          setConfirmModalOpen(true);
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className={classes.emptyState}>
                        <Typography color="textSecondary">
                          No hay documentos para mostrar.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {loading && <TableRowSkeleton columns={6} />}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default SmartDocuments;
