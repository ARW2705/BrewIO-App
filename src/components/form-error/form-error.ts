/* Module imports */
import { Component, Input, OnChanges } from '@angular/core';

/* Constant imports */
import { FORM_ERROR_MESSAGES } from '../../shared/constants/form-error-messages';


@Component({
  selector: 'form-error',
  templateUrl: 'form-error.html'
})
export class FormErrorComponent implements OnChanges {
  @Input('formName') formName;
  @Input('controlName') controlName;
  @Input('controlErrors') controlErrors;
  errors: string[] = [];

  constructor() { }

  ngOnChanges() {
    this.errors = [];
    for (const key in this.controlErrors) {
      this.errors.push(
        FORM_ERROR_MESSAGES[this.formName][this.controlName][key]
      );
    }
  }

}
