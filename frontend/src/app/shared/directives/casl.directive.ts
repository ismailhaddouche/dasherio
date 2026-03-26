// BUG-09: was only evaluated once in ngOnInit — not reactive to login/logout.
// Now uses input() signals + effect() so the DOM updates when user changes.
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { authStore } from '../../store/auth.store';
import { defineAbilityFor } from '../../core/casl/ability.factory';

@Directive({ selector: '[caslCan]', standalone: true })
export class CaslCanDirective {
  action = input.required<string>({ alias: 'caslCan' });
  subject = input.required<string>({ alias: 'caslCanSubject' });

  private tpl = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const user = authStore.user();
      const action = this.action();
      const subject = this.subject();
      this.vcr.clear();
      if (!user) return;
      const ability = defineAbilityFor(user);
      if (ability.can(action as any, subject as any)) {
        this.vcr.createEmbeddedView(this.tpl);
      }
    });
  }
}
