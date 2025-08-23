export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  count?: number;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  count: number;
  page?: number;
  totalPages?: number;
  totalCount?: number;
}

export class ResponseBuilder {
  static success<T>(
    data: T,
    message: string = 'Operation successful',
  ): ApiResponse<T> {
    return {
      message,
      data,
    };
  }

  static successWithCount<T>(
    data: T[],
    message: string = 'Operation successful',
  ): ApiResponse<T[]> & { count: number } {
    return {
      message,
      data,
      count: data.length,
    };
  }

  static successNoData(
    message: string = 'Operation successful',
  ): Omit<ApiResponse, 'data'> {
    return {
      message,
    };
  }
}
