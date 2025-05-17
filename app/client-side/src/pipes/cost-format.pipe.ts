import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'costFormat'
})
export class CostFormatPipe implements PipeTransform {

  transform(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')+' ₽';
  }

}
