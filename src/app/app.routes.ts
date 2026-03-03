import { Routes } from '@angular/router';
import { BddPageComponent } from './pages/bdd-page.component';
import { ClientPageComponent } from './pages/client-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { MaisonPageComponent } from './pages/maison-page.component';
import { PiecePageComponent } from './pages/piece-page.component';
import { RapportPageComponent } from './pages/rapport-page.component';
import { RapportPageTwoComponent } from './pages/rapport-page-two.component';

export const routes: Routes = [
	{ path: '', component: HomePageComponent },
	{ path: 'client', component: ClientPageComponent },
	{ path: 'maison', component: MaisonPageComponent },
	{ path: 'piece', pathMatch: 'full', redirectTo: 'piece/1' },
	{ path: 'piece/:id', component: PiecePageComponent },
	{ path: 'rapport', component: RapportPageComponent },
	{ path: 'rapport/page-2', component: RapportPageTwoComponent },
	{ path: 'bdd', component: BddPageComponent },
	{ path: '**', redirectTo: '' },
];
