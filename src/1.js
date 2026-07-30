<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { appConfig } from './config'
import parsedData from './xlsData/xlsParsedDump.json';

const formRef = ref(null);
const currentStep = ref(localStorage.getItem('currentStep') || 'personal');

watch(currentStep, (newStep) => {
  if (newStep !== 'results') {
    localStorage.setItem('currentStep', newStep);
  }
});

// Восстановление согласий
const personalDataIsAccepted = ref(localStorage.getItem('personalDataIsAccepted') === 'true');
const privacyPolicyIsAccepted = ref(localStorage.getItem('privacyPolicyIsAccepted') === 'true');
watch(personalDataIsAccepted, (newValue) => localStorage.setItem('personalDataIsAccepted', newValue));
watch(privacyPolicyIsAccepted, (newValue) => localStorage.setItem('privacyPolicyIsAccepted', newValue));

// Активная вкладка
const activeTabId = ref(Number(localStorage.getItem('activeTabId')) || 1);
watch(activeTabId, (newId) => localStorage.setItem('activeTabId', newId));

// Данные API заказа
const orderData = ref(null)
const orderLoading = ref(true)
const orderError = ref(null)

// Хранилище localStorage для выбранных симптомов (ОСТАВЛЯЕМ ПЛОСКИМ)
const getSavedSymptoms = () => {
  try {
    const saved = localStorage.getItem('selectedSymptoms');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Ошибка чтения выбранных симптомов из кэша', e);
    return {};
  }
};
const selectedSymptoms = reactive(getSavedSymptoms());

// Объект результатов для передачи на сервер
const results = ref({})
const expanded = ref([]);

// Правила валидации Vuetify
const rules = {
  required: v => !!v || 'Это поле обязательно для заполнения',
  name: v => (v && v.length >= 3 && v.length <= 50) || 'Поле должно быть от 3 до 50 символов',
  email: v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Введен некорректный E-mail',
  checkbox: v => !!v || 'Необходимо ваше согласие'
};

// Персональные данные
const getSavedPersonalData = () => {
  const defaultData = { firstName: '', lastName: '', email: '', dateOfBirth: '' };
  try {
    const saved = localStorage.getItem('personalData');
    return saved ? JSON.parse(saved) : defaultData;
  } catch (e) {
    console.error('Ошибка чтения персональных данных из кэша', e);
    return defaultData;
  }
};
const personalData = reactive(getSavedPersonalData());

async function personalDataStepNext() {
  if (!formRef.value) return;
  const { valid } = await formRef.value.validate();
  if (valid && orderData.value?.status) {
    currentStep.value = 'questions';
  }
}

// Данные API результатов
const resultsData = ref(null)
const resultsLoading = ref(true)
const resultsError = ref(null)

