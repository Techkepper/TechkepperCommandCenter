import React, { useState, useContext } from "react";
import {
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Paper,
  Box,
  Chip,
} from "@material-ui/core";
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  SecurityOutlined,
} from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(420px, 0.8fr)",
    background:
      theme.palette.type === "dark"
        ? "radial-gradient(circle at 18% 20%, #203617 0, #0a160c 34%, #050906 72%)"
        : "linear-gradient(135deg, #e9f6df 0%, #f8fbf6 58%, #eaf4e5 100%)",
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  hero: {
    padding: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: { display: "none" },
    "&:after": {
      content: '""',
      position: "absolute",
      width: 420,
      height: 420,
      borderRadius: "50%",
      right: -120,
      bottom: -160,
      border: "1px solid rgba(142,230,63,.25)",
      boxShadow: "0 0 80px rgba(142,230,63,.10)",
    },
  },
  logo: {
    width: 260,
    height: 180,
    objectFit: "contain",
    objectPosition: "left center",
  },
  heroCopy: { maxWidth: 660, position: "relative", zIndex: 1 },
  accent: { color: theme.palette.primary.main },
  access: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(4),
  },
  card: {
    width: "100%",
    maxWidth: 480,
    padding: theme.spacing(5),
    border: "1px solid rgba(142,230,63,.18)",
    boxShadow: "0 24px 80px rgba(0,0,0,.28)",
  },
  mobileLogo: {
    display: "none",
    width: 180,
    height: 112,
    margin: "0 auto",
    objectFit: "contain",
    [theme.breakpoints.down("sm")]: { display: "block" },
  },
  form: { marginTop: theme.spacing(3) },
  field: { marginBottom: theme.spacing(2) },
  submit: { height: 48, marginTop: theme.spacing(1) },
  footer: {
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

const Login = () => {
  const classes = useStyles();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { handleLogin } = useContext(AuthContext);

  const handleSubmit = (event) => {
    event.preventDefault();
    handleLogin(credentials);
  };

  return (
    <main className={classes.root}>
      <section className={classes.hero}>
        <img src="/techkepper-logo.png" alt="Techkepper" className={classes.logo} />
        <div className={classes.heroCopy}>
          <Chip
            icon={<SecurityOutlined />}
            label="Operación interna protegida"
            color="primary"
            variant="outlined"
          />
          <Typography variant="h2" component="h1">
            Atención inteligente.
            <br />
            <span className={classes.accent}>Control operativo real.</span>
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Ventas, soporte, desarrollo y ciberseguridad coordinados desde un
            único centro multiagente para WhatsApp Business.
          </Typography>
        </div>
        <Typography variant="body2" color="textSecondary">
          Techkepper Company S.A. · ventas@techkeppercr.com · +506 7225 9973
        </Typography>
      </section>

      <section className={classes.access}>
        <Paper className={classes.card} elevation={12}>
          <img
            src="/techkepper-logo.png"
            alt="Techkepper"
            className={classes.mobileLogo}
          />
          <Box display="flex" alignItems="center" mb={1}>
            <LockOutlined color="primary" />
            <Box ml={1}>
              <Typography variant="h5">Techkepper Command Center</Typography>
            </Box>
          </Box>
          <Typography color="textSecondary">
            Ingrese con las credenciales asignadas por administración.
          </Typography>

          <form className={classes.form} onSubmit={handleSubmit}>
            <TextField
              className={classes.field}
              variant="outlined"
              required
              fullWidth
              label="Correo corporativo"
              name="email"
              value={credentials.email}
              onChange={(event) =>
                setCredentials({ ...credentials, email: event.target.value })
              }
              autoComplete="email"
              autoFocus
            />
            <TextField
              className={classes.field}
              variant="outlined"
              required
              fullWidth
              name="password"
              label="Contraseña"
              value={credentials.password}
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Ingresar al centro de comando
            </Button>
          </form>
          <Typography
            className={classes.footer}
            variant="caption"
            color="textSecondary"
            display="block"
          >
            El registro público está deshabilitado. Solicite acceso a un
            administrador de Techkepper.
          </Typography>
        </Paper>
      </section>
    </main>
  );
};

export default Login;
