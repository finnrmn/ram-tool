import { RamApiError } from "./index";

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof RamApiError) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unbekannter Fehler.";
};
