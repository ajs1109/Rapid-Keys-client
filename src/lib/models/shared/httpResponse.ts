// Assuming you have separate files for models and constants
import { HttpErrorResponse } from "./httpErrorResponse";
import { HttpSuccessResponse } from "./httpSuccessResponse";
import { HttpStatusCode } from "axios"; // Adjust path as needed

/**
 * Represents an HTTP response that can be either a success or an error.
 * Only one of SuccessResponse or ErrorResponse will be populated at a given time.
 *
 * @template T The type of the data returned in case of a successful response.
 */
export class HttpResponse<T extends object> {

  constructor(httpError:HttpErrorResponse){
      
  }
  /**
   * The HTTP success response containing data and message (if successful).
   */
  public successResponse?: HttpSuccessResponse<T>;

  /**
   * The HTTP error response containing information about the error (if unsuccessful).
   */
  public errorResponse?: HttpErrorResponse;

 
}