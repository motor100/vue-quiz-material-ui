import * as XLSX from 'xlsx';

/**
 * Загружает и парсит Excel-файл по указанному URL.
 * Требуется библиотека xlsx (SheetJS), доступная глобально через окно или модули.
 * @param {string} url - Ссылка на xlsx файл
 * @returns {Promise<{itemsMap: Map, groupsResult: Array, stepsList: Array, questionsMap: Map}>}
 */
export async function parseXlsxData(url) {
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

// Функия преобразования под данных из xls под мой формат
export function transformQuestionsData(questionsMap) {
  const result = [];
  let globalId = 1; // Сквозной счетчик ID для шагов и групп

  // Проходим по всем листам (Шагам) в Map
  for (const [sheetName, stepData] of questionsMap.entries()) {
    const stepObj = {
      // Используем stepTitle из данных, если пустой — берем имя листа
      title: stepData.stepTitle || sheetName, 
      id: globalId++,
      // Делаем первый элемент активным (true), остальные скрытыми (false)
      active: result.length === 0, 
      groupsTitle: '', // Свойство из вашего формата (можно оставить пустым или заполнить)
      groups: []
    };

    // Проходим по всем блокам (Группам) внутри шага
    for (const [blockName, blockData] of stepData.blocks.entries()) {
      const checkboxes = [];

      // Собираем все вопросы (строки) блока в массив строк для checkboxes
      for (const questionText of blockData.questions.keys()) {
        checkboxes.push(questionText);
      }

      stepObj.groups.push({
        id: globalId++,
        title: blockName, // Название блока из Excel (A)
        checkboxes: checkboxes
      });
    }

    result.push(stepObj);
  }

  return result;
}