// Skema form "Buat event" (kurator). Aturan yang sama dicek RLS events_insert_curator di database.
import { z } from 'zod';

export const EVENT_KINDS = {
  small_table: 'Meja Kecil',
  hobby: 'Hobi',
  partner: 'Mitra',
  monthly: 'Sorotan bulanan',
} as const;
export type EventKind = keyof typeof EVENT_KINDS;

export const eventTitleSchema = z
  .string()
  .trim()
  .min(3, 'Judul minimal 3 karakter')
  .max(80, 'Judul maksimal 80 karakter');

export const eventTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/, 'Isi jam dengan format JJ.MM, contoh 19.00');

export const eventCostSchema = z
  .string()
  .trim()
  .max(40, 'Perkiraan biaya maksimal 40 karakter')
  .optional();

export const eventDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Deskripsi maksimal 500 karakter')
  .optional();

export const eventCapacitySchema = z
  .number()
  .int()
  .min(2, 'Kuota minimal 2')
  .max(200, 'Kuota maksimal 200');
