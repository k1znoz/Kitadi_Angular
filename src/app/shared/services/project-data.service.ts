import { Injectable } from '@angular/core';

export interface MaisonData {
  isolation: string;
  temperatureBase: number;
  hauteurSousPlafond: number;
  nombrePieces: number;
}

export interface PieceData {
  id: number;
  nom: string;
  longueur: number;
  largeur: number;
  hauteur: number;
  temperatureConfort: number;
  deltaT: number;
  puissance: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectDataService {
  private gCoefficient = 1;

  private maisonData: MaisonData = {
    isolation: '',
    temperatureBase: 0,
    hauteurSousPlafond: 0,
    nombrePieces: 1,
  };

  private pieces = new Map<number, PieceData>();

  setMaisonData(data: Partial<MaisonData>): void {
    this.maisonData = {
      ...this.maisonData,
      ...data,
      nombrePieces: Math.max(1, Number(data.nombrePieces ?? this.maisonData.nombrePieces) || 1),
      temperatureBase: Number(data.temperatureBase ?? this.maisonData.temperatureBase) || 0,
      hauteurSousPlafond: Number(data.hauteurSousPlafond ?? this.maisonData.hauteurSousPlafond) || 0,
    };
  }

  getMaisonData(): MaisonData {
    return { ...this.maisonData };
  }

  getNombrePieces(): number {
    return Math.max(1, this.maisonData.nombrePieces || 1);
  }

  upsertPiece(data: Omit<PieceData, 'deltaT' | 'puissance'>): PieceData {
    const deltaT = data.temperatureConfort - this.maisonData.temperatureBase;
    const puissance = this.gCoefficient * data.longueur * data.largeur * data.hauteur * deltaT;

    const piece: PieceData = {
      ...data,
      deltaT,
      puissance,
    };

    this.pieces.set(data.id, piece);
    return piece;
  }

  getPiece(id: number): PieceData | undefined {
    const piece = this.pieces.get(id);
    return piece ? { ...piece } : undefined;
  }

  getPieces(): PieceData[] {
    return Array.from(this.pieces.values()).sort((a, b) => a.id - b.id);
  }

  getTotalPuissanceMaison(): number {
    return this.getPieces().reduce((sum, piece) => sum + piece.puissance, 0);
  }
}
