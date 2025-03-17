import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appNavigationOutletDirective]',
})
export class NavigationOutletDirectiveDirective {
  component: ViewContainerRef = {} as ViewContainerRef;
  constructor(viewContainerRef: ViewContainerRef) {
    this.component = viewContainerRef;
  }
}
