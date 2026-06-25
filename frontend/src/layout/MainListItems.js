import React, { useContext, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
  Badge,
} from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import QuestionAnswerOutlinedIcon from "@material-ui/icons/QuestionAnswerOutlined";
import AssessmentOutlinedIcon from "@material-ui/icons/AssessmentOutlined";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";
import BusinessCenterOutlinedIcon from "@material-ui/icons/BusinessCenterOutlined";
import WorkOutlineOutlinedIcon from "@material-ui/icons/WorkOutlineOutlined";
import RequestQuoteOutlinedIcon from "@material-ui/icons/ReceiptOutlined";

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import api from "../services/api";
import { ROUTES } from "../routes/paths";

function ListItemLink({ exact = false, icon, primary, to, onNavigate }) {
  const history = useHistory();
  const location = useLocation();
  const isSelected = exact
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const handleClick = () => {
    if (location.pathname !== to) {
      history.push(to);
    }
    onNavigate();
  };

  return (
    <li>
      <ListItem
        button
        selected={isSelected}
        onClick={handleClick}
        role="link"
        aria-current={isSelected ? "page" : undefined}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const MainListItems = ({ drawerClose }) => {
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [agentHistoryEnabled, setAgentHistoryEnabled] = useState(false);
  const isAdmin = user.profile === "admin";
  const isSupervisor = user.profile === "supervisor";

  useEffect(() => {
    setConnectionWarning(whatsApps.some((item) => item.status !== "CONNECTED"));
  }, [whatsApps]);

  useEffect(() => {
    api
      .get("/settings/public")
      .then(({ data }) => {
        const setting = data.find((item) => item.key === "allowAgentHistory");
        setAgentHistoryEnabled(setting?.value === "enabled");
      })
      .catch(() => setAgentHistoryEnabled(false));
  }, []);

  return (
    <div>
      {(isAdmin || isSupervisor) && (
        <ListItemLink
          exact
          to={ROUTES.dashboard}
          primary={i18n.t("mainDrawer.listItems.dashboard")}
          icon={<DashboardOutlinedIcon />}
          onNavigate={drawerClose}
        />
      )}
      <ListItemLink
        to={ROUTES.tickets}
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<WhatsAppIcon />}
        onNavigate={drawerClose}
      />
      <ListItemLink
        to={ROUTES.contacts}
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={<ContactPhoneOutlinedIcon />}
        onNavigate={drawerClose}
      />
      <ListItemLink
        to={ROUTES.businessClients}
        primary={i18n.t("mainDrawer.listItems.businessClients")}
        icon={<BusinessCenterOutlinedIcon />}
        onNavigate={drawerClose}
      />
      <ListItemLink
        to={ROUTES.collaborators}
        primary={i18n.t("mainDrawer.listItems.collaborators")}
        icon={<WorkOutlineOutlinedIcon />}
        onNavigate={drawerClose}
      />
      <ListItemLink
        to={ROUTES.smartDocuments}
        primary={i18n.t("mainDrawer.listItems.smartDocuments")}
        icon={<DescriptionOutlinedIcon />}
        onNavigate={drawerClose}
      />
      <ListItemLink
        to={ROUTES.commercialProposals}
        primary={i18n.t("mainDrawer.listItems.commercialProposals")}
        icon={<RequestQuoteOutlinedIcon />}
        onNavigate={drawerClose}
      />
      <ListItemLink
        to={ROUTES.quickAnswers}
        primary={i18n.t("mainDrawer.listItems.quickAnswers")}
        icon={<QuestionAnswerOutlinedIcon />}
        onNavigate={drawerClose}
      />

      {(isAdmin || isSupervisor || agentHistoryEnabled) && (
        <>
          <Divider />
          <ListSubheader inset>
            {i18n.t("mainDrawer.listSubheaders.supervision")}
          </ListSubheader>
          <ListItemLink
            to={ROUTES.agentHistory}
            primary={i18n.t("mainDrawer.listItems.agentHistory")}
            icon={<AssessmentOutlinedIcon />}
            onNavigate={drawerClose}
          />
        </>
      )}

      {isAdmin && (
        <>
          <Divider />
          <ListSubheader inset>
            {i18n.t("mainDrawer.listItems.administration")}
          </ListSubheader>
          <ListItemLink
            to={ROUTES.connections}
            primary={i18n.t("mainDrawer.listItems.connections")}
            icon={
              <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                <SyncAltIcon />
              </Badge>
            }
            onNavigate={drawerClose}
          />
          <ListItemLink
            to={ROUTES.users}
            primary={i18n.t("mainDrawer.listItems.users")}
            icon={<PeopleAltOutlinedIcon />}
            onNavigate={drawerClose}
          />
          <ListItemLink
            to={ROUTES.queues}
            primary={i18n.t("mainDrawer.listItems.queues")}
            icon={<AccountTreeOutlinedIcon />}
            onNavigate={drawerClose}
          />
          <ListItemLink
            to={ROUTES.settings}
            primary={i18n.t("mainDrawer.listItems.settings")}
            icon={<SettingsOutlinedIcon />}
            onNavigate={drawerClose}
          />
        </>
      )}
    </div>
  );
};

export default MainListItems;
