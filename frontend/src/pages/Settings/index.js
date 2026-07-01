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
import { i18n } from "../../translate/i18n";
import BusinessHoursSettings from "../../components/BusinessHoursSettings";

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
          }, {}),
        ),
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
          .map((key) => api.put(`/settings/${key}`, { value: values[key] })),
      );
      toast.success(i18n.t("settings.operational.saved"));
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
          <Typography variant="h4">
            {i18n.t("settings.operational.title")}
          </Typography>
          <Typography color="textSecondary">
            {i18n.t("settings.operational.subtitle")}
          </Typography>
        </div>
        <Button
          color="primary"
          variant="contained"
          startIcon={<SaveOutlined />}
          onClick={save}
          disabled={saving}
        >
          {i18n.t("settings.operational.save")}
        </Button>
      </Box>

      <Paper className={classes.card}>
        <Typography variant="h6">
          {i18n.t("settings.operational.company")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label={i18n.t("settings.operational.companyName")}
              value={values.companyName || ""}
              onChange={change("companyName")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label={i18n.t("settings.operational.companyEmail")}
              value={values.companyEmail || ""}
              onChange={change("companyEmail")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label={i18n.t("settings.operational.companyPhone")}
              value={values.companyPhone || ""}
              onChange={change("companyPhone")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label={i18n.t("settings.operational.businessHours")}
              value={values.businessHours || ""}
              onChange={change("businessHours")}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.card}>
        <Typography variant="h6">
          {i18n.t("settings.operational.assignmentTitle")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label={i18n.t("settings.operational.status")}
              value={values.assignmentAutoMessage || "enabled"}
              onChange={change("assignmentAutoMessage")}
            >
              <MenuItem value="enabled">
                {i18n.t("settings.operational.enabled")}
              </MenuItem>
              <MenuItem value="disabled">
                {i18n.t("settings.operational.disabled")}
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              variant="outlined"
              label={i18n.t("settings.operational.template")}
              value={values.assignmentMessageTemplate || ""}
              onChange={change("assignmentMessageTemplate")}
              helperText={i18n.t("settings.operational.templateHelp")}
            />
          </Grid>
        </Grid>
        <div className={classes.note}>
          <Typography variant="body2">
            {i18n.t("settings.operational.note")}
          </Typography>
        </div>
      </Paper>

      <Paper className={classes.card}>
        <Typography variant="h6">
          {i18n.t("settings.operational.experience")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label={i18n.t("settings.operational.defaultTheme")}
              value={values.defaultTheme || "dark"}
              onChange={change("defaultTheme")}
            >
              <MenuItem value="dark">
                {i18n.t("settings.operational.dark")}
              </MenuItem>
              <MenuItem value="light">
                {i18n.t("settings.operational.light")}
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label={i18n.t("settings.operational.allowAgentHistory")}
              value={values.allowAgentHistory || "disabled"}
              onChange={change("allowAgentHistory")}
            >
              <MenuItem value="enabled">
                {i18n.t("settings.operational.yes")}
              </MenuItem>
              <MenuItem value="disabled">
                {i18n.t("settings.operational.no")}
              </MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <BusinessHoursSettings cardClass={classes.card} />
    </Container>
  );
};

export default Settings;
