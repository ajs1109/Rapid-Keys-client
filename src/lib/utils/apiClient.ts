import axios, { AxiosError, AxiosInstance, HttpStatusCode } from "axios";
import { HttpResponse } from "../models/shared/httpResponse";
import { env } from "process";
import { getJwt } from "../helpers/windowHelpers";
import { HttpErrorResponse } from "../models/shared/httpErrorResponse";


export default class ApiClient {
  private static instance: AxiosInstance | undefined;
  static async initClient() {
      
    if (this.instance) {
      return;
    }

    this.instance = axios.create({
      baseURL: "http://localhost:5000/api", // Replace with your base URL
      timeout: Number.parseInt(env.REQUEST_TIMEOUT || "5000"), // Set a default timeout (in milliseconds)
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS'
      },
    });
    // this is to handle the 401 error returned by the server 
    this.instance?.interceptors.request.use(this.addJwtToHeaders);
    this.instance?.interceptors.response.use(
      response => response, // On success, just return the response
      error => error.response
    );
  }

  static async sendHttpGet<T extends object>(
    endPoint: string,
    queryString?: URLSearchParams
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.instance?.get<HttpResponse<T>>(
        `${endPoint}?${queryString?.toString()||''}`
      );
      return (
        response?.data ||
        new HttpResponse(
          new HttpErrorResponse(
            HttpStatusCode.NotImplemented,
            "NO RESPONSE FROM SERVER CHECK SERVER LOGS",
            "NO_RESPONSE",
            []
          )
        )
      );
    } catch (ex: any) {
      if (axios.isAxiosError(ex)) {
        const axiosError = ex as AxiosError;
        console.error("AXIOS ERROR", ex);
        if (axiosError.status == HttpStatusCode.BadRequest) {
          return new HttpResponse(
            new HttpErrorResponse(
              HttpStatusCode.BadRequest,
              "Invalid request",
              "INVALID_REQUEST",
              [JSON.stringify(axiosError.response?.data)]
            )
          );
        }
      }
      const error = ex as Error;
      console.warn("UNHANDLED ERROR");
      console.error("ERROR IN GET REQUEST", error.message);
      console.error("STACKTRACE :", error.stack);
      return new HttpResponse(
        new HttpErrorResponse(HttpStatusCode.InternalServerError, "", "", [])
      );
    }
  }
  static async sendHttpPost<T>( 
    req: any,
    endPoint: string,
    queryParams?: URLSearchParams
  ) {
    try {
      console.log('object.sendHttpPost:', req, env.NEXT_PUBLIC_SERVER_URI,endPoint, queryParams);
      const response = await this.instance?.post<T>(
        `${endPoint}?${queryParams?.toString() || ''}`,
        req
      );
      console.log('api client send:', response);
      return (
        response?.data ||
        new HttpResponse(
          new HttpErrorResponse(
            HttpStatusCode.NotImplemented,
            "NO RESPONSE FROM SERVER CHECK SERVER LOGS",
            "NO_RESPONSE",
            []
          )
        )
      );
    } catch (ex: any) {
      if (axios.isAxiosError(ex)) {
        const axiosError = ex as AxiosError;
        console.error("AXIOS ERROR", ex);
        if (axiosError.status == HttpStatusCode.BadRequest) {
          return new HttpResponse(
            new HttpErrorResponse(
              HttpStatusCode.BadRequest,
              "Invalid request",
              "INVALID_REQUEST",
              [JSON.stringify(axiosError.response?.data)]
            )
          );
        }
      }
      const error = ex as Error;
      console.warn("UNHANDLED ERROR");
      console.error("ERROR IN POST REQUEST", error.message);
      console.error("STACKTRACE :", error.stack);
      return new HttpResponse(
        new HttpErrorResponse(HttpStatusCode.InternalServerError, "", "", [])
      );
    }
  }
  static async addJwtToHeaders(config: any): Promise<any> {
    
    const jwtToken = await getJwt();
    if (jwtToken) {
      config.headers["Authorization"] = `Bearer ${jwtToken}`;
    }
    return config;
  }

  static async sendHttpPut<T>(
    endPoint: string,
    req: any,
    queryParams?: URLSearchParams,
    
  ) {
    try {
      const response = await this.instance?.put<T>(
        `${endPoint}?${queryParams?.toString()}`,
        req
      );
      return (
        response?.data ||
        new HttpResponse(
          new HttpErrorResponse(
            HttpStatusCode.NotImplemented,
            "NO RESPONSE FROM SERVER CHECK SERVER LOGS",
            "NO_RESPONSE",
            []
          )
        )
      );
    } catch (ex: any) {
      if (axios.isAxiosError(ex)) {
        const axiosError = ex as AxiosError;
        console.error("AXIOS ERROR", ex);
        if (axiosError.status == HttpStatusCode.BadRequest) {
          return new HttpResponse(
            new HttpErrorResponse(
              HttpStatusCode.BadRequest,
              "Invalid request",
              "INVALID_REQUEST",
              [JSON.stringify(axiosError.response?.data)]
            )
          );
        }
      }
      const error = ex as Error;
      console.warn("UNHANDLED ERROR");
      console.error("ERROR IN PUT REQUEST", error.message);
      console.error("STACKTRACE :", error.stack);
      return new HttpResponse(
        new HttpErrorResponse(HttpStatusCode.InternalServerError, "", "", [])
      );
    }
  }
}