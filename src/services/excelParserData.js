// Парсинг данных из xls
  //const xlsData = ref(new Map());

const isLoadingXlsData = ref(false);

async function handleExcelImport(fileUrl) {
try {
    console.log('Начало загрузки и парсинга файла...');
    
    // Вызов основной функции парсинга
    const parsedData = await parseXlsxData(fileUrl);
    
    console.log('Парсинг успешно завершен!', parsedData);
    
    // Здесь вы можете записать данные в реактивные переменные Vue
    // Например: 
    // this.itemsList = parsedData.itemsList; (Vue 2)
    // itemsList.value = parsedData.itemsList;
    //xlsData.value = parsedData.itemsList
    //console.log(xlsData.value)
    
    return parsedData;

} catch (error) {
    // Отлов любых ошибок: сетевых, отсутствия листов или неверного формата данных
    console.error('Произошла ошибка при обработке Excel-файла:', error.message);
    
    // Здесь можно вывести уведомление для пользователя (ui-toast, alert и т.д.)
    alert(`Ошибка импорта: ${error.message}`);
    
    // Возвращаем null или пробрасываем ошибку дальше в зависимости от логики приложения
    return null; 
}
}

async function loadXlsData() {
isLoadingXlsData.value = true;

const result = await handleExcelImport('/table_schuessler_salts_calc.xlsx');

if (result && result.questions) {

//const rawItems = transformQuestionsData(result.questions);

// Трансформируем Map из result.questions в ваш формат массива
//items.value = transformQuestionsData(result.questions);

//items.value = Object.freeze(rawItems);
// ВРЕМЕННО: Выводим весь сырой объект парсинга в консоль
console.log('RAW_PARSED_DATA:', result); 

console.log('Данные успешно трансформированы:', items.value);
}

isLoadingXlsData.value = false;
}

// Запуск загрузки
loadXlsData();



/* === Инструкция === */
/*
Чтобы каждый раз не парсить данные из Эксель файла, парсим их один раз и весь вывод сохраняем в файле json
Импортируем этот json файл в проект. Все данные будут в виде обычных объектов и массивов

Скопируйте данные через консоль браузера
Откройте страницу вашего проекта в браузере.
Откройте панель разработчика (F12 или правая кнопка мыши -> Посмотреть код) и перейдите на вкладку Console (Консоль).
Обновите страницу (F5), чтобы сработал парсинг.
Вы увидите строку лога RAW_PARSED_DATA:. 
Нажмите на нее правой кнопкой мыши и выберите пункт Store as global variable (Сохранить как глобальную переменную).
Браузер автоматически создаст переменную с именем temp1 (или temp2), содержащую этот объект.
Вставьте в самую нижнюю строку консоли следующий скрипт и нажмите Enter:

// Функция преобразует Map в объекты, чтобы JSON их не стёр
function mapReplacer(key, value) {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

// Команда копирует весь объект, правильно разворачивая внутренние Map
copy(JSON.stringify(temp1, mapReplacer, 2));

Вставляем все из буфера обмена в файл xslData/xslParsedDump.json
*/