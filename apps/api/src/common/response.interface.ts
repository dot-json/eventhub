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

  static successNoData(message: string = 'Operation successful'): ApiResponse {
    return {
      message,
    };
  }

  static successWithPagination<T>(
    data: T[],
    message: string = 'Operation successful',
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
  ): ApiResponse<T[]> & {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    return {
      message,
      data,
      pagination,
    };
  }
}
