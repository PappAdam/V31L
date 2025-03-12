import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLayoutDesktopComponent } from './app-layout-desktop.component';

describe('AppLayoutDesktopComponent', () => {
  let component: AppLayoutDesktopComponent;
  let fixture: ComponentFixture<AppLayoutDesktopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutDesktopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppLayoutDesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
