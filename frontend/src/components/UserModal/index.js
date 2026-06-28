import React, { useContext, useEffect, useState } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Select,
  InputLabel,
  MenuItem,
  FormControl,
  TextField,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Switch,
} from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import { AuthContext } from "../../context/Auth/AuthContext";
import useWhatsApps from "../../hooks/useWhatsApps";
import {
  availabilityStatusLabel,
  availabilityStatusOptions,
} from "../AvailabilityStatus";

const useStyles = makeStyles((theme) => ({
  row: {
    display: "flex",
    gap: theme.spacing(1),
    [theme.breakpoints.down("xs")]: { flexDirection: "column" },
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  submit: { position: "relative" },
}));

const emptyUser = {
  name: "",
  email: "",
  password: "",
  profile: "agent",
  isActive: true,
  theme: "dark",
  availabilityStatus: "available",
};

const UserModal = ({ open, onClose, userId }) => {
  const classes = useStyles();
  const { user: loggedInUser } = useContext(AuthContext);
  const isAdmin = loggedInUser.profile === "admin";
  const [user, setUser] = useState(emptyUser);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [whatsappId, setWhatsappId] = useState("");
  const { loading, whatsApps } = useWhatsApps();

  const schema = Yup.object().shape({
    name: Yup.string()
      .min(2)
      .max(50)
      .required(i18n.t("userModal.extra.required")),
    password: Yup.string().test(
      "secure-password",
      i18n.t("userModal.extra.passwordRule"),
      (value) => !value || value.length >= 10,
    ),
    email: Yup.string()
      .email(i18n.t("userModal.extra.invalidEmail"))
      .required(i18n.t("userModal.extra.required")),
  });

  useEffect(() => {
    if (!userId || !open) return;
    api
      .get(`/users/${userId}`)
      .then(({ data }) => {
        setUser({ ...emptyUser, ...data, password: "" });
        setSelectedQueueIds(data.queues?.map((queue) => queue.id) || []);
        setWhatsappId(data.whatsappId || "");
      })
      .catch(toastError);
  }, [userId, open]);

  const handleClose = () => {
    setUser(emptyUser);
    setSelectedQueueIds([]);
    setWhatsappId("");
    onClose();
  };

  const save = async (values) => {
    const userData = { ...values, whatsappId, queueIds: selectedQueueIds };
    if (!userData.password) delete userData.password;
    try {
      if (userId) await api.put(`/users/${userId}`, userData);
      else await api.post("/users", userData);
      toast.success(i18n.t("userModal.extra.saved"));
      handleClose();
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {userId
          ? i18n.t("userModal.extra.titleEdit")
          : i18n.t("userModal.extra.titleAdd")}
      </DialogTitle>
      <Formik
        initialValues={user}
        enableReinitialize
        validationSchema={schema}
        onSubmit={save}
      >
        {({ touched, errors, isSubmitting, setFieldValue, values }) => (
          <Form>
            <DialogContent dividers>
              <div className={classes.row}>
                <Field
                  as={TextField}
                  label={i18n.t("userModal.extra.name")}
                  name="name"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
                <Field
                  as={TextField}
                  label={i18n.t("userModal.extra.email")}
                  name="email"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
              </div>
              <div className={classes.row}>
                <Field
                  as={TextField}
                  name="password"
                  variant="outlined"
                  margin="dense"
                  label={
                    userId
                      ? i18n.t("userModal.extra.passwordEdit")
                      : i18n.t("userModal.extra.password")
                  }
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  type={showPassword ? "text" : "password"}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
                <Button
                  color="primary"
                  onClick={() => {
                    const temporary = `Tk!${Math.random()
                      .toString(36)
                      .slice(-8)}9A`;
                    setFieldValue("password", temporary);
                    setShowPassword(true);
                  }}
                >
                  {i18n.t("userModal.extra.generateTemp")}
                </Button>
              </div>

              {isAdmin && (
                <>
                  <div className={classes.row}>
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel>{i18n.t("userModal.extra.role")}</InputLabel>
                      <Field
                        as={Select}
                        name="profile"
                        label={i18n.t("userModal.extra.role")}
                      >
                        <MenuItem value="admin">
                          {i18n.t("userModal.extra.roleAdmin")}
                        </MenuItem>
                        <MenuItem value="supervisor">
                          {i18n.t("userModal.extra.roleSupervisor")}
                        </MenuItem>
                        <MenuItem value="agent">
                          {i18n.t("userModal.extra.roleAgent")}
                        </MenuItem>
                      </Field>
                    </FormControl>
                    {!loading && (
                      <FormControl variant="outlined" margin="dense" fullWidth>
                        <InputLabel>
                          {i18n.t("userModal.extra.whatsappConnection")}
                        </InputLabel>
                        <Select
                          value={whatsappId}
                          onChange={(event) =>
                            setWhatsappId(event.target.value)
                          }
                          label={i18n.t("userModal.extra.whatsappConnection")}
                        >
                          <MenuItem value="">
                            {i18n.t("userModal.extra.defaultConnection")}
                          </MenuItem>
                          {whatsApps.map((whatsapp) => (
                            <MenuItem key={whatsapp.id} value={whatsapp.id}>
                              {whatsapp.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </div>
                  <QueueSelect
                    selectedQueueIds={selectedQueueIds}
                    onChange={setSelectedQueueIds}
                  />
                  <FormControl variant="outlined" margin="dense" fullWidth>
                    <InputLabel>
                      {i18n.t("users.availability.selector")}
                    </InputLabel>
                    <Field
                      as={Select}
                      name="availabilityStatus"
                      label={i18n.t("users.availability.selector")}
                    >
                      {availabilityStatusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {availabilityStatusLabel(status)}
                        </MenuItem>
                      ))}
                      <MenuItem value="offline">
                        {availabilityStatusLabel("offline")}
                      </MenuItem>
                    </Field>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(values.isActive)}
                        onChange={(event) =>
                          setFieldValue("isActive", event.target.checked)
                        }
                        color="primary"
                      />
                    }
                    label={i18n.t("userModal.extra.activeUser")}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} variant="outlined">
                {i18n.t("userModal.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
                className={classes.submit}
              >
                {i18n.t("userModal.extra.saveUser")}
                {isSubmitting && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default UserModal;
