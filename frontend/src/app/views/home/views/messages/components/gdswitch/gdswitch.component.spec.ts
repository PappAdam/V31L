import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GDSwitchComponent } from './gdswitch.component';

describe('GDSwitchComponent', () => {
  let component: GDSwitchComponent;
  let fixture: ComponentFixture<GDSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GDSwitchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GDSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
