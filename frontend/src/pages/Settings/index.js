import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Box,
} from "@material-ui/core";
import { SaveOutlined } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: { paddingTop: theme.spacing(4), paddingBottom: theme.spacing(5) },
  card: { padding: theme.spacing(3), marginTop: theme.spacing(3) },
  note: {
    padding: theme.spacing(2),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    background: "rgba(142,230,63,.08)",
    marginTop: theme.spacing(2),
  },
}));

const editableKeys = [
  "assignmentAutoMessage",
  "assignmentMessageTemplate",
  "companyName",
  "companyEmail",
  "companyPhone",
  "businessHours",
  "defaultTheme",
  "allowAgentHistory",
];

const Settings = () => {
  const classes = useStyles();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then(({ data }) =>
        setValues(
          data.reduce((result, item) => {
            result[item.key] = item.value;
            return result;
          }, {})
        )
      )
      .catch(toastError);
  }, []);

  const change = (key) => (event) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(
        editableKeys
          .filter((key) => values[key] !== undefined)
          .map((key) => api.put(`/settings/${key}`, { value: values[key] }))
      );
      toast.success("Configuración actualizada.");
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" className={classes.root}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h4">Configuración operativa</Typography>
          <Typography color="textSecondary">
            Identidad, asignaciones automáticas y acceso a reportes.
          </Typography>
        </div>
        <Button
          color="primary"
          variant="contained"
          startIcon={<SaveOutlined />}
          onClick={save}
          disabled={saving}
        >
          Guardar cambios
        </Button>
      </Box>

      <Paper className={classes.card}>
        <Typography variant="h6">Empresa</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Nombre de empresa"
              value={values.companyName || ""}
              onChange={change("companyName")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Correo operativo"
              value={values.companyEmail || ""}
              onChange={change("companyEmail")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Canal operativo"
              value={values.companyPhone || ""}
              onChange={change("companyPhone")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Horario de atención"
              value={values.businessHours || ""}
              onChange={change("businessHours")}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.card}>
        <Typography variant="h6">Mensaje automático de asignación</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Estado"
              value={values.assignmentAutoMessage || "enabled"}
              onChange={change("assignmentAutoMessage")}
            >
              <MenuItem value="enabled">Activado</MenuItem>
              <MenuItem value="disabled">Desactivado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              variant="outlined"
              label="Plantilla"
              value={values.assignmentMessageTemplate || ""}
              onChange={change("assignmentMessageTemplate")}
              helperText="Variables: {NOMBRE_AGENTE}, {NOMBRE_CLIENTE}, {DEPARTAMENTO}, {EMPRESA}, {HORARIO_ATENCION}"
            />
          </Grid>
        </Grid>
        <div className={classes.note}>
          <Typography variant="body2">
            La asignación nunca se revierte si falla el envío. El resultado
            queda registrado en la auditoría interna de la conversación.
          </Typography>
        </div>
      </Paper>

      <Paper className={classes.card}>
        <Typography variant="h6">Experiencia y permisos</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Tema predeterminado"
              value={values.defaultTheme || "dark"}
              onChange={change("defaultTheme")}
            >
              <MenuItem value="dark">Oscuro</MenuItem>
              <MenuItem value="light">Claro</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Agentes pueden ver su historial"
              value={values.allowAgentHistory || "disabled"}
              onChange={change("allowAgentHistory")}
            >
              <MenuItem value="enabled">Sí</MenuItem>
              <MenuItem value="disabled">No</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Settings;
