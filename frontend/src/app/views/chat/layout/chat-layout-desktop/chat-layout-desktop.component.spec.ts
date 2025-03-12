import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatLayoutDesktopComponent } from './chat-layout-desktop.component';

describe('ChatLayoutDesktopComponent', () => {
  let component: ChatLayoutDesktopComponent;
  let fixture: ComponentFixture<ChatLayoutDesktopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatLayoutDesktopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatLayoutDesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
