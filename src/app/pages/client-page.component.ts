import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';

@Component({
  selector: 'app-client-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <div class="meta-row">
        <label>Date <input type="date" [(ngModel)]="clientDate" name="clientDate" /></label>
        <label
          >Réf Dossier
          <input
            class="locked-input"
            type="text"
            [value]="clientReference"
            disabled
            aria-disabled="true"
            title="Référence générée automatiquement"
        /></label>
      </div>

      <h1 class="title">Votre client</h1>

      <form class="form-grid">
        <label>Nom <input type="text" lettersOnly [(ngModel)]="lastName" name="lastName" /></label>
        <label>Prénom <input type="text" lettersOnly [(ngModel)]="firstName" name="firstName" /></label>
        <label>Numéro <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Rue <input type="text" lettersOnly /></label>
        <label>Code Postal <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>Ville <input type="text" lettersOnly /></label>
        <label>Tél. <input type="text" numbersOnly inputmode="numeric" /></label>
        <label>mail <input type="email" /></label>
      </form>

      <div class="stack-actions">
        <button type="button" class="btn ok">Valider</button>
        <button type="button" class="btn danger">Annuler</button>
      </div>

      <div class="next-line">
        <a class="btn next" routerLink="/maison">La maison ></a>
      </div>

      <p class="tutorial-label">Tuto formulaire</p>
      <div class="tutorial-box"></div>
    </section>
  `,
})
export class ClientPageComponent {
  clientDate = '';
  firstName = '';
  lastName = '';

  get clientReference(): string {
    const datePart = this.formatDateToDdMmYy(this.clientDate);
    const firstNamePart = this.normalizeLetters(this.firstName).slice(0, 1);
    const lastNamePart = this.normalizeLetters(this.lastName).slice(0, 2);

    return `${datePart}${firstNamePart}${lastNamePart}`;
  }

  private formatDateToDdMmYy(dateValue: string): string {
    if (!dateValue) {
      return '';
    }

    const [year, month, day] = dateValue.split('-');

    if (!year || !month || !day) {
      return '';
    }

    return `${day}${month}${year.slice(-2)}`;
  }

  private normalizeLetters(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase();
  }
}
