// src/utils/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

type ControllerMethod = (req: Request, res: Response) => Promise<void> | void;

export const asyncHandler = (fn: ControllerMethod): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};
