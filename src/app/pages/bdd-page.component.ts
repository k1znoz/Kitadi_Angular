import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-bdd-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="screen">
      <h1 class="title">Fichier Clients<br />Kitadi Energies</h1>

      <table class="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Réf dossier</th>
            <th>Date</th>
            <th>Ville</th>
            <th>Code postal</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let client of clients">
            <td>{{ client.nom }}</td>
            <td>{{ client.ref }}</td>
            <td>{{ client.date }}</td>
            <td>{{ client.ville }}</td>
            <td>{{ client.cp }}</td>
          </tr>
        </tbody>
      </table>

      <div class="new-case-wrap">
        <button type="button" class="btn clients">Nouveau Dossier</button>
      </div>
    </section>
  `,
})
export class BddPageComponent {
  clients = [
    { nom: 'Bon Jean', ref: '241224JBO', date: '24/12/2024', ville: 'Bayonne', cp: '64100' },
    { nom: 'Kuki Jean', ref: '250623JKU', date: '25/06/2023', ville: 'Lyon', cp: '69000' },
    { nom: 'Bad Anne', ref: '260822ABA', date: '26/08/2022', ville: 'Rouen', cp: '76000' },
    { nom: 'Irri Sarah', ref: '240125SIR', date: '24/01/2025', ville: 'Montcuq', cp: '46800' },
  ];
}
