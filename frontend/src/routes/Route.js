import React, { useContext } from "react";
import { Route as RouterRoute, Redirect } from "react-router-dom";

import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { getHomePath, ROUTES } from "./paths";

const Route = ({
  component: Component,
  isPrivate = false,
  roles,
  ...rest
}) => {
  const { isAuth, loading, user } = useContext(AuthContext);

  if (loading) {
    return <BackdropLoading />;
  }

  if (!isAuth && isPrivate) {
    return (
      <Redirect
        to={{ pathname: ROUTES.login, state: { from: rest.location } }}
      />
    );
  }

  if (isAuth && !isPrivate) {
    return <Redirect to={getHomePath(user.profile)} />;
  }

  if (
    isAuth &&
    isPrivate &&
    roles &&
    !roles.includes(user.profile)
  ) {
    return <Redirect to={getHomePath(user.profile)} />;
  }

  return <RouterRoute {...rest} component={Component} />;
};

export default Route;
