import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { loginWithUsername, loginWithPin } from '../services/auth.service';

export const loginUsername = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const result = await loginWithUsername(username, password);
  res.json(result);
});

export const loginPin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { pin_code, restaurant_id } = req.body;
  const result = await loginWithPin(pin_code, restaurant_id);
  res.json(result);
});
