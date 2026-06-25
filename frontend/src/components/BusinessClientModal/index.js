import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { toast } from "react-toastify";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  makeStyles,
} from "@material-ui/core";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  sectionTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
    color: theme.palette.primary.main,
  },
  submit: {
    position: "relative",
  },
  progress: {
    position: "absolute",
  },
}));

const emptyClient = {
  type: "physical",
  displayName: "",
  legalName: "",
  tradeName: "",
  identificationType: "Cédula física",
  identificationNumber: "",
  legalRepresentativeName: "",
  legalRepresentativeId: "",
  legalRepresentativePosition: "",
  email: "",
  phone: "",
  address: "",
  country: "Costa Rica",
  province: "",
  canton: "",
  district: "",
  notes: "",
  queueId: "",
};

const buildValidationSchema = (isAdmin) => Yup.object().shape({
  type: Yup.string()
    .oneOf(["physical", "legal"])
    .required(i18n.t("businessClients.modal.validation.required")),
  displayName: Yup.string()
    .min(2, i18n.t("businessClients.modal.validation.minName"))
    .max(255, i18n.t("businessClients.modal.validation.maxName"))
    .required(i18n.t("businessClients.modal.validation.nameRequired")),
  legalName: Yup.string().when("type", {
    is: "legal",
    then: Yup.string().required(
      i18n.t("businessClients.modal.validation.legalNameRequired")
    ),
  }),
  identificationType: Yup.string().required(
    i18n.t("businessClients.modal.validation.identificationTypeRequired")
  ),
  identificationNumber: Yup.string().required(
    i18n.t("businessClients.modal.validation.identificationRequired")
  ),
  email: Yup.string().email(
    i18n.t("businessClients.modal.validation.invalidEmail")
  ),
  queueId: isAdmin
    ? Yup.mixed().nullable()
    : Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" ? null : value
        )
        .nullable()
        .required(
          i18n.t("businessClients.modal.validation.departmentRequired")
        ),
});

