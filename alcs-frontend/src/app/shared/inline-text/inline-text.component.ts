import { AfterContentChecked, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-inline-text[value]',
  templateUrl: './inline-text.component.html',
  styleUrls: ['./inline-text.component.scss'],
})
export class InlineTextComponent implements AfterContentChecked {
  @Input() value?: string | undefined;
  @Input() placeholder: string = 'Enter a value';
  @Output() save = new EventEmitter<string | null>();

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
    if (this.pendingValue !== this.value) {
      this.save.emit(this.pendingValue?.toString() ?? null);
      this.value = this.pendingValue;
    }

    this.isEditing = false;
  }

  cancelEdit() {
    this.isEditing = false;
    this.pendingValue = this.value;
  }
}
