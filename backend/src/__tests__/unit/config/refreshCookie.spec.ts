import {
  getRefreshCookieOptions,
  getRefreshCookieSameSite,
  getRefreshCookieSecure,
  isCrossOriginAuth
} from "../../../config/refreshCookie";

describe("refreshCookie", () => {
  it("detects cross-origin auth when frontend and backend hosts differ", () => {
    expect(
      isCrossOriginAuth({
        FRONTEND_URL: "https://center.techkepper.com",
        PUBLIC_BACKEND_URL: "https://api-command-center.herokuapp.com"
      })
    ).toBe(true);
  });

  it("treats same-host docker dev as same-origin auth", () => {
    expect(
      isCrossOriginAuth({
        FRONTEND_URL: "http://localhost:3000",
        PUBLIC_BACKEND_URL: "http://localhost:8080"
      })
    ).toBe(false);
  });

  it("uses SameSite=None for cross-origin production", () => {
    expect(
      getRefreshCookieSameSite({
        FRONTEND_URL: "https://center.techkepper.com",
        PUBLIC_BACKEND_URL: "https://api-command-center.herokuapp.com"
      })
    ).toBe("none");
  });

  it("uses SameSite=Strict for same-host proxy setups", () => {
    expect(
      getRefreshCookieSameSite({
        FRONTEND_URL: "http://localhost:3000",
        PUBLIC_BACKEND_URL: "http://localhost:8080"
      })
    ).toBe("strict");
  });

  it("forces Secure when SameSite=None", () => {
    expect(
      getRefreshCookieSecure({
        COOKIE_SECURE: "false",
        FRONTEND_URL: "https://center.techkepper.com",
        PUBLIC_BACKEND_URL: "https://api-command-center.herokuapp.com"
      })
    ).toBe(true);
  });

  it("honors COOKIE_SAME_SITE override", () => {
    expect(
      getRefreshCookieSameSite({
        COOKIE_SAME_SITE: "lax",
        FRONTEND_URL: "https://center.techkepper.com",
        PUBLIC_BACKEND_URL: "https://api-command-center.herokuapp.com"
      })
    ).toBe("lax");
  });

  it("defaults refresh cookie path to /", () => {
    expect(
      getRefreshCookieOptions({
        PUBLIC_BACKEND_URL: "http://localhost:8080"
      }).path
    ).toBe("/");
  });
});
