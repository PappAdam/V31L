import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeLayoutDesktopComponent } from './home-layout-desktop.component';

describe('HomeLayoutDesktopComponent', () => {
  let component: HomeLayoutDesktopComponent;
  let fixture: ComponentFixture<HomeLayoutDesktopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeLayoutDesktopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeLayoutDesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
