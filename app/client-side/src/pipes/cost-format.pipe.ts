import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'costFormat'
})
export class CostFormatPipe implements PipeTransform {
  /**
   * Форматирование числа стоимости в строку с разделением тысяч точками и добавлением символа рубля
   * @param value Число стоимости для форматирования
   * @returns Отформатированная строка, например: "1.234.567 ₽"
   */
  transform(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₽';
  }

}