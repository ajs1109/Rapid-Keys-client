
import axios from "axios";
import { env } from "process";

export function getCookie(name: string) {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

export function setCookie(
  name: string,
  value: string,
  options?: CookieOptions
): void {
  let expires = "";
  if (options && options.expires instanceof Date) {
    expires = "; expires=" + options.expires.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

interface CookieOptions {
  expires?: Date;
}
export function setJwt(name: string, value: string) {
  const decodedToken = jwt.jwtDecode(value);
  const expirationTime = decodedToken.exp || 0 * 1000; // Convert to milliseconds
  setCookie(name, value, {
    expires: new Date(expirationTime),
  });
}
export async function getJwt() {
  const existingToken = getCookie("jwt-token");
  if (existingToken) {
    return existingToken;
  }
  const baseURL = env.BASE_URL;
  const refreshToken = getCookie("jwt-refresh-token");
  if (!refreshToken) {
    await logOut();
    return;
  }
  const { data } = await axios.get<{ token: string; refreshToken: string }>(
    `${baseURL}/refresh?token=${refreshToken}`
  );
  setJwt("jwt-token", data.token);
  setJwt("jwt-refresh-token", data.refreshToken);
  return data.token;
}

export async function logOut() {}