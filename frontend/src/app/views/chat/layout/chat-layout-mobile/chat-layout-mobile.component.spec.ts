import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatLayoutMobileComponent } from './chat-layout-mobile.component';

describe('ChatLayoutMobileComponent', () => {
  let component: ChatLayoutMobileComponent;
  let fixture: ComponentFixture<ChatLayoutMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatLayoutMobileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatLayoutMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
