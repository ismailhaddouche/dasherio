import { z } from 'zod';
import {
  LocalizedStringSchema,
  LocalizedStringOptionalSchema,
  RestaurantSchema,
  PrinterSchema,
  RoleSchema,
  StaffSchema,
  StaffLoginSchema,
  StaffPinSchema,
  CategorySchema,
  AllergenSchema,
  DishSchema,
  VariantSchema,
  ExtraSchema,
  TotemSchema,
  TotemSessionSchema,
  CustomerSchema,
  OrderSchema,
  ItemOrderSchema,
  PaymentSchema,
  PaymentTicketSchema,
} from '../schemas';

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type LocalizedStringOptional = z.infer<typeof LocalizedStringOptionalSchema>;

export type Restaurant = z.infer<typeof RestaurantSchema>;
export type Printer = z.infer<typeof PrinterSchema>;

export type Role = z.infer<typeof RoleSchema>;
export type Staff = z.infer<typeof StaffSchema>;
export type StaffLogin = z.infer<typeof StaffLoginSchema>;
export type StaffPin = z.infer<typeof StaffPinSchema>;

export type Category = z.infer<typeof CategorySchema>;
export type Allergen = z.infer<typeof AllergenSchema>;
export type Dish = z.infer<typeof DishSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type Extra = z.infer<typeof ExtraSchema>;

export type Totem = z.infer<typeof TotemSchema>;
export type TotemSession = z.infer<typeof TotemSessionSchema>;
export type Customer = z.infer<typeof CustomerSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type ItemOrder = z.infer<typeof ItemOrderSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type PaymentTicket = z.infer<typeof PaymentTicketSchema>;