const BusinessClientModal = ({
  open,
  onClose,
  clientId,
  isAdmin,
  onSaved,
  onInstallRequired,
}) => {
  const classes = useStyles();
  const [client, setClient] = useState(emptyClient);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let mounted = true;
    setLoading(true);

    const requests = [api.get("/queue")];
    if (clientId) requests.push(api.get(`/business-clients/${clientId}`));

    Promise.all(requests)
      .then(([queuesResponse, clientResponse]) => {
        if (!mounted) return;
        setQueues(queuesResponse.data);
        if (clientResponse) {
          setClient({
            ...emptyClient,
            ...clientResponse.data,
            queueId: clientResponse.data.queueId || "",
          });
        }
      })
      .catch((error) => {
        if (
          error.response?.data?.error === "ERR_BUSINESS_CLIENTS_NOT_INSTALLED"
        ) {
          onInstallRequired();
          onClose();
        } else {
          toastError(error);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [clientId, onClose, onInstallRequired, open]);

  const close = () => {
    setClient(emptyClient);
    onClose();
  };

  const save = async (values) => {
    const payload = {
      ...values,
      queueId: values.queueId || null,
    };

    try {
      const response = clientId
        ? await api.put(`/business-clients/${clientId}`, payload)
        : await api.post("/business-clients", payload);
      onSaved(response.data);
      toast.success(i18n.t("businessClients.toasts.saved"));
      close();
    } catch (error) {
      if (
        error.response?.data?.error === "ERR_BUSINESS_CLIENTS_NOT_INSTALLED"
      ) {
        onInstallRequired();
        close();
      } else if (
        error.response?.data?.error === "ERR_DUPLICATED_BUSINESS_CLIENT"
      ) {
        toast.error(i18n.t("businessClients.toasts.duplicated"));
      } else {
        toastError(error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        {clientId
          ? i18n.t("businessClients.modal.title.edit")
          : i18n.t("businessClients.modal.title.add")}
      </DialogTitle>
      <Formik
        initialValues={client}
        enableReinitialize
        validationSchema={buildValidationSchema(isAdmin)}
        onSubmit={save}
      >
        {({
          errors,
          touched,
          isSubmitting,
          values,
          setFieldValue,
        }) => (
          <Form>
            <DialogContent dividers>
              {loading ? (
                <CircularProgress size={28} />
              ) : (
                <>
                  <Typography className={classes.sectionTitle} variant="subtitle1">
                    {i18n.t("businessClients.modal.sections.identification")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl variant="outlined" margin="dense" fullWidth>
                        <InputLabel>
                          {i18n.t("businessClients.modal.fields.clientType")}
                        </InputLabel>
                        <Field
                          as={Select}
                          name="type"
                          label={i18n.t("businessClients.modal.fields.clientType")}
                          onChange={(event) => {
                            const value = event.target.value;
                            setFieldValue("type", value);
                            setFieldValue(
                              "identificationType",
                              value === "legal"
                                ? "Cédula jurídica"
                                : "Cédula física"
                            );
                          }}
                        >
                          <MenuItem value="physical">
                            {i18n.t("businessClients.modal.options.physical")}
                          </MenuItem>
                          <MenuItem value="legal">
                            {i18n.t("businessClients.modal.options.legal")}
                          </MenuItem>
                        </Field>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Field
                        as={TextField}
                        name="displayName"
                        label={
                          values.type === "legal"
                            ? i18n.t("businessClients.modal.fields.displayNameLegal")
                            : i18n.t("businessClients.modal.fields.displayNamePhysical")
                        }
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        error={
                          touched.displayName && Boolean(errors.displayName)
                        }
                        helperText={touched.displayName && errors.displayName}
                      />
                    </Grid>
                    {values.type === "legal" && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Field
                            as={TextField}
                            name="legalName"
                            label={i18n.t("businessClients.modal.fields.legalName")}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            error={touched.legalName && Boolean(errors.legalName)}
                            helperText={touched.legalName && errors.legalName}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Field
                            as={TextField}
                            name="tradeName"
                            label={i18n.t("businessClients.modal.fields.tradeName")}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        name="identificationType"
                        label={i18n.t("businessClients.modal.fields.identificationType")}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        error={
                          touched.identificationType &&
                          Boolean(errors.identificationType)
                        }
                        helperText={
                          touched.identificationType &&
                          errors.identificationType
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        name="identificationNumber"
                        label={i18n.t("businessClients.modal.fields.identificationNumber")}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        error={
                          touched.identificationNumber &&
                          Boolean(errors.identificationNumber)
                        }
                        helperText={
                          touched.identificationNumber &&
                          errors.identificationNumber
                        }
                      />
                    </Grid>
                  </Grid>

                  {values.type === "legal" && (
                    <>
                      <Typography
                        className={classes.sectionTitle}
                        variant="subtitle1"
                      >
                        {i18n.t("businessClients.modal.sections.legalRepresentation")}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={5}>
                          <Field
                            as={TextField}
                            name="legalRepresentativeName"
                            label={i18n.t("businessClients.modal.fields.legalRepresentativeName")}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Field
                            as={TextField}
                            name="legalRepresentativeId"
                            label={i18n.t("businessClients.modal.fields.legalRepresentativeId")}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Field
                            as={TextField}
                            name="legalRepresentativePosition"
                            label={i18n.t("businessClients.modal.fields.legalRepresentativePosition")}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </>
                  )}

                  <Typography className={classes.sectionTitle} variant="subtitle1">
                    {i18n.t("businessClients.modal.sections.contactLocation")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        name="email"
                        label={i18n.t("businessClients.modal.fields.email")}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        name="phone"
                        label={i18n.t("businessClients.modal.fields.phone")}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="address"
                        label={i18n.t("businessClients.modal.fields.address")}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      />
                    </Grid>
                    {["country", "province", "canton", "district"].map(
                      (fieldName) => (
                        <Grid item xs={12} sm={6} key={fieldName}>
                          <Field
                            as={TextField}
                            name={fieldName}
                            label={
                              {
                                country: i18n.t("businessClients.modal.fields.country"),
                                province: i18n.t("businessClients.modal.fields.province"),
                                canton: i18n.t("businessClients.modal.fields.canton"),
                                district: i18n.t("businessClients.modal.fields.district"),
                              }[fieldName]
                            }
                            variant="outlined"
                            margin="dense"
                            fullWidth
                          />
                        </Grid>
                      )
                    )}
                  </Grid>

                  <Typography className={classes.sectionTitle} variant="subtitle1">
                    {i18n.t("businessClients.modal.sections.internalManagement")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        error={touched.queueId && Boolean(errors.queueId)}
                      >
                        <InputLabel>
                          {i18n.t("businessClients.modal.fields.department")}
                        </InputLabel>
                        <Field
                          as={Select}
                          name="queueId"
                          label={i18n.t("businessClients.modal.fields.department")}
                        >
                          {isAdmin && (
                            <MenuItem value="">
                              {i18n.t("businessClients.modal.fields.globalClient")}
                            </MenuItem>
                          )}
                          {queues.map((queue) => (
                            <MenuItem key={queue.id} value={queue.id}>
                              {queue.name}
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.queueId && errors.queueId && (
                          <FormHelperText>{errors.queueId}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="notes"
                        label={i18n.t("businessClients.modal.fields.notes")}
                        variant="outlined"
                        margin="dense"
                        multiline
                        rows={3}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={close} variant="outlined">
                {i18n.t("businessClients.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting || loading}
                className={classes.submit}
              >
                {i18n.t("businessClients.buttons.save")}
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

export default BusinessClientModal;
