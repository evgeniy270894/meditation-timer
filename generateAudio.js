import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

/**************************************************************
 * 1. Настройка окружения
 *************************************************************/

// Определяем путь к текущей директории (т.к. мы в ESM-модуле)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем экземпляр OpenAI.
// Убедитесь, что переменная окружения OPENAI_API_KEY установлена,
// например: export OPENAI_API_KEY="sk-...."
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Папка, куда будем сохранять MP3
const OUTPUT_DIR = path.join(__dirname, "audio_out");

// Если папки нет, создаём
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**************************************************************
 * 2. Список всех необходимых русскоязычных фраз (42 шт.)
 *************************************************************/
const PHRASES = [
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

/**************************************************************
 * 3. Функция генерации одного MP3 файла
 *    с помощью OpenAI Audio API (TTS).
 *************************************************************/
async function generateSpeechMp3(phrase, outPath) {
  try {
    console.log(
      `Запрос TTS для фразы: "${phrase}" → ${path.basename(outPath)}`
    );

    // Запрашиваем у OpenAI TTS. Пример с model="tts-1" и voice="alloy".
    // Для русской речи, возможно, есть другие модели/голоса,
    // уточняйте в документации OpenAI (если доступно).
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "coral",
      input: phrase,
    });

    // mp3.arrayBuffer() - асинхронный метод, получаем бинарные данные
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Сохраняем результат в файл
    await fs.promises.writeFile(outPath, buffer);

    console.log(`✅ Успешно: ${outPath}`);
  } catch (error) {
    console.error(
      `❌ Ошибка при генерации аудио для фразы "${phrase}":\n`,
      error
    );
  }
}

/**************************************************************
 * 4. Основная логика - параллельная генерация аудио
 *************************************************************/
async function main() {
  // Создаем массив промисов для параллельного выполнения
  const generatePromises = PHRASES.map(({ text, fileName }) => {
    const outFile = path.join(OUTPUT_DIR, `${fileName}.mp3`);
    return generateSpeechMp3(text, outFile);
  });

  // Запускаем все промисы параллельно
  await Promise.all(generatePromises);

  console.log(
    "\nГотово! Все аудиофайлы (42 шт.) сгенерированы в папку:",
    OUTPUT_DIR
  );
}

/**************************************************************
 * 5. Запуск
 *************************************************************/
main().catch((err) => {
  console.error("Глобальная ошибка при генерации аудио:", err);
  process.exit(1);
});
