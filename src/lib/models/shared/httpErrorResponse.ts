// Assuming you have separate files for models and constants
import { HttpStatusCode } from "axios"; // Adjust path as needed



  /**
   * Represents an HTTP error response.
   */
  export class HttpErrorResponse {

    /**
     * The HTTP status code of the error.
     */
    public statusCode: HttpStatusCode;

    /**
     * A user-friendly message describing the error.
     */
    public message: string;

    /**
     * A unique error code associated with the error.
     */
    public errorCode: string;

    /**
     * A list of specific error messages.
     */
    public errors: string[];

    /**
     * Creates a new instance of the HttpErrorResponse class.
     *
     * @param statusCode The HTTP status code of the error.
     * @param message A user-friendly message describing the error.
     * @param errorCode A unique error code associated with the error.
     * @param errors A list of specific error messages.
     */
    constructor(statusCode: HttpStatusCode, message: string, errorCode: string, errors: string[]) {
      this.statusCode = statusCode;
      this.message = message;
      this.errorCode = errorCode;
      this.errors = errors;
    }
  }