import { Pipe, PipeTransform } from '@angular/core';

const SUPPORTED = ['es', 'en', 'fr', 'ar'] as const;
type Lang = typeof SUPPORTED[number];

// BUG-08: was always hardcoded to 'es' (`x ? 'es' : 'es'`). Now reads browser language.
function detectLang(): Lang {
  const raw = navigator.language?.split('-')[0] ?? 'es';
  return (SUPPORTED as readonly string[]).includes(raw) ? (raw as Lang) : 'es';
}

@Pipe({ name: 'localize', standalone: true, pure: false })
export class LocalizePipe implements PipeTransform {
  transform(value: { es?: string; en?: string; fr?: string; ar?: string } | null | undefined): string {
    if (!value) return '';
    const lang = detectLang();
    return (value as any)[lang] || value.es || value.en || '';
  }
}
