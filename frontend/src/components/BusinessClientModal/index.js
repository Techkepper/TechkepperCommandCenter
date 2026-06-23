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
  type: Yup.string().oneOf(["physical", "legal"]).required("Requerido"),
  displayName: Yup.string()
    .min(2, "Ingrese al menos 2 caracteres.")
    .max(255, "Máximo 255 caracteres.")
    .required("El nombre es obligatorio."),
  legalName: Yup.string().when("type", {
    is: "legal",
    then: Yup.string().required("La razón social es obligatoria."),
  }),
  identificationType: Yup.string().required(
    "Seleccione el tipo de identificación."
  ),
  identificationNumber: Yup.string().required(
    "La identificación es obligatoria."
  ),
  email: Yup.string().email("Ingrese un correo válido."),
  queueId: isAdmin
    ? Yup.mixed().nullable()
    : Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" ? null : value
        )
        .nullable()
        .required("Seleccione un departamento."),
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
      toast.success("Cliente guardado correctamente.");
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
        toast.error("Ya existe un cliente con esa identificación.");
      } else {
        toastError(error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        {clientId ? "Editar cliente" : "Nuevo cliente"}
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
                    Identificación
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl variant="outlined" margin="dense" fullWidth>
                        <InputLabel>Tipo de cliente</InputLabel>
                        <Field
                          as={Select}
                          name="type"
                          label="Tipo de cliente"
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
                          <MenuItem value="physical">Persona física</MenuItem>
                          <MenuItem value="legal">Persona jurídica</MenuItem>
                        </Field>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Field
                        as={TextField}
                        name="displayName"
                        label={
                          values.type === "legal"
                            ? "Nombre para mostrar"
                            : "Nombre completo"
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
                            label="Razón social"
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
                            label="Nombre comercial"
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
                        label="Tipo de identificación"
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
                        label="Número de identificación"
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
                        Representación legal
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={7}>
                          <Field
                            as={TextField}
                            name="legalRepresentativeName"
                            label="Representante legal"
                            variant="outlined"
                            margin="dense"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <Field
                            as={TextField}
                            name="legalRepresentativeId"
                            label="Identificación del representante"
                            variant="outlined"
                            margin="dense"
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </>
                  )}

                  <Typography className={classes.sectionTitle} variant="subtitle1">
                    Contacto y ubicación
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        name="email"
                        label="Correo electrónico"
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
                        label="Teléfono"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="address"
                        label="Dirección"
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
                                country: "País",
                                province: "Provincia",
                                canton: "Cantón",
                                district: "Distrito",
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
                    Gestión interna
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        error={touched.queueId && Boolean(errors.queueId)}
                      >
                        <InputLabel>Departamento</InputLabel>
                        <Field as={Select} name="queueId" label="Departamento">
                          {isAdmin && (
                            <MenuItem value="">Cliente global</MenuItem>
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
                        label="Notas internas"
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
                Cancelar
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting || loading}
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

export default BusinessClientModal;
