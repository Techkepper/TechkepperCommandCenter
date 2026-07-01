import {
  getDropboxRedirectUri,
  getPublicBackendOrigin,
  isPublicBackendSecure
} from "../../../config/appUrls";

describe("appUrls", () => {
  it("uses PUBLIC_BACKEND_URL", () => {
    expect(
      getPublicBackendOrigin({
        PUBLIC_BACKEND_URL: "https://api.example.com/"
      })
    ).toBe("https://api.example.com");
  });

  it("derives Dropbox redirect URI", () => {
    expect(
      getDropboxRedirectUri({
        PUBLIC_BACKEND_URL: "http://localhost:8080"
      })
    ).toBe("http://localhost:8080/dropbox/oauth/callback");
  });

  it("detects secure public backend", () => {
    expect(
      isPublicBackendSecure({
        PUBLIC_BACKEND_URL: "https://api.example.com"
      })
    ).toBe(true);
  });
});
