import { Request, Response } from 'express';
import { loginWithEmail, loginWithPin } from '../services/auth.service';

export async function loginEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await loginWithEmail(email, password);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid credentials' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export async function loginPin(req: Request, res: Response): Promise<void> {
  try {
    const { pin_code, restaurant_id } = req.body;
    const result = await loginWithPin(pin_code, restaurant_id);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'INVALID_PIN') {
      res.status(401).json({ error: 'Invalid PIN' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
