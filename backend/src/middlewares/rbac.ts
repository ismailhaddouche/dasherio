import { Request, Response, NextFunction } from 'express';
import { defineAbilityFor } from '../abilities/abilities';

export function requirePermission(action: string, subject: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const ability = defineAbilityFor(req.user);
    if (ability.cannot(action as any, subject as any)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
