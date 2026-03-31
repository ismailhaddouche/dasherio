import { Request, Response } from 'express';
import { asyncHandler, createError } from '../utils/async-handler';
import * as MenuLanguageService from '../services/menu-language.service';

export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const languages = await MenuLanguageService.getByRestaurant(req.user!.restaurantId);
  res.json(languages);
});

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, code, is_default, linked_app_lang } = req.body;
  if (!name || !code) throw createError.badRequest('NAME_AND_CODE_REQUIRED');

  const lang = await MenuLanguageService.create({
    restaurant_id: req.user!.restaurantId,
    name,
    code,
    is_default,
    linked_app_lang: linked_app_lang || null,
  });
  res.status(201).json(lang);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, code, linked_app_lang, order } = req.body;
  const lang = await MenuLanguageService.update(String(req.params.id), {
    ...(name !== undefined && { name }),
    ...(code !== undefined && { code }),
    ...(linked_app_lang !== undefined && { linked_app_lang: linked_app_lang || null }),
    ...(order !== undefined && { order }),
  });
  if (!lang) throw createError.notFound('MENU_LANGUAGE_NOT_FOUND');
  res.json(lang);
});

export const setDefault = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const lang = await MenuLanguageService.setDefault(String(req.params.id), req.user!.restaurantId);
  if (!lang) throw createError.notFound('MENU_LANGUAGE_NOT_FOUND');
  res.json(lang);
});

export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await MenuLanguageService.remove(String(req.params.id));
  res.status(204).end();
});
