import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-inline-datepicker',
  templateUrl: './inline-datepicker.component.html',
  styleUrls: ['./inline-datepicker.component.scss'],
})
export class InlineDatepickerComponent implements OnInit, OnChanges {
  @Input() selectedValue: number | undefined;

  @Output() save = new EventEmitter<number>();

  form!: FormGroup;

  isEditing = false;
  formattedDate = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    if (this.selectedValue) {
      this.formattedDate = dayjs(this.selectedValue).format('YYYY-MMM-DD');
      this.form = this.fb.group({
        date: new Date(this.selectedValue),
      });
    } else {
      this.form = this.fb.group({
        date: undefined,
      });
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  onSave() {
    const selectedValue = this.form.get('date')!.value;
    const finalValue = dayjs(selectedValue).startOf('day').add(12, 'hours').valueOf();
    this.save.emit(finalValue);
    this.isEditing = false;
  }

  ngOnChanges(): void {
    if (this.selectedValue && this.form) {
      this.formattedDate = dayjs(this.selectedValue).format('YYYY-MMM-DD');
      this.form.patchValue({
        date: new Date(this.selectedValue),
      });
    }
  }
}