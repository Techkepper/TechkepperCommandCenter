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
import { i18n } from "../../translate/i18n";

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

const empty = { shortcut: "", message: "", queueId: "", isActive: true };

const QuickAnswersModal = ({ open, onClose, quickAnswerId }) => {
  const classes = useStyles();
  const [quickAnswer, setQuickAnswer] = useState(empty);
  const [queues, setQueues] = useState([]);

  const validation = Yup.object().shape({
    shortcut: Yup.string()
      .min(2)
      .max(20)
      .required(i18n.t("quickAnswersModal.extra.required")),
    message: Yup.string()
      .min(8)
      .max(30000)
      .required(i18n.t("quickAnswersModal.extra.required")),
  });

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
      toast.success(i18n.t("quickAnswersModal.extra.saved"));
      close();
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>
        {quickAnswerId
          ? i18n.t("quickAnswersModal.extra.titleEdit")
          : i18n.t("quickAnswersModal.extra.titleNew")}
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
                label={i18n.t("quickAnswersModal.extra.shortcut")}
                name="shortcut"
                error={touched.shortcut && Boolean(errors.shortcut)}
                helperText={touched.shortcut && errors.shortcut}
                variant="outlined"
                margin="dense"
                fullWidth
              />
              <Field
                as={TextField}
                label={i18n.t("quickAnswersModal.extra.answer")}
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
                <InputLabel>
                  {i18n.t("quickAnswersModal.extra.queue")}
                </InputLabel>
                <Field
                  as={Select}
                  name="queueId"
                  label={i18n.t("quickAnswersModal.extra.queue")}
                >
                  <MenuItem value="">
                    {i18n.t("quickAnswersModal.extra.generalAnswer")}
                  </MenuItem>
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
                label={i18n.t("quickAnswersModal.extra.activeAnswer")}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={close} variant="outlined">
                {i18n.t("quickAnswersModal.extra.cancel")}
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
                className={classes.submit}
              >
                {i18n.t("quickAnswersModal.extra.save")}
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
