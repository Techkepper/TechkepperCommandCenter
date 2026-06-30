import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";
import { Add, DeleteOutline, Edit } from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const specialMessage = `Hola, gracias por comunicarse con Techkepper Company S.A. 👋

En este momento nos encontramos en un periodo especial de cierre temporal. Su mensaje fue recibido correctamente y será atendido cuando retomemos operaciones.

Gracias por su comprensión.`;

const urgentInstruction =
  "Si su caso es urgente, responda con la palabra URGENTE y una breve descripción del problema.";

const splitList = (value) =>
  value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const emptySpecialDate = {
  name: "",
  type: "holiday",
  startDate: "",
  endDate: "",
  message: `${specialMessage}\n\n${urgentInstruction}`,
  active: true,
};

const days = [
  [1, "Lunes"],
  [2, "Martes"],
  [3, "Miércoles"],
  [4, "Jueves"],
  [5, "Viernes"],
  [6, "Sábado"],
  [0, "Domingo"],
];

const typeLabels = {
  holiday: "Feriado",
  vacation: "Vacaciones",
  shutdown: "Cierre",
  maintenance: "Mantenimiento",
  custom: "Personalizado",
};

const BusinessHoursSettings = ({ cardClass }) => {
  const [config, setConfig] = useState(null);
  const [specialDates, setSpecialDates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/business-hours");
      setConfig(data.config);
      setSpecialDates(data.specialDates);
    } catch (error) {
      toastError(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setValue = (key, value) =>
    setConfig((current) => ({ ...current, [key]: value }));

  const toggleDay = (day) => {
    const selected = config.workingDays.includes(day);
    setValue(
      "workingDays",
      selected
        ? config.workingDays.filter((item) => item !== day)
        : [...config.workingDays, day]
    );
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/business-hours", config);
      setConfig(data);
      toast.success("Horario y respuestas automáticas actualizados.");
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  const saveSpecialDate = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/business-hours/special-dates/${editing.id}`, editing);
      } else {
        await api.post("/business-hours/special-dates", editing);
      }
      setEditing(null);
      await load();
      toast.success("Fecha especial guardada.");
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialDate = async (item) => {
    try {
      await api.put(`/business-hours/special-dates/${item.id}`, {
        ...item,
        active: !item.active,
      });
      await load();
    } catch (error) {
      toastError(error);
    }
  };

  const removeSpecialDate = async (item) => {
    if (!window.confirm(`¿Eliminar la fecha especial “${item.name}”?`)) return;
    try {
      await api.delete(`/business-hours/special-dates/${item.id}`);
      await load();
      toast.success("Fecha especial eliminada.");
    } catch (error) {
      toastError(error);
    }
  };

  if (!config) return null;

  return (
    <Paper className={cardClass}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gridGap={12}
      >
        <div>
          <Typography variant="h6">
            WhatsApp: Horario y respuestas automáticas
          </Typography>
          <Typography color="textSecondary" variant="body2">
            Respuestas posteriores a la recepción, con prioridad por fechas
            especiales y control anti-spam.
          </Typography>
        </div>
        <Button
          color="primary"
          variant="contained"
          onClick={saveConfig}
          disabled={saving}
        >
          Guardar horario
        </Button>
      </Box>

      <Box mt={2}>
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={Boolean(config.enabled)}
              onChange={(event) => setValue("enabled", event.target.checked)}
            />
          }
          label="Activar respuestas automáticas"
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            variant="outlined"
            label="Zona horaria"
            value={config.timezone}
            onChange={(event) => setValue("timezone", event.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            type="time"
            variant="outlined"
            label="Hora de inicio"
            InputLabelProps={{ shrink: true }}
            value={config.startTime}
            onChange={(event) => setValue("startTime", event.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            type="time"
            variant="outlined"
            label="Hora de cierre"
            InputLabelProps={{ shrink: true }}
            value={config.endTime}
            onChange={(event) => setValue("endTime", event.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2">Días laborales</Typography>
          <Box display="flex" flexWrap="wrap">
            {days.map(([value, label]) => (
              <FormControlLabel
                key={value}
                control={
                  <Checkbox
                    color="primary"
                    checked={config.workingDays.includes(value)}
                    onChange={() => toggleDay(value)}
                  />
                }
                label={label}
              />
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            variant="outlined"
            label="Cooldown por contacto (horas)"
            inputProps={{ min: 1, max: 720 }}
            value={config.cooldownHours}
            onChange={(event) =>
              setValue("cooldownHours", Number(event.target.value))
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            variant="outlined"
            label="Mensaje fuera de horario"
            value={config.afterHoursMessage}
            onChange={(event) =>
              setValue("afterHoursMessage", event.target.value)
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            variant="outlined"
            label="Mensaje de día no laborable"
            value={config.nonWorkingDayMessage}
            onChange={(event) =>
              setValue("nonWorkingDayMessage", event.target.value)
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Box mt={2} pt={2} borderTop="1px solid rgba(142, 230, 63, 0.18)">
            <Typography variant="h6">Alertas urgentes por correo</Typography>
            <Typography color="textSecondary" variant="body2">
              Se envían únicamente fuera de horario, en días no laborables o
              durante una fecha especial activa.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                color="primary"
                checked={Boolean(config.urgentEmailEnabled)}
                onChange={(event) =>
                  setValue("urgentEmailEnabled", event.target.checked)
                }
              />
            }
            label="Activar alertas urgentes por correo"
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            variant="outlined"
            label="Correos destinatarios"
            helperText="Separe múltiples correos con coma o una línea nueva."
            value={(config.urgentEmailRecipients || []).join("\n")}
            onChange={(event) =>
              setValue("urgentEmailRecipients", splitList(event.target.value))
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            variant="outlined"
            label="Cooldown urgente (minutos)"
            inputProps={{ min: 1, max: 10080 }}
            value={config.urgentEmailCooldownMinutes}
            onChange={(event) =>
              setValue("urgentEmailCooldownMinutes", Number(event.target.value))
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            label="Asunto del correo"
            value={config.urgentEmailSubject}
            onChange={(event) =>
              setValue("urgentEmailSubject", event.target.value)
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
            label="Palabras clave de urgencia"
            helperText="Una palabra o frase por línea."
            value={(config.urgentKeywords || []).join("\n")}
            onChange={(event) =>
              setValue("urgentKeywords", splitList(event.target.value))
            }
          />
        </Grid>
      </Grid>

      <Box
        mt={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h6">Fechas especiales</Typography>
        <Button
          startIcon={<Add />}
          color="primary"
          variant="outlined"
          onClick={() => setEditing({ ...emptySpecialDate })}
        >
          Agregar fecha
        </Button>
      </Box>
      <Box overflow="auto">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Desde</TableCell>
              <TableCell>Hasta</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {specialDates.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{typeLabels[item.type] || item.type}</TableCell>
                <TableCell>{item.startDate}</TableCell>
                <TableCell>{item.endDate}</TableCell>
                <TableCell>
                  <Switch
                    size="small"
                    color="primary"
                    checked={item.active}
                    onChange={() => toggleSpecialDate(item)}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    title="Editar"
                    onClick={() => setEditing({ ...item })}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    title="Eliminar"
                    onClick={() => removeSpecialDate(item)}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!specialDates.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay fechas especiales configuradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing?.id ? "Editar fecha especial" : "Nueva fecha especial"}
        </DialogTitle>
        <DialogContent dividers>
          {editing && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Nombre"
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  select
                  fullWidth
                  variant="outlined"
                  label="Tipo"
                  value={editing.type}
                  onChange={(event) =>
                    setEditing({ ...editing, type: event.target.value })
                  }
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  variant="outlined"
                  label="Fecha inicial"
                  InputLabelProps={{ shrink: true }}
                  value={editing.startDate}
                  onChange={(event) =>
                    setEditing({ ...editing, startDate: event.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  variant="outlined"
                  label="Fecha final"
                  InputLabelProps={{ shrink: true }}
                  value={editing.endDate}
                  onChange={(event) =>
                    setEditing({ ...editing, endDate: event.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  variant="outlined"
                  label="Mensaje"
                  value={editing.message}
                  onChange={(event) =>
                    setEditing({ ...editing, message: event.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      color="primary"
                      checked={editing.active}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          active: event.target.checked,
                        })
                      }
                    />
                  }
                  label="Activa"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancelar</Button>
          <Button
            color="primary"
            variant="contained"
            disabled={
              saving ||
              !editing?.name ||
              !editing?.startDate ||
              !editing?.endDate ||
              !editing?.message
            }
            onClick={saveSpecialDate}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default BusinessHoursSettings;
