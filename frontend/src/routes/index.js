import React, { useContext } from "react";
import { BrowserRouter, Redirect, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LoggedInLayout from "../layout";
import Dashboard from "../pages/Dashboard/";
import Tickets from "../pages/Tickets/";
import Login from "../pages/Login/";
import Connections from "../pages/Connections/";
import Settings from "../pages/Settings/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import BusinessClients from "../pages/BusinessClients";
import Collaborators from "../pages/Collaborators";
import SmartDocuments from "../pages/SmartDocuments";
import QuickAnswers from "../pages/QuickAnswers/";
import Queues from "../pages/Queues/";
import { AuthProvider } from "../context/Auth/AuthContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import { ThemeProvider } from "../context/DarkMode";
import Route from "./Route";
import AgentHistory from "../pages/AgentHistory";
import { AuthContext } from "../context/Auth/AuthContext";
import { getHomePath, ROUTES } from "./paths";

const HomeRedirect = () => {
  const { user } = useContext(AuthContext);
  return <Redirect to={getHomePath(user.profile)} />;
};

const AuthenticatedRoutes = () => (
  <WhatsAppsProvider>
    <LoggedInLayout>
      <Switch>
        <Route
          exact
          path={ROUTES.dashboard}
          component={Dashboard}
          isPrivate
          roles={["admin", "supervisor"]}
        />
        <Redirect exact from="/dashboard" to={ROUTES.dashboard} />
        <Route
          exact
          path={`${ROUTES.tickets}/:ticketId?`}
          component={Tickets}
          isPrivate
        />
        <Route
          exact
          path={ROUTES.connections}
          component={Connections}
          isPrivate
          roles={["admin"]}
        />
        <Route
          exact
          path={ROUTES.contacts}
          component={Contacts}
          isPrivate
        />
        <Route
          exact
          path={ROUTES.businessClients}
          component={BusinessClients}
          isPrivate
        />
        <Route
          exact
          path={ROUTES.collaborators}
          component={Collaborators}
          isPrivate
        />
        <Route
          exact
          path={ROUTES.smartDocuments}
          component={SmartDocuments}
          isPrivate
        />
        <Route
          exact
          path={ROUTES.users}
          component={Users}
          isPrivate
          roles={["admin"]}
        />
        <Route
          exact
          path={ROUTES.quickAnswers}
          component={QuickAnswers}
          isPrivate
        />
        <Redirect exact from="/quickAnswers" to={ROUTES.quickAnswers} />
        <Route
          exact
          path={ROUTES.settings}
          component={Settings}
          isPrivate
          roles={["admin"]}
        />
        <Redirect exact from="/Settings" to={ROUTES.settings} />
        <Route
          exact
          path={ROUTES.queues}
          component={Queues}
          isPrivate
          roles={["admin"]}
        />
        <Redirect exact from="/Queues" to={ROUTES.queues} />
        <Route
          exact
          path={ROUTES.agentHistory}
          component={AgentHistory}
          isPrivate
          roles={["admin", "supervisor", "agent", "user"]}
        />
        <HomeRedirect />
      </Switch>
    </LoggedInLayout>
  </WhatsAppsProvider>
);

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Switch>
            <Route exact path={ROUTES.login} component={Login} />
            <Route path="/" component={AuthenticatedRoutes} isPrivate />
          </Switch>
          <ToastContainer autoClose={3000} />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
