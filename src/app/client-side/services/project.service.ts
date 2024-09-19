import { Injectable } from '@angular/core';
import { roomData } from '../components/plan-house/plan-house/plan-house.component';
export interface projectInformation{
  rooms:roomData[];
  nameProject:string;
}
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor() { }
}
