// src/utils/numberToAudio.ts

export interface Phrase {
  text: string;
  fileName: string;
}

export const PHRASES: Phrase[] = [
  // 0..19
  { text: "ноль", fileName: "0_nol" },
  { text: "один", fileName: "1_odin" },
  { text: "два", fileName: "2_dva" },
  { text: "три", fileName: "3_tri" },
  { text: "четыре", fileName: "4_chetyre" },
  { text: "пять", fileName: "5_pyat" },
  { text: "шесть", fileName: "6_shest" },
  { text: "семь", fileName: "7_sem" },
  { text: "восемь", fileName: "8_vosem" },
  { text: "девять", fileName: "9_devять" },
  { text: "десять", fileName: "10_desyat" },
  { text: "одиннадцать", fileName: "11_odinnadtsat" },
  { text: "двенадцать", fileName: "12_dvenadtsat" },
  { text: "тринадцать", fileName: "13_trinadtsat" },
  { text: "четырнадцать", fileName: "14_chetyrnadtsat" },
  { text: "пятнадцать", fileName: "15_pyatnadtsat" },
  { text: "шестнадцать", fileName: "16_shestnadtsat" },
  { text: "семнадцать", fileName: "17_semnadtsat" },
  { text: "восемнадцать", fileName: "18_vosemnadtsat" },
  { text: "девятнадцать", fileName: "19_devятnadtsat" },

  // десятки
  { text: "двадцать", fileName: "20_dvadtsat" },
  { text: "тридцать", fileName: "30_tridtsat" },
  { text: "сорок", fileName: "40_sorok" },
  { text: "пятьдесят", fileName: "50_pyatdesyat" },
  { text: "шестьдесят", fileName: "60_shestdesyat" },
  { text: "семьдесят", fileName: "70_semdesyat" },
  { text: "восемьдесят", fileName: "80_vosemdesyat" },
  { text: "девяносто", fileName: "90_devyanosto" },

  // сотни
  { text: "сто", fileName: "100_sto" },
  { text: "двести", fileName: "200_dvesti" },
  { text: "триста", fileName: "300_trista" },
  { text: "четыреста", fileName: "400_chetyresta" },
  { text: "пятьсот", fileName: "500_pyatsot" },
  { text: "шестьсот", fileName: "600_shestsot" },
  { text: "семьсот", fileName: "700_semsot" },
  { text: "восемьсот", fileName: "800_vosemsot" },
  { text: "девятьсот", fileName: "900_devятsot" },

  // женские формы для 1 и 2 (только для "тысяч")
  { text: "одна", fileName: "1a_odna" },
  { text: "две", fileName: "2a_dve" },

  // формы "тысяча"
  { text: "тысяча", fileName: "thousand_tysyacha" },
  { text: "тысячи", fileName: "thousand_tysyachi" },
  { text: "тысяч", fileName: "thousand_tysyach" },
];

// Добавляем кэш для предзагруженных аудиофайлов
const audioCache: Map<string, HTMLAudioElement> = new Map();

/**
 * Предзагружает все аудиофайлы и сохраняет их в кэше
 */
export async function preloadAudioFiles(): Promise<void> {
  const loadPromises = PHRASES.map((phrase) => {
    return new Promise<void>((resolve) => {
      const audioPath = `${
        import.meta.env.PROD ? "/meditation-timer" : ""
      }/audio/${phrase.fileName}.mp3`;

      const audio = new Audio(audioPath);

      audio.addEventListener("canplaythrough", () => {
        audioCache.set(phrase.fileName, audio);
        resolve();
      });

      audio.addEventListener("error", () => {
        console.error(`Ошибка при предзагрузке файла ${phrase.fileName}.mp3`);
        resolve();
      });

      // Начинаем загрузку
      audio.load();
    });
  });

  await Promise.all(loadPromises);
  console.log("Все аудиофайлы предзагружены");
}

/**
 * Формирует последовательность имён аудиофайлов для воспроизведения числа.
 * Число разбивается на тысячи, сотни, десятки и единицы с учётом правил произношения.
 *
 * @param num Число для озвучки
 * @returns Массив имён аудиофайлов (без расширения .mp3)
 */
