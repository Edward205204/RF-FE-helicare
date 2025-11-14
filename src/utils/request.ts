import { toast } from "react-toastify";
import axios, { AxiosError, type AxiosInstance } from "axios";
import { HTTP_STATUS } from "../constants/http-status";
import {
  getAccessTokenFromLS,
  removeLocalStorage,
  setAccessTokenToLS,
  setProfileToLS,
} from "./local-storage";
import { beUrl } from "./config";

class Request {
  instance: AxiosInstance;
  private accessToken: string;
  constructor() {
    this.accessToken = getAccessTokenFromLS();
    this.instance = axios.create({
      baseURL: beUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.instance.interceptors.request.use((config) => {
      if ((this.accessToken || this.accessToken === "") && config.headers) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      // Nếu là FormData, không set Content-Type để browser tự set với boundary
      if (config.data instanceof FormData && config.headers) {
        delete config.headers["Content-Type"];
      }
      return config;
    });
    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config;
        if (url === "/auth/login") {
          this.accessToken = response.data.data.access_token;
          setAccessTokenToLS(this.accessToken);
          setProfileToLS(response.data.data.user);
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errorHandle: any | undefined = error.response?.data;
          const message = errorHandle?.message || error.message;
          const toastId = "authError";
          toast.error(message, { toastId });

          if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
            removeLocalStorage();
          }
        }
        return Promise.reject(error);
      }
    );
  }
}

const request = new Request().instance;

export default request;
