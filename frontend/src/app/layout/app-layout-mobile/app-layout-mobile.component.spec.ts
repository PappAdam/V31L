import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLayoutMobileComponent } from './app-layout-mobile.component';

describe('AppLayoutMobileComponent', () => {
  let component: AppLayoutMobileComponent;
  let fixture: ComponentFixture<AppLayoutMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutMobileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppLayoutMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