export function getAudioSequenceForNumber(num: number): string[] {
  if (num === 0) {
    const phrase0 = PHRASES.find((p) => p.fileName.startsWith("0_"));
    return phrase0 ? [phrase0.fileName] : [];
  }

  const sequence: string[] = [];

  // Обработка тысяч
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (thousands > 0) {
    // Для тысяч используем женскую форму для 1 и 2
    let thousandNumberAudio: string | undefined;
    if (thousands === 1) {
      thousandNumberAudio = "1a_odna";
    } else if (thousands === 2) {
      thousandNumberAudio = "2a_dve";
    } else {
      // Для остальных чисел используем мужской вариант, выбирая фразу из PHRASES
      const phrase = PHRASES.find(
        (p) =>
          p.fileName.startsWith(`${thousands}_`) && !p.fileName.includes("a_")
      );
      thousandNumberAudio = phrase ? phrase.fileName : `${thousands}`;
    }
    if (thousandNumberAudio) {
      sequence.push(thousandNumberAudio);
    }

    // Определяем нужную форму слова "тысяча"
    // Если число тысяч (последние 2 цифры) попадает в диапазон 11–14, то всегда "тысяч"
    let thousandSuffix: string;
    if (thousands % 100 >= 11 && thousands % 100 <= 14) {
      thousandSuffix = "thousand_tysyach";
    } else {
      const lastDigit = thousands % 10;
      if (lastDigit === 1) {
        thousandSuffix = "thousand_tysyacha";
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        thousandSuffix = "thousand_tysyachi";
      } else {
        thousandSuffix = "thousand_tysyach";
      }
    }
    sequence.push(thousandSuffix);
  }

  // Обработка остатка (сотни, десятки, единицы)
  if (remainder > 0) {
    const hundreds = Math.floor(remainder / 100);
    const tensUnits = remainder % 100;

    if (hundreds > 0) {
      const hundredsNumber = hundreds * 100;
      const phrase = PHRASES.find((p) =>
        p.fileName.startsWith(`${hundredsNumber}_`)
      );
      if (phrase) {
        sequence.push(phrase.fileName);
      }
    }

    if (tensUnits > 0) {
      if (tensUnits < 20) {
        // Числа от 1 до 19 озвучиваются единой фразой
        const phrase = PHRASES.find((p) =>
          p.fileName.startsWith(`${tensUnits}_`)
        );
        if (phrase) {
          sequence.push(phrase.fileName);
        }
      } else {
        const tens = Math.floor(tensUnits / 10) * 10;
        const units = tensUnits % 10;
        const tensPhrase = PHRASES.find((p) =>
          p.fileName.startsWith(`${tens}_`)
        );
        if (tensPhrase) {
          sequence.push(tensPhrase.fileName);
        }
        if (units > 0) {
          const unitsPhrase = PHRASES.find((p) =>
            p.fileName.startsWith(`${units}_`)
          );
          if (unitsPhrase) {
            sequence.push(unitsPhrase.fileName);
          }
        }
      }
    }
  }

  return sequence;
}

/**
 * Проигрывает массив аудиофайлов последовательно.
 *
 * @param audioFiles Массив имён файлов (без расширения .mp3)
 * @returns Promise, который резолвится после окончания воспроизведения всей последовательности
 */
export function playAudioSequence(audioFiles: string[]): Promise<void> {
  return audioFiles.reduce((prevPromise, fileName) => {
    return prevPromise.then(() => playSingleAudio(fileName));
  }, Promise.resolve());
}

// Обновляем функцию playSingleAudio для использования кэша
function playSingleAudio(fileName: string): Promise<void> {
  return new Promise((resolve) => {
    const cachedAudio = audioCache.get(fileName);

    if (cachedAudio) {
      // Используем предзагруженный файл
      cachedAudio.currentTime = 0; // Сбрасываем позицию воспроизведения

      const onEnded = () => {
        setTimeout(() => {
          resolve();
        }, 200);
        cachedAudio.removeEventListener("ended", onEnded);
      };

      cachedAudio.addEventListener("ended", onEnded);

      cachedAudio.play().catch((err) => {
        console.error(`Не удалось воспроизвести ${fileName}.mp3`, err);
        resolve();
      });
    } else {
      // Fallback на старое поведение, если файл не был предзагружен
      const audioPath = `${
        import.meta.env.PROD ? "/meditation-timer" : ""
      }/audio/${fileName}.mp3`;
      const audio = new Audio(audioPath);

      audio.addEventListener("ended", () => {
        resolve();
      });

      audio.addEventListener("error", (e) => {
        console.error(`Ошибка при воспроизведении файла ${fileName}.mp3`, e);
        resolve();
      });

      audio.play().catch((err) => {
        console.error(`Не удалось воспроизвести ${fileName}.mp3`, err);
        resolve();
      });
    }
  });
}
