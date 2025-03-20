import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupMemberCardComponent } from './group-member-card.component';

describe('GroupMemberCardComponent', () => {
  let component: GroupMemberCardComponent;
  let fixture: ComponentFixture<GroupMemberCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupMemberCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupMemberCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
