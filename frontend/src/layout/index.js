import React, { useState, useContext, useEffect } from "react";
import clsx from "clsx";
import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  Switch,
  Tooltip,
  FormControl,
  Select,
} from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import AccountCircle from "@material-ui/icons/AccountCircle";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import TranslateIcon from "@material-ui/icons/Translate";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import DocumentNotificationListener from "../components/DocumentNotificationListener";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import { useThemeContext } from "../context/DarkMode";
import { useLanguage } from "../context/Language";
import toastError from "../errors/toastError";
import {
  availabilityStatusLabel,
  availabilityStatusOptions,
} from "../components/AvailabilityStatus";

const LANGUAGE_LABELS = {
  es: "Español",
  en: "English",
  pt: "Português",
};

const drawerWidth = 272;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
  },
  toolbar: {
    paddingRight: 24,
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px 8px 16px",
    minHeight: "64px",
  },
  brandLogo: {
    width: 132,
    height: 48,
    objectFit: "contain",
    objectPosition: "left center",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: theme.palette.background.paper,
    boxShadow: `0 1px 0 ${theme.palette.divider}`,
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
    color: theme.palette.text.primary,
  },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
    color: theme.palette.text.primary,
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: {
    minHeight: "64px",
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  switch: {
    transform: "scale(0.8)",
  },
  iconButton: {
    color: theme.palette.text.primary,
  },
  themeSwitchContainer: {
    display: "flex",
    alignItems: "center",
  },
  themeIcon: {
    color: theme.palette.text.primary,
  },
  availabilitySelect: {
    minWidth: 130,
    marginRight: theme.spacing(1),
    "& .MuiSelect-select": { paddingTop: 7, paddingBottom: 7 },
    [theme.breakpoints.down("xs")]: { minWidth: 105 },
  },
}));

const LoggedInLayout = ({ children }) => {
  const classes = useStyles();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const langMenuOpen = Boolean(langAnchorEl);
  const { handleLogout, loading, updateAvailabilityStatus } =
    useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  const { user } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useThemeContext();
  const { language, changeLanguage, supportedLanguages } = useLanguage();

  useEffect(() => {
    const updateDrawer = () => {
      const isMobile = window.innerWidth < 600;
      setDrawerVariant(isMobile ? "temporary" : "permanent");
      if (!isMobile) setDrawerOpen(true);
    };

    updateDrawer();
    window.addEventListener("resize", updateDrawer);
    return () => window.removeEventListener("resize", updateDrawer);
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const handleOpenLangMenu = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleCloseLangMenu = () => {
    setLangAnchorEl(null);
  };

  const handleSelectLanguage = (selected) => {
    changeLanguage(selected);
    handleCloseLangMenu();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600) {
      setDrawerOpen(false);
    }
  };

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      {user.id && <DocumentNotificationListener />}
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose,
          ),
        }}
        open={drawerOpen}
      >
        <div className={classes.toolbarIcon}>
          {drawerOpen && (
            <img
              src="/techkepper-logo.png"
              alt="Techkepper"
              className={classes.brandLogo}
            />
          )}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List>
          <MainListItems drawerClose={drawerClose} />
        </List>
        <Divider />
      </Drawer>
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
            aria-label="Abrir menú de navegación"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(
              classes.menuButton,
              drawerOpen && classes.menuButtonHidden,
            )}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            noWrap
            className={classes.title}
          >
            Techkepper Command Center
          </Typography>

          {user.id && (
            <FormControl
              variant="outlined"
              size="small"
              className={classes.availabilitySelect}
            >
              <Select
                value={
                  availabilityStatusOptions.includes(user.availabilityStatus)
                    ? user.availabilityStatus
                    : "available"
                }
                onChange={(event) =>
                  updateAvailabilityStatus(event.target.value).catch(toastError)
                }
                aria-label={i18n.t("users.availability.selector")}
              >
                {availabilityStatusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {availabilityStatusLabel(status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <div className={classes.themeSwitchContainer}>
            <Brightness4Icon className={classes.themeIcon} />
            <Switch
              checked={darkMode}
              onChange={toggleTheme}
              color="default"
              className={classes.switch}
            />
          </div>

          <Tooltip title={i18n.t("mainDrawer.appBar.user.language")}>
            <IconButton
              aria-label={i18n.t("mainDrawer.appBar.user.language")}
              aria-controls="menu-language"
              aria-haspopup="true"
              onClick={handleOpenLangMenu}
              className={classes.iconButton}
            >
              <TranslateIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="menu-language"
            anchorEl={langAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={langMenuOpen}
            onClose={handleCloseLangMenu}
          >
            {supportedLanguages.map((lng) => (
              <MenuItem
                key={lng}
                dense
                selected={language === lng}
                onClick={() => handleSelectLanguage(lng)}
              >
                {LANGUAGE_LABELS[lng]}
              </MenuItem>
            ))}
          </Menu>

          {user.id && <NotificationsPopOver className={classes.iconButton} />}

          <div>
            <IconButton
              aria-label="Cuenta del usuario actual"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              className={classes.iconButton}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;
