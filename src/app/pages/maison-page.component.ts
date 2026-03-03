import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientDatabaseService } from '../shared/services/client-database.service';
import { LettersOnlyDirective } from '../shared/directives/letters-only.directive';
import { NumbersOnlyDirective } from '../shared/directives/numbers-only.directive';
import { ProjectDataService } from '../shared/services/project-data.service';

@Component({
  selector: 'app-maison-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LettersOnlyDirective, NumbersOnlyDirective],
  template: `
    <section class="screen">
      <h1 class="title">La maison</h1>

      <form class="form-grid">
        <label
          >Quelle est l'isolation de la maison ?
          <input type="text" lettersOnly [(ngModel)]="isolation" name="isolation" (ngModelChange)="saveMaisonData()"
        /></label>
        <label
          >Quelle est la constante d'isolation (g) ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="g"
            name="g"
            (ngModelChange)="saveMaisonData()"
        /></label>
        <label
          >Quelle est la température de base ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="temperatureBase"
            name="temperatureBase"
            (ngModelChange)="saveMaisonData()"
        /></label>
        <label
          >Quelle est la hauteur sous-plafond ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="hauteurSousPlafond"
            name="hauteurSousPlafond"
            (ngModelChange)="saveMaisonData()"
        /></label>
        <label
          >Quel est le nombre de pièces ?
          <input
            type="text"
            numbersOnly
            inputmode="numeric"
            [(ngModel)]="nombrePieces"
            name="nombrePieces"
            (ngModelChange)="saveMaisonData()"
        /></label>
      </form>

      <div class="line-actions">
        <a class="btn prev" routerLink="/client">< Le client</a>
        <a class="btn next" routerLink="/piece/1">Les pièces ></a>
      </div>

      <p class="tutorial-label">Tuto formulaire</p>
      <div class="tutorial-box"></div>
    </section>
  `,
})
export class MaisonPageComponent {
  private readonly projectData = inject(ProjectDataService);
  private readonly clientDatabase = inject(ClientDatabaseService);

  isolation = '';
  g = '1';
  temperatureBase = '';
  hauteurSousPlafond = '';
  nombrePieces = '1';

  constructor() {
    const maison = this.projectData.getMaisonData();
    this.isolation = maison.isolation;
    this.g = String(maison.g || 1);
    this.temperatureBase = maison.temperatureBase ? String(maison.temperatureBase) : '';
    this.hauteurSousPlafond = maison.hauteurSousPlafond ? String(maison.hauteurSousPlafond) : '';
    this.nombrePieces = String(maison.nombrePieces || 1);
  }

  async saveMaisonData(): Promise<void> {
    this.projectData.setMaisonData({
      isolation: this.isolation,
      g: Number(this.g) || 1,
      temperatureBase: Number(this.temperatureBase) || 0,
      hauteurSousPlafond: Number(this.hauteurSousPlafond) || 0,
      nombrePieces: Number(this.nombrePieces) || 1,
    });

    await this.syncDossierToDatabase();
  }

  private async syncDossierToDatabase(): Promise<void> {
    const clientRef = this.projectData.getActiveClientRef();

    if (!clientRef) {
      return;
    }

    try {
      await this.clientDatabase.exportDossier(clientRef, this.projectData.getMaisonData(), this.projectData.getPieces());
    } catch {
      return;
    }
  }
}
