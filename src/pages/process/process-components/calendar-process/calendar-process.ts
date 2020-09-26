/* Module imports */
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Events } from 'ionic-angular';

/* Interface imports */
import { Alert } from '../../../../shared/interfaces/alert';
import { Process } from '../../../../shared/interfaces/process';

/* Utility imports */
import { getId } from '../../../../shared/utility-functions/id-helpers';

/* Component imports */
import { CalendarComponent } from '../../../../components/calendar/calendar';


@Component({
  selector: 'calendar-process',
  templateUrl: 'calendar-process.html'
})
export class CalendarProcessComponent implements OnChanges {
  @Input() alerts: Alert[];
  @Input() isPreview: boolean;
  @Input() stepData: Process;
  @ViewChild('calendar') calendarRef: CalendarComponent;
  closestAlert: Alert = null;
  currentStepCalendarData: object = {};
  showDescription: boolean = false;

  constructor(public events: Events) { }

  ngOnChanges() {
    this.currentStepCalendarData = {
      _id: getId(this.stepData),
      duration: this.stepData.duration,
      title: this.stepData.name,
      description: this.stepData.description
    };
    this.closestAlert = this.getClosestAlertByGroup();
  }

  /**
   * Publish event to revert calendar to date selection view
   *
   * @params: none
   * @return: none
  **/
  changeDate(): void {
    this.events.publish('change-date');
  }

  /**
   * Get alert for a particular step that is closest to the present datetime
   *
   * @params: none
   *
   * @return: alert that is closest to the current datetime
  **/
  getClosestAlertByGroup(): Alert {
    if (!this.alerts.length) {
      return null;
    }

    return this.alerts.reduce((acc, curr) => {
      const accDiff: number
        = new Date(acc.datetime).getTime() - new Date().getTime();

      const currDiff: number
        = new Date(curr.datetime).getTime() - new Date().getTime();

      const isCurrCloser: boolean
        = Math.abs(currDiff) < Math.abs(accDiff) && currDiff > 0;

      return isCurrCloser ? curr: acc;
    });
  }

  /**
   * Set the start of a calendar step and update server
   *
   * @params: none
   *
   * @return: object containing update and step id
  **/
  startCalendar(): object {
    const calendarValues: object = this.calendarRef.getFinal();
    const update: object = {
      startDatetime: calendarValues['startDatetime'],
      alerts: calendarValues['alerts']
    };
    return {
      id: getId(calendarValues),
      update: update
    };
  }

  /**
   * Show or hide the current step description
   *
   * @params: none
   * @return: none
  **/
  toggleShowDescription(): void {
    this.showDescription = !this.showDescription;
  }

}
