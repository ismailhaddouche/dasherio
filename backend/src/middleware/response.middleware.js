/**
 * Centralized response middleware for Disher.io
 * Ensures all API responses follow a consistent format.
 */

export const successResponse = (res, data, message = 'Success', status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data,
        requestId: res.req.id
    });
};

export const errorResponse = (res, message = 'Error', status = 500, error = null) => {
    const response = {
        success: false,
        message,
        requestId: res.req.id
    };

    if (error && process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    if (error && error.errors) {
        response.details = error.errors;
    }

    return res.status(status).json(response);
};

export const responseHandler = (req, res, next) => {
    res.success = (data, message, status) => successResponse(res, data, message, status);
    res.error = (message, status, error) => errorResponse(res, message, status, error);
    next();
};
