import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-home-page',
  standalone: true,
  template: `
    <section class="screen">
      <h1 class="title">Bienvenue</h1>

      <div class="image-placeholder">Image illustration local Brive</div>

      <div class="map-wrap">
        <div #leafletMap class="leaflet-map" aria-label="Carte de Brive-la-Gaillarde"></div>
      </div>

      <div class="contact-card">
        <p><strong>KITADI ENERGIES</strong></p>
        <p>18 rue Martial Brigoulex</p>
        <p>19100 BRIVE LA GAILLARDE</p>
        <p>06 16 87 15 41</p>
        <p>contact@kitadi-energies.fr</p>
      </div>
    </section>
  `,
  styles: `
    .screen {
      text-align: center;
    }

    .title {
      font-size: 50px;
      margin: 24px 0 30px;
    }

    .image-placeholder {
      border: 2px solid #2c2c2c;
      background: #d8d8d8;
      height: 220px;
      width: 100%;
      margin: 0 0 20px;
      display: grid;
      place-items: center;
      font-size: 13px;
    }

    .map-wrap {
      border: 2px solid #2c2c2c;
      display: grid;
      place-items: center;
      background: #fff;
      height: 220px;
      width: 100%;
      margin: 0 0 20px;
    }

    .leaflet-map {
      width: 100%;
      height: 100%;
    }

    .contact-card {
      width: 100%;
      margin: 8px 0;
      background: #3b7755;
      color: #fff;
      padding: 14px 10px;
      font-size: 13px;
    }

    .contact-card p {
      margin: 0 0 6px;
    }
  `,
})
export class HomePageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('leafletMap', { static: true }) private leafletMapRef!: ElementRef<HTMLDivElement>;

  private map?: L.Map;

  ngAfterViewInit(): void {
    const brive: L.LatLngExpression = [45.159, 1.5333];

    this.map = L.map(this.leafletMapRef.nativeElement, {
      zoomControl: false,
      attributionControl: false,
    }).setView(brive, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    L.circleMarker(brive, {
      radius: 6,
      color: '#1f5db8',
      fillColor: '#1f5db8',
      fillOpacity: 0.9,
      weight: 2,
    })
      .addTo(this.map)
      .bindPopup('Brive-la-Gaillarde');
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}

