import axios from 'axios';
import type { ApiErrorResponse } from '@/shared/types/api.types';

export function getApiErrorMessage(error: unknown, fallback = 'Ha ocurrido un error'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiError = error.response?.data?.error;
    if (apiError?.details?.length) {
      return apiError.details.map((detail) => detail.message).join('. ');
    }
    if (apiError?.message) {
      return apiError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
