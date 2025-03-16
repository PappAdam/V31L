import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOptionCardComponent } from './group-option-card.component';

describe('GroupOptionCardComponent', () => {
  let component: GroupOptionCardComponent;
  let fixture: ComponentFixture<GroupOptionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupOptionCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupOptionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
