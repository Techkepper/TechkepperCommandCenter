import React, { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  makeStyles,
  Paper,
  Tab,
  Tabs,
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
import PlayArrowOutlinedIcon from "@material-ui/icons/PlayArrowOutlined";
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
  tabsPaper: {
    marginBottom: theme.spacing(2),
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
  templatePanel: {
    gridTemplateColumns: "minmax(180px, 1fr) minmax(160px, 0.8fr) minmax(220px, 1fr) auto",
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
  variableList: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
  },
}));

const formatSize = (size) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorCode = (err) =>
  err.response?.data?.error || err.response?.data?.message;

const getActiveVersion = (template) => template.versions?.[0] || null;

const SmartDocuments = () => {
  const classes = useStyles();
  const [activeTab, setActiveTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [templateSearchParam, setTemplateSearchParam] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [templatePageNumber, setTemplatePageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [templatesHasMore, setTemplatesHasMore] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateRequiredVariables, setTemplateRequiredVariables] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  const [installRequired, setInstallRequired] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generationTitle, setGenerationTitle] = useState("");
  const [generationData, setGenerationData] = useState("{}");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  useEffect(() => {
    setDocuments([]);
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setTemplates([]);
    setTemplatePageNumber(1);
  }, [templateSearchParam]);

  useEffect(() => {
    if (activeTab !== 0) return undefined;

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
  }, [activeTab, searchParam, pageNumber]);

  useEffect(() => {
    if (activeTab !== 1) return undefined;

    let mounted = true;
    setLoading(true);

    const delay = setTimeout(async () => {
      try {
        const { data } = await api.get("/document-templates", {
          params: { searchParam: templateSearchParam, pageNumber: templatePageNumber },
        });
        if (!mounted) return;
        setInstallRequired(false);
        setTemplates((current) => {
          const merged = [...current];
          data.templates.forEach((template) => {
            const index = merged.findIndex((item) => item.id === template.id);
            if (index >= 0) {
              merged[index] = template;
            } else {
              merged.push(template);
            }
          });
          return merged;
        });
        setTemplatesHasMore(data.hasMore);
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
  }, [activeTab, templateSearchParam, templatePageNumber]);

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
      setDocuments((current) => [
        data,
        ...current.filter((item) => item.id !== data.id),
      ]);
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

  const handleUploadTemplate = async () => {
    if (!templateFile) {
      toast.warn("Seleccione una plantilla DOCX.");
      return;
    }

    const formData = new FormData();
    formData.append("file", templateFile);
    formData.append("name", templateName || templateFile.name.replace(/\.docx$/i, ""));
    formData.append("category", templateCategory);
    formData.append("requiredVariables", templateRequiredVariables);

    setSaving(true);
    try {
      const { data } = await api.post("/document-templates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInstallRequired(false);
      setTemplates((current) => [
        data,
        ...current.filter((item) => item.id !== data.id),
      ]);
      setTemplateName("");
      setTemplateCategory("");
      setTemplateRequiredVariables("");
      setTemplateFile(null);
      toast.success("Plantilla guardada correctamente.");
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

  const openGenerateDialog = (template) => {
    const variables = getActiveVersion(template)?.requiredVariables || [];
    const initialData = variables.reduce(
      (acc, variable) => ({ ...acc, [variable]: "" }),
      {}
    );

    setSelectedTemplate(template);
    setGenerationTitle(template.name);
    setGenerationData(JSON.stringify(initialData, null, 2));
    setGenerateDialogOpen(true);
  };

  const handleGenerateDocument = async () => {
    let parsedData;
    try {
      parsedData = JSON.parse(generationData);
    } catch {
      toast.warn("Revise el JSON de variables antes de generar.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post(
        `/document-templates/${selectedTemplate.id}/generate`,
        {
          title: generationTitle,
          data: parsedData,
        }
      );
      setDocuments((current) => [
        data,
        ...current.filter((item) => item.id !== data.id),
      ]);
      setGenerateDialogOpen(false);
      setSelectedTemplate(null);
      setActiveTab(0);
      toast.success("Documento generado correctamente.");
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - (scrollTop + 100) >= clientHeight || loading) return;

    if (activeTab === 0 && hasMore) {
      setPageNumber((current) => current + 1);
    }
    if (activeTab === 1 && templatesHasMore) {
      setTemplatePageNumber((current) => current + 1);
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

      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Generar documento</DialogTitle>
        <DialogContent>
          <Typography color="textSecondary" gutterBottom>
            Complete las variables de la plantilla en formato JSON.
          </Typography>
          <TextField
            label="Nombre del documento"
            variant="outlined"
            margin="dense"
            fullWidth
            value={generationTitle}
            onChange={(event) => setGenerationTitle(event.target.value)}
          />
          <TextField
            label="Variables"
            variant="outlined"
            margin="dense"
            fullWidth
            multiline
            rows={10}
            value={generationData}
            onChange={(event) => setGenerationData(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancelar</Button>
          <Button
            color="primary"
            variant="contained"
            disabled={saving}
            onClick={handleGenerateDocument}
          >
            Generar
          </Button>
        </DialogActions>
      </Dialog>

      <MainHeader>
        <Title>Documentos inteligentes</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={activeTab === 0 ? "Buscar documento" : "Buscar plantilla"}
            type="search"
            variant="outlined"
            size="small"
            value={activeTab === 0 ? searchParam : templateSearchParam}
            onChange={(event) =>
              activeTab === 0
                ? setSearchParam(event.target.value)
                : setTemplateSearchParam(event.target.value)
            }
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

      <Paper className={classes.tabsPaper} variant="outlined">
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Documentos" />
          <Tab label="Plantillas" />
        </Tabs>
      </Paper>

      {installRequired && (
        <Paper className={classes.installWarning} variant="outlined">
          <Typography variant="h6">Instalación pendiente</Typography>
          <Typography color="textSecondary">
            El módulo está integrado, pero faltan tablas o columnas de
            Documentos inteligentes. Revise SQL_MANUAL_STEPS.md antes de
            habilitar el uso operativo.
          </Typography>
        </Paper>
      )}

      {!installRequired && activeTab === 0 && (
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

      {!installRequired && activeTab === 1 && (
        <>
          <Paper
            className={`${classes.uploadPanel} ${classes.templatePanel}`}
            variant="outlined"
          >
            <TextField
              label="Nombre de la plantilla"
              variant="outlined"
              size="small"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
            <TextField
              label="Categoría"
              variant="outlined"
              size="small"
              value={templateCategory}
              onChange={(event) => setTemplateCategory(event.target.value)}
            />
            <TextField
              label="Variables requeridas"
              placeholder="NOMBRE_CLIENTE, CEDULA_CLIENTE"
              variant="outlined"
              size="small"
              value={templateRequiredVariables}
              onChange={(event) => setTemplateRequiredVariables(event.target.value)}
            />
            <div>
              <input
                accept=".docx"
                className={classes.hiddenInput}
                id="smart-template-file"
                type="file"
                onChange={(event) =>
                  setTemplateFile(event.target.files?.[0] || null)
                }
              />
              <label htmlFor="smart-template-file">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadOutlinedIcon />}
                >
                  {templateFile ? "Cambiar DOCX" : "Seleccionar DOCX"}
                </Button>
              </label>
              <Button
                color="primary"
                variant="contained"
                disabled={saving || !templateFile}
                onClick={handleUploadTemplate}
                style={{ marginLeft: 8 }}
              >
                Guardar
              </Button>
              {templateFile && (
                <Typography variant="caption" display="block">
                  {templateFile.name}
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
                  <TableCell>Plantilla</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Variables</TableCell>
                  <TableCell>Creada por</TableCell>
                  <TableCell>Actualización</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => {
                  const activeVersion = getActiveVersion(template);
                  const variables = activeVersion?.detectedVariables || [];
                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Typography className={classes.fileName}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Versión {activeVersion?.version || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {template.category ? (
                          <Chip size="small" label={template.category} />
                        ) : (
                          "General"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={classes.variableList}>
                          {variables.length ? (
                            variables.map((variable) => (
                              <Chip key={variable} size="small" label={variable} />
                            ))
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Sin variables detectadas
                            </Typography>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{template.createdBy?.name || "-"}</TableCell>
                      <TableCell>
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          disabled={!activeVersion}
                          onClick={() => openGenerateDialog(template)}
                        >
                          <PlayArrowOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && templates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className={classes.emptyState}>
                        <Typography color="textSecondary">
                          No hay plantillas para mostrar.
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
