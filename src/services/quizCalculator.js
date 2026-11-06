import { getZodiacSign } from "../utils/_getZodiacSign";
import { getAge } from "../utils/_getAge";

/**
 * Определяет ключ дозировки в зависимости от возраста
 */
export function getPrescriptionKey(dateOfBirth) {
  if (!dateOfBirth) return 'prescription_14';
  const age = getAge(dateOfBirth);
  if (age > 14) return 'prescription_14';
  if (age > 8) return 'prescription_8';
  if (age > 2) return 'prescription_2';
  return 'prescription_0';
}

/**
 * Основная функция расчета результатов на основе выбранных симптомов
 */
export function calculateQuizResults(parsedData, selectedSymptoms, personalData, defaultItemsCount = 3) {
  if (!parsedData || !parsedData.itemsList) return [];

  // 1. Копируем массив солей со стартовым счетом 0
  const itemsWithScores = Object.entries(parsedData.itemsList).map(([itemName, itemData]) => ({
    ...itemData,
    name: itemName,
    score: 0
  }));

  // 2. Учет знака зодиака (скрытый фоновый шаг)
  if (parsedData.questions && parsedData.questions['zodiac'] && personalData.dateOfBirth) {
    const birthDateObject = new Date(personalData.dateOfBirth);
    const userZodiac = getZodiacSign(birthDateObject);
    
    for (const blockData of Object.values(parsedData.questions['zodiac'].blocks)) {
      if (blockData.questions && blockData.questions[userZodiac]) {
        const zodiacValues = blockData.questions[userZodiac].values || {};
        Object.entries(zodiacValues).forEach(([saltName, value]) => {
          const salt = itemsWithScores.find(s => s.name === saltName);
          if (salt) salt.score += Number(value);
        });
      }
    }
  }

  // 3. Подсчет баллов по отмеченным в UI симптомам
  Object.keys(selectedSymptoms).forEach((symptomName) => {
    if (selectedSymptoms[symptomName] === true) {
      for (const stepData of Object.values(parsedData.questions)) {
        for (const blockData of Object.values(stepData.blocks)) {
          if (blockData.questions && blockData.questions[symptomName]) {
            const weights = blockData.questions[symptomName].values || {};
            Object.entries(weights).forEach(([saltName, value]) => {
              const salt = itemsWithScores.find(s => s.name === saltName);
              if (salt) salt.score += Number(value);
            });
          }
        }
      }
    }
  });

  // 4. Фильтрация (только score > 0) и группировка по group
  const groupsMap = {};
  itemsWithScores.forEach((salt) => {
    if (salt.score > 0) {
      const gId = String(salt.group);
      if (!groupsMap[gId]) groupsMap[gId] = [];
      groupsMap[gId].push(salt);
    }
  });

  // 5. Применение лимитов (count) из конфигурации групп Excel
  const finalSelection = [];
  
  Object.entries(groupsMap).forEach(([groupId, salts]) => {
    const sorted = [...salts].sort((a, b) => b.score - a.score);
    const groupConf = parsedData.groupsList.find(g => String(g.name) === groupId);
    const limit = groupConf ? groupConf.count : defaultItemsCount;

    const limited = sorted.slice(0, limit);
    
    limited.forEach(salt => {
      finalSelection.push({
        ...salt,
        salt: salt.name, // Маппинг под ожидания твоего бэкенда WP
        group: String(salt.group)
      });
    });
  });

  return finalSelection;
}
