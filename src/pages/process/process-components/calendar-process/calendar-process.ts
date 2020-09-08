/* Module imports */
import { Component, Input, ViewChild } from '@angular/core';
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
export class CalendarProcessComponent {
  @Input() alerts: Alert[];
  @Input() isPreview: boolean;
  @Input() stepData: Process;
  @ViewChild('calendar') calendarRef: CalendarComponent;
  showDescription: boolean = false;

  constructor(public events: Events) { }

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
   * Get css classes by alert values
   *
   * @params: alert - calendar alert
   *
   * @return: ngClass object with associated class names
  **/
  getAlertClass(alert: Alert): object {
    const closest: Alert = this.getClosestAlertByGroup();
    return {
      'next-datetime': alert === closest,
      'past-datetime': new Date().getTime() > new Date(alert.datetime).getTime()
    };
  }

  /**
   * Get alert for a particular step that is closest to the present datetime
   *
   * @params: none
   *
   * @return: alert that is closest to the current datetime
  **/
  getClosestAlertByGroup(): Alert {
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
   * Get values from current calendar step
   *
   * @params: none
   *
   * @return: calendar values to use in template
  **/
  getCurrentStepCalendarData(): object {
    return {
      _id: getId(this.stepData),
      duration: this.stepData.duration,
      title: this.stepData.name,
      description: this.stepData.description
    };
  }

  /**
   * Check if a calendar step has been started, but not finished
   *
   * @params: none
   *
   * @return: true if a calendar step has been started, but not yet completed
  **/
  isCalendarInProgress(): boolean {
    return this.stepData.hasOwnProperty('startDatetime');
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
