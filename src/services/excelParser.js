import * as XLSX from 'xlsx';
import { appConfig } from './../config';

/* 
=== Инструкция ===

Данные в файле Excel заказчик редко обновляет.
Чтобы каждый раз при обновлении страницы не парсить данные из Excel файла, парсим их один раз и весь вывод сохраняем в файле json.
Импортируем этот json файл в проект Vue. Все данные будут в виде обычных объектов и массивов.
Когда заказчик обновит Excel файла, то запускаем парсер и весь вывод сохраняем в файле json.

1. == Вручную ==

В консоле будет строка RAW_PARSED_DATA:. 
Нажмите на нее правой кнопкой мыши и выберите пункт Store as global variable (Сохранить как глобальную переменную).
Браузер автоматически создаст переменную с именем temp0 (или temp1), содержащую этот объект.
Вставьте в самую нижнюю строку консоли следующий скрипт и нажмите Enter:

// Функция преобразует Map в объекты, чтобы JSON их не стёр
function mapReplacer(key, value) {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

// Команда копирует весь объект, правильно разворачивая внутренние Map
copy(JSON.stringify(temp0, mapReplacer, 2));

Вставляем все из буфера обмена в файл xlsData/xslParsedDump.json

2. == Скачивание файла через браузер ==

Убрать комментарий в файле App.vue
Строки
//import { handleExcelImport } from './services/excelParser';
//await handleExcelImport();

Найти скачанный файл xslParsedDump.json в папке Загрузки и скопировать его в папку src/xlsData

Добавить комментарий на строки парсинга в файле App.vue
*/

// Флаг защиты вне функции чтобы файл скачался 1 раз
let isAlreadyImported = false;

/**
 * Загружает и парсит Excel-файл по указанному URL.
 * Для парсинга из Excel nребуется библиотека xlsx (SheetJS), доступная глобально через окно или модули.
 * 
 * @param {string} url - Ссылка на xlsx файл
 * @returns {Promise<{itemsMap: Map, groupsResult: Array, stepsList: Array, questionsMap: Map}>}
 */
