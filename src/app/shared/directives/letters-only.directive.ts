import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input[lettersOnly]',
  standalone: true,
})
export class LettersOnlyDirective {
  constructor(private readonly elementRef: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    const sanitizedValue = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '');

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }
  }
}
