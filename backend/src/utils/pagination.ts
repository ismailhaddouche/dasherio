import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Extract pagination parameters from request query
 * @param req Express request object
 * @returns Pagination parameters (page, limit, skip)
 */
export function getPaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT)
  );
  
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

/**
 * Create a paginated response
 * @param data The data array
 * @param total Total count of items
 * @param page Current page
 * @param limit Items per page
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Apply pagination to a Mongoose query
 * Usage: const { query, pagination } = applyPagination(MyModel.find(), req);
 * @param query Mongoose query
 * @param req Express request
 * @returns Object with modified query and pagination params
 */
export function applyPagination(
  query: any,
  req: Request
): { query: any; pagination: PaginationParams } {
  const pagination = getPaginationParams(req);
  
  return {
    query: query.skip(pagination.skip).limit(pagination.limit),
    pagination,
  };
}
