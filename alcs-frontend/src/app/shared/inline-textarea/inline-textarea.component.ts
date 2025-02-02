import { AfterContentChecked, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-inline-edit[value]',
  templateUrl: './inline-textarea.component.html',
  styleUrls: ['./inline-textarea.component.scss'],
})
export class InlineTextareaComponent implements AfterContentChecked {
  @Input() value: string = '';
  @Input() placeholder: string = 'Enter a value';
  @Output() save = new EventEmitter<string>();

  @ViewChild('editInput') textInput!: ElementRef;

  isEditing = false;
  pendingValue: undefined | string;

  constructor() {}

  startEdit() {
    this.isEditing = true;
    this.pendingValue = this.value;
  }

  ngAfterContentChecked(): void {
    if (this.textInput) {
      this.textInput.nativeElement.focus();
    }
  }

  confirmEdit() {
    if (this.pendingValue !== this.value && this.pendingValue) {
      this.save.emit(this.pendingValue);
      this.value = this.pendingValue;
    }

    this.isEditing = false;
  }

  cancelEdit() {
    this.isEditing = false;
    this.pendingValue = this.value;
  }
}
