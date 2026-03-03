import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input[numbersOnly]',
  standalone: true,
})
export class NumbersOnlyDirective {
  constructor(private readonly elementRef: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    const sanitizedValue = input.value.replace(/\D/g, '');

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }
  }
}
