/**
 * Utility function to wrap async controller functions and catch errors
 * This eliminates the need for try/catch blocks in each controller
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
