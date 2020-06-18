/* Module imports */
import { Component, Input, ViewChild } from '@angular/core';
import { Events } from 'ionic-angular';

/* Interface imports */
import { Process } from '../../../../shared/interfaces/process';
import { Alert } from '../../../../shared/interfaces/alert';

/* Utility imports */
import { getId } from '../../../../shared/utility-functions/utilities';

/* Component imports */
import { CalendarComponent } from '../../../../components/calendar/calendar';


@Component({
  selector: 'calendar-process',
  templateUrl: 'calendar-process.html'
})
export class CalendarProcessComponent {
  @Input() stepData: Process;
  @Input() isPreview: boolean;
  @Input() alerts: Array<Alert>;
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
  getAlertClass(alert: Alert): any {
    const closest = this.getClosestAlertByGroup();
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
      const accDiff = new Date(acc.datetime).getTime() - new Date().getTime();
      const currDiff = new Date(curr.datetime).getTime() - new Date().getTime();
      const isCurrCloser = Math.abs(currDiff) < Math.abs(accDiff) && currDiff > 0;
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
    const calendarValues = this.calendarRef.getFinal();
    const update = {
      startDatetime: calendarValues.startDatetime,
      alerts: calendarValues.alerts
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
