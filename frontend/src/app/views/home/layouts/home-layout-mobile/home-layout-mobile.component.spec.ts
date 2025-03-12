import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeLayoutMobileComponent } from './home-layout-mobile.component';

describe('HomeLayoutMobileComponent', () => {
  let component: HomeLayoutMobileComponent;
  let fixture: ComponentFixture<HomeLayoutMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeLayoutMobileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeLayoutMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
