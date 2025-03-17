import { Component, ElementRef, Injectable } from '@angular/core';
import { NavigationOutletDirectiveDirective } from '@/directives/navigation-outlet-directive.directive';

interface navParent {
  outlet: Component;
  arguments: parentArgs;
  content: navContent[];
}

interface navContent {
  name: string;
  component: Component;
  args: navArgument[];
}

interface parentArgs {}
interface navArgument {}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private _navStack: navParent[] | null = null;

  constructor() {}

  registerParent(outlet: ElementRef, args: parentArgs): number {
    return 0;
  }

  registerContent(parentIndex: number, content: navContent): number {
    return 0;
  }

  modifyParentArgs(parentIndex: number) {}
  modifyContentArgs(contentIndex: number) {}

  next() {}
  back() {}
  jump() {}
}