async function parseXlsxData(url) {
  // 1. Загрузка файла и преобразование в ArrayBuffer
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  
  // Чтение воркбука (библиотека xlsx / SheetJS)
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // --- ПАРСИНГ ТОВАРОВ (Sheet 'products') ---
  const itemsSheet = workbook.Sheets['products'];
  if (!itemsSheet) throw new Error('No products found in list');
  
  const itemsData = XLSX.utils.sheet_to_json(itemsSheet, { header: 'A' });
  if (!itemsData.length || !Object.keys(itemsData[0]).length) {
    throw new Error('Products list is empty');
  }

  const itemsMap = new Map();
  const [itemsNamesArr, ...itemsRestArr] = itemsData;

  for (const key in itemsNamesArr) {
    if (itemsNamesArr[key]) {
      const obj = itemsRestArr.reduce((acc, item) => {
        if (item['A']) acc[item['A']] = item[key] || null;
        return acc;
      }, {});
      itemsMap.set(String(itemsNamesArr[key]), obj);
    }
  }

  // --- ПАРСИНГ ГРУПП (Sheet 'groups') ---
  const groupsSheet = workbook.Sheets['groups'];
  const groupsResult = [];

  if (groupsSheet) {
    const groupsData = XLSX.utils.sheet_to_json(groupsSheet, { header: 'A' });
    if (groupsData.length && Object.keys(groupsData[0]).length) {
      const [groupsNamesArr, ...groupsRestArr] = groupsData;
      
      for (const key in groupsNamesArr) {
        if (groupsNamesArr[key]) {
          const obj = groupsRestArr.reduce((acc, item) => {
            if (item['A']) {
              acc[item['A']] = item[key] || null;
            }
            return acc;
          }, { name: String(groupsNamesArr[key]) });
          groupsResult.push(obj);
        }
      }
    }
  }

  // --- ОПРЕДЕЛЕНИЕ ШАГОВ (Имена остальных листов) ---
  const stepsList = workbook.SheetNames.filter((sheetName) =>
    sheetName !== 'products' && sheetName !== 'groups' && sheetName !== 'zodiac'
  );

  // --- ПАРСИНГ ВОПРОСОВ И БЛОКОВ (Все остальные листы) ---
  // Копируем объект листов, чтобы удалить служебные перед циклом
  const questionsData = { ...workbook.Sheets };
  delete questionsData['products'];
  delete questionsData['groups'];
  delete questionsData['zodiac']; // Исключаем zodiac, как в фильтре stepsList

  const questionsMap = new Map();

  for (const sheet in questionsData) {
    const sheetData = XLSX.utils.sheet_to_json(questionsData[sheet], { header: 'A' });
    if (!sheetData.length) continue;

    const itemsXLSXMap = sheetData[0];
    const stepObj = {
      stepTitle: sheetData[0]['A'] ? String(sheetData[0]['A']) : null,
      blocks: new Map(),
    };

    for (let i = 1; i < sheetData.length; i++) {
      const possibleBlockName = sheetData[i]['A'];
      
      if (i === 1 && !possibleBlockName) {
        stepObj.blocks.set('', { questions: new Map() });
        continue;
      }

      if (possibleBlockName) {
        stepObj.blocks.set(String(possibleBlockName), { questions: new Map() });
      } else {
        const question = sheetData[i]['B'];
        if (question) {
          const lastKey = [...stepObj.blocks.keys()].pop();
          if (!lastKey && lastKey !== '') continue;

          // Глубокое копирование строки данных через structuredClone
          const valuesObj = structuredClone(sheetData[i]);
          delete valuesObj['B'];
          delete valuesObj['A']; // Удаляем пустую ячейку колонки А

          const parsedValuesObj = {};
          for (const key in valuesObj) {
            const itemName = String(itemsXLSXMap[key]);
            parsedValuesObj[itemName] = isNaN(Number(valuesObj[key])) ? 0 : Number(valuesObj[key]);
          }

          stepObj.blocks.get(lastKey).questions.set(String(question), {
            answer: null,
            values: parsedValuesObj,
          });
        }
      }
    }
    questionsMap.set(sheet, stepObj);
  }

  // Возвращаем все распарсенные структуры данных
  return {
    itemsList: itemsMap,
    groupsList: groupsResult,
    stepsList: stepsList,
    questions: questionsMap
  };
}

// Функция замены Map в объекты
function mapReplacer(key, value) {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

// Функция обработки экспорта 
export async function handleExcelImport() {

  // Если функция уже выполнялась — сразу return, ничего не скачивая повторно
  if (isAlreadyImported) return; 

  try {

    isAlreadyImported = true; // Блокируем последующие вызовы

    console.log('Начало загрузки и парсинга файла...');

    const url = appConfig.xlsxUrl;
    
    // Вызов функции парсинга
    const parsedData = await parseXlsxData(url);
    
    console.log('Парсинг успешно завершен!');

    // ---- СОХРАНЕНИЕ В JSON ----

    // 1. == Вручную ==
    // Вывод всего объект парсинга в консоль для ручного копирования в файл json
    //console.log('RAW_PARSED_DATA:', parsedData);

    // 2. == Скачивание файла через браузер ==
    // Превращаем данные в JSON-строку с отступами в 2 пробела
    const jsonString = JSON.stringify(parsedData, mapReplacer, 2);

    // Создаем Blob-объект (виртуальный текстовый файл в памяти браузера)
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Создаем временную невидимую ссылку на скачивание
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'xlsParsedDump.json'; // Имя файла при скачивании
    
    // Программно кликаем по ней и удаляем ее из памяти
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log('Файл сгенерирован и отправлен на скачивание.');
    
    return parsedData;

  } catch (error) {

    isAlreadyImported = false; // В случае ошибки сбрасываем флаг

    // Отлов любых ошибок: сетевых, отсутствия листов или неверного формата данных
    console.error('Произошла ошибка при обработке Excel-файла:', error.message);
    
    return false;
  }
}