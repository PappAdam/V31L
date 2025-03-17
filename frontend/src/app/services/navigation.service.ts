import {
  Component,
  ElementRef,
  Injectable,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { NavigationOutletDirectiveDirective } from '@/directives/navigation-outlet-directive.directive';
import { MessagesComponent } from '@/views/home/views/messages/messages.component';

export interface navParent {
  target: Target;
  outlet: ViewContainerRef;
  arguments: parentArgs;
  content: navContent[];
}

export interface navContent {
  component: any;
  args: navArgs;
}

export enum Target {
  home,
  chat,
}

export interface parentArgs {
  initialPage: any;
}

export interface navArgs {}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private _navStack: navParent[] | null = null;

  constructor() {}

  registerParent(
    target: Target,
    outlet: ViewContainerRef,
    args: parentArgs
  ): number {
    let tempargs = {} as parentArgs;
    let tempparent = {
      target: target,
      outlet: outlet,
      arguments: args,
    } as navParent;
    console.log('Tempp parent:');
    console.log(tempparent);

    if (args) {
      if (args.initialPage) {
        console.log('create component ran');
        tempparent.outlet.createComponent(args.initialPage);
      }
    } else {
      tempparent.arguments = { initialPage: null };
    }

    return this._navStack ? this._navStack.push(tempparent) - 1 : -1;
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
