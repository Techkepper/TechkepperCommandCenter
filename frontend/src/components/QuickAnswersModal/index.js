import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormControlLabel,
  Switch,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(() => ({
  submit: { position: "relative" },
  progress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

const validation = Yup.object().shape({
  shortcut: Yup.string().min(2).max(20).required("Requerido"),
  message: Yup.string().min(8).max(30000).required("Requerido"),
});

const empty = { shortcut: "", message: "", queueId: "", isActive: true };

const QuickAnswersModal = ({ open, onClose, quickAnswerId }) => {
  const classes = useStyles();
  const [quickAnswer, setQuickAnswer] = useState(empty);
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    if (!open) return;
    api.get("/queue").then(({ data }) => setQueues(data)).catch(toastError);
    if (quickAnswerId) {
      api
        .get(`/quickAnswers/${quickAnswerId}`)
        .then(({ data }) =>
          setQuickAnswer({ ...data, queueId: data.queueId || "" })
        )
        .catch(toastError);
    }
  }, [quickAnswerId, open]);

  const close = () => {
    setQuickAnswer(empty);
    onClose();
  };

  const save = async (values) => {
    const payload = { ...values, queueId: values.queueId || null };
    try {
      if (quickAnswerId) await api.put(`/quickAnswers/${quickAnswerId}`, payload);
      else await api.post("/quickAnswers", payload);
      toast.success("Respuesta rápida guardada.");
      close();
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>
        {quickAnswerId ? "Editar respuesta rápida" : "Nueva respuesta rápida"}
      </DialogTitle>
      <Formik
        initialValues={quickAnswer}
        enableReinitialize
        validationSchema={validation}
        onSubmit={save}
      >
        {({ errors, touched, isSubmitting, values, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Field
                as={TextField}
                label="Atajo"
                name="shortcut"
                error={touched.shortcut && Boolean(errors.shortcut)}
                helperText={touched.shortcut && errors.shortcut}
                variant="outlined"
                margin="dense"
                fullWidth
              />
              <Field
                as={TextField}
                label="Respuesta"
                name="message"
                error={touched.message && Boolean(errors.message)}
                helperText={touched.message && errors.message}
                variant="outlined"
                margin="dense"
                multiline
                rows={5}
                fullWidth
              />
              <FormControl variant="outlined" margin="dense" fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Field as={Select} name="queueId" label="Departamento">
                  <MenuItem value="">Respuesta general</MenuItem>
                  {queues.map((queue) => (
                    <MenuItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </MenuItem>
                  ))}
                </Field>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={Boolean(values.isActive)}
                    onChange={(event) =>
                      setFieldValue("isActive", event.target.checked)
                    }
                  />
                }
                label="Respuesta activa"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={close} variant="outlined">
                Cancelar
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
                className={classes.submit}
              >
                Guardar
                {isSubmitting && (
                  <CircularProgress size={24} className={classes.progress} />
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default QuickAnswersModal;
