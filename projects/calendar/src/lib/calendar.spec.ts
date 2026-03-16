import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdcSimpleCalendar } from './calendar';

describe('Calendar', () => {
  let component: OdcSimpleCalendar;
  let fixture: ComponentFixture<OdcSimpleCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdcSimpleCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdcSimpleCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
