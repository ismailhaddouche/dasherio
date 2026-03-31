import { Pipe, PipeTransform, inject } from '@angular/core';
import { MenuLanguageService } from '../../services/menu-language.service';
import type { LocalizedField } from '../../types';

@Pipe({ name: 'localize', standalone: true, pure: false })
export class LocalizePipe implements PipeTransform {
  private menuLangService = inject(MenuLanguageService);

  transform(value: LocalizedField | null | undefined): string {
    return this.menuLangService.localize(value);
  }
}