const fetchResultsData = async () => {
  const orderToken = localStorage.getItem('orderToken');
  const url = `${appConfig.apiEndpoint}/wp-json/myplugin/v1/authors-fbq/${orderId}?token=${orderToken}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results.value)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    resultsData.value = await response.json();
  } catch (err) {
    resultsError.value = err.message;
    console.error(resultsError.value);
  } finally {
    resultsLoading.value = false;
  }
};

function questionStepBack() {
  currentStep.value = 'personal';
}

// 🧠 ОПТИМИЗИРОВАННЫЙ ШАГ ВПЕРЕД И АЛГОРИТМ ПОДСЧЕТА БАЛЛОВ
function questionStepNext() {
  currentStep.value = 'results';

  // 1. Формируем структурированные симптомы ОДИН РАЗ здесь, а не в computed!
  const structuredSymptoms = items.value
    .map(item => {
      const sections = item.groups
        .map(group => {
          const checked = group.checkboxes.filter(checkbox => !!selectedSymptoms[checkbox]);
          return { title: group.title, checked: checked };
        })
        .filter(section => section.checked.length > 0);
      return { title: item.title, sections: sections };
    })
    .filter(item => item.sections.length > 0);

  // 2. Сборка объекта для сервера
  results.value.token = orderData.value?.token;
  results.value.customer = { ...personalData };
  results.value.checkboxes = structuredSymptoms;

  // 3. 📊 АЛГОРИТМ ПОДСЧЕТА БАЛЛОВ ДЛЯ СОЛЕЙ
  const scoreMap = {};

  // Проходим по всей исходной структуре вопросов из JSON
  for (const stepData of Object.values(parsedData.questions)) {
    if (!stepData.blocks) continue;
    for (const blockData of Object.values(stepData.blocks)) {
      if (!blockData.questions) continue;
      
      for (const [questionText, questionObj] of Object.entries(blockData.questions)) {
        // Если пользователь отметил этот симптом
        if (selectedSymptoms[questionText.trim()]) {
          // Суммируем баллы солей, зашитых в эту ячейку
          if (questionObj.values) {
            for (const [saltName, score] of Object.entries(questionObj.values)) {
              scoreMap[saltName] = (scoreMap[saltName] || 0) + score;
            }
          }
        }
      }
    }
  }

  // 4. Сортируем полученные результаты по убыванию баллов
  const sortedSalts = Object.entries(scoreMap)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  console.log('РЕЗУЛЬТАТЫ ПОДСЧЕТА БАЛЛОВ СОЛЕЙ:', sortedSalts);

  // 5. Выбираем из itemsList продукты на основе подсчитанных лидеров
  // Разделяем на группы согласно структуре вашего JSON (group 1 — основные, group 2 — доп, group 3 — комплексные)
  const pickedResults = [];
  
  // Ищем ТОП-3 основных солей (Group 1)
  const mainSalts = sortedSalts
    .filter(s => parsedData.itemsList[s.name]?.group === 1)
    .slice(0, 3);

  // Ищем 1 дополнительную соль (Group 2)
  const additionalSalt = sortedSalts
    .find(s => parsedData.itemsList[s.name]?.group === 2);

  // Ищем 1 комплексное средство (Group 3)
  const complexSalt = sortedSalts
    .find(s => parsedData.itemsList[s.name]?.group === 3);

  // Собираем массив объектов для вывода на экран результатов
  const finalPicks = [...mainSalts];
  if (additionalSalt) finalPicks.push(additionalSalt);
  if (complexSalt) finalPicks.push(complexSalt);

  finalPicks.forEach(salt => {
    const productInfo = parsedData.itemsList[salt.name];
    if (productInfo) {
      pickedResults.push({
        salt: salt.name,
        group: String(productInfo.group),
        img: productInfo.img || '',
        description: productInfo.description || '',
        long_description: productInfo.long_description || '',
        composition: productInfo.composition || '',
        prescription_14: productInfo.prescription_14 || '',
        prescription_8: productInfo.prescription_8 || '',
        prescription_2: productInfo.prescription_2 || '',
        prescription_0: productInfo.prescription_0 || ''
      });
    }
  });

  results.value.results = pickedResults;

  // Отправка данных на сервер
  fetchResultsData()

  // Очистка кэша
  localStorage.clear()
  Object.keys(selectedSymptoms).forEach(key => delete selectedSymptoms[key]);
  personalData.firstName = '';
  personalData.lastName = '';
  personalData.email = '';
  personalData.dateOfBirth = '';
  personalDataIsAccepted.value = false;
  privacyPolicyIsAccepted.value = false;
  activeTabId.value = 1;
}

// Преобразование данных JSON
function transformJsonData(questionsDataObj) {
  if (!questionsDataObj) return [];
  const result = [];
  let globalId = 1;
  for (const [sheetName, stepData] of Object.entries(questionsDataObj)) {
    const stepObj = {
      title: sheetName, 
      id: globalId++,
      active: result.length === 0, 
      groupsTitle: stepData.stepTitle || '', 
      groups: []
    };
    if (stepData.blocks) {
      for (const [blockName, blockData] of Object.entries(stepData.blocks)) {
        const checkboxes = [];
        if (blockData.questions) {
          for (const questionText of Object.keys(blockData.questions)) {
            checkboxes.push(questionText.trim());
          }
        }
        if (checkboxes.length > 0) {
          stepObj.groups.push({
            id: globalId++,
            title: blockName, 
            checkboxes: checkboxes
          });
        }
      }
    }
    if (stepObj.groups.length > 0) {
      result.push(stepObj);
    }
  }
  return result;
}

const items = ref([])
items.value = transformJsonData(parsedData.questions)

const filteredItem = computed(() => {
  return items.value.find((t) => t.id === activeTabId.value) || items.value[0];
});

const isPersonalDataStepNextBtnDisabled = computed(() => {
  if (orderLoading.value || orderError.value || !orderData.value?.status) return true;
  const hasEmptyFields = !personalData.firstName || !personalData.lastName || !personalData.email || !personalData.dateOfBirth;
  const hasNoAgreements = !personalDataIsAccepted.value || !privacyPolicyIsAccepted.value;
  return hasEmptyFields || hasNoAgreements;
});

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('d');

const fetchOrderData = async () => {
  if (!orderId) {
    orderLoading.value = false;
    return;
  }
  const url = `${appConfig.apiEndpoint}/wp-json/myplugin/v1/posts/${orderId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    orderData.value = await response.json();
    localStorage.setItem('orderToken', orderData.value.token);
  } catch (err) {
    orderError.value = err.message;
    console.error(orderError.value);
  } finally {
    orderLoading.value = false;
  }
};

onMounted(async () => {
  if (filteredItem.value) {
    expanded.value = filteredItem.value.groups.map((_, index) => index);
  }
  await fetchOrderData();
});

function questionList(item) {
  activeTabId.value = item.id;
  expanded.value = item.groups.map((_, index) => index);
}

function windowPrint() {
  window.print()
}

// УПРОЩЕННЫЙ ОПТИМИЗИРОВАННЫЙ WATCH (НЕ ТРОГАЕТ СТРУКТУРУ)

watch(selectedSymptoms,(newSymptoms) => {localStorage.setItem('selectedSymptoms', JSON.stringify(newSymptoms));},{ deep: true });watch(personalData,(newData) => {localStorage.setItem('personalData', JSON.stringify(newData));},{ deep: true });