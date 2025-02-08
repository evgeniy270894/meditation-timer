/**
 * Возвращает промис, который резолвится значением последнего (по времени завершения) из массива промисов.
 * Если один из промисов реджектится, можно либо игнорировать ошибку (и ждать завершения остальных),
 * либо изменить логику обработки ошибок.
 *
 * @param promises Массив промисов
 * @returns Промис, который резолвится значением самого последнего завершившегося промиса.
 */
export function promiseLast<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let completedCount = 0;
    let lastResult: T | undefined;
    let hasError = false;
    let lastError: any;

    // Оборачиваем каждый промис, чтобы отследить порядок завершения.
    promises.forEach((p) => {
      p.then((result) => {
        completedCount++;
        lastResult = result; // сохраняем значение при каждом успешном завершении
        // Если все промисы завершились, резолвим значением последнего завершившегося
        if (completedCount === promises.length && !hasError) {
          resolve(lastResult as T);
        }
      }).catch((err) => {
        completedCount++;
        // Можно выбрать логику: либо сразу reject, либо дождаться завершения всех
        // Здесь мы ждём завершения всех и в конце реджектим, если были ошибки.
        hasError = true;
        lastError = err;
        if (completedCount === promises.length) {
          reject(lastError);
        }
      });
    });
  });
}
