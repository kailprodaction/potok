/**
 * Деления оси округляются до «человеческих» чисел (0 / 500 / 1000), а не до
 * фактического минимума и максимума данных: ось читают глазами, а не парсером.
 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.abs(max) || 1;
  const rawStep = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const error = rawStep / magnitude;
  const multiplier = error >= 7.5 ? 10 : error >= 3 ? 5 : error >= 1.5 ? 2 : 1;
  const step = multiplier * magnitude;

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    // Плавающая точка копит хвосты (0.1+0.2): округляем к шагу.
    ticks.push(Math.round(value / step) * step);
  }
  return ticks;
}

/**
 * Индексы точек, которые получат подпись на оси X.
 *
 * Фиксированный шаг («каждые 7 дней») работает ровно до тех пор, пока график не
 * сузится: на телефоне подписи начинают наезжать друг на друга. Считать нужно в
 * пикселях, а не в шагах индекса — сталкиваются именно пиксели.
 *
 * @param spacing   расстояние в пикселях между соседними позициями
 * @param labelWidth ширина подписи с воздухом вокруг неё
 * @param alwaysLast последняя точка обязана быть подписана (конец горизонта);
 *                   если предыдущая подпись к ней слишком близко — она уступает
 */
export function pickLabelIndices(
  count: number,
  spacing: number,
  labelWidth: number,
  alwaysLast = false,
): number[] {
  const last = count - 1;
  if (last < 0) return [];
  if (last === 0 || spacing <= 0) return [0];

  const stride = Math.max(Math.ceil(labelWidth / spacing), 1);
  const indices: number[] = [];
  for (let index = 0; index <= last; index += stride) {
    indices.push(index);
  }

  if (alwaysLast && indices[indices.length - 1] !== last) {
    const previous = indices[indices.length - 1];
    if (previous !== undefined && (last - previous) * spacing < labelWidth) {
      indices.pop();
    }
    indices.push(last);
  }

  return indices;
}

/** Линейное отображение значения в координату. */
export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number): number => r0 + ((value - d0) / span) * (r1 - r0);
}
