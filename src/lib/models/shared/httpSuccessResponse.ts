// Assuming you have separate files for models and constants
import { HttpStatusCode } from "axios"; // Adjust path as needed


  /**
   * Represents an HTTP success response with data of type T.
   *
   * @template T The type of data contained in the response.
   */
  export class HttpSuccessResponse<T extends object> {
    /**
     * A value indicating whether the request was successful (always true for success responses).
     */
    public success: boolean = true;

    /**
     * The HTTP status code of the response (defaults to HttpStatusCode.OK).
     */
    public statusCode: HttpStatusCode = HttpStatusCode.Ok;

    /**
     * A user-friendly message describing the response (defaults to GenericConstants.DEFAULT_SUCCESS_MESSAGE).
     */
    public message: string = "SUCCESS";

    /**
     * The data contained in the response.
     */
    public data: T;

    /**
     * The timestamp of the response (defaults to UTC now).
     */
    public timestamp: Date = new Date();

    /**
     * Creates a new instance of the HttpSuccessResponse class.
     *
     * @param data The data contained in the response.
     * @param message A user-friendly message describing the response (optional).
     * @param statusCode The HTTP status code of the response (optional).
     */
    constructor(
      data: T,
      message?: string,
      statusCode?: HttpStatusCode,
      date?: Date
    ) {
      this.data = data;
      this.message = message || "SUCCESS"; // Use default if message is not provided
      this.statusCode = statusCode || HttpStatusCode.Ok; // Use default if statusCode is not provided
      this.timestamp = date || new Date();
    }
  }
