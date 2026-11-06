<script setup>
  import { reactive, ref, computed, onMounted, watch } from 'vue';
  import { appConfig } from './config'
  import { GENERAL_PRESCRIPTION_TEXT } from './constants/prescriptionInstruction';
  import { calculateQuizResults, getPrescriptionKey } from './services/quizCalculator';

  // Асинхронная ленивая загрузка тяжелого дампа данных
  const loadQuizData = async () => {
    try {
      // Динамический импорт: Webpack/Vite вынесет этот JSON в отдельный чанк (файл)
      const module = await import('./xlsData/xlsParsedDump.json');
      parsedData.value = module.default;
      
      // Как только данные прилетели — трансформируем их для интерфейса
      items.value = transformJsonData(parsedData.value.questions);
    } catch (e) {
      console.error('Не удалось динамически загрузить дамп вопросов квиза:', e);
    }
  };

  // Убрать комментарий для парсинга из файла Excel
  //import { handleExcelImport } from './services/excelParser';
  //await handleExcelImport();

  // Сохраняем и восстанавливаем текущий шаг, чтобы пользователь не начинал сначала
  // Состояния: 'personal' | 'questions' | 'results'
  const currentStep = ref(localStorage.getItem('currentStep') || 'personal');

  // Сохраняем и восстанавливаем текущий шаг. На шаге 'results' удаляем из LS
  watch(currentStep, (newStep) => {
    if (newStep === 'results') {
      localStorage.removeItem('currentStep');
    } else {
      localStorage.setItem('currentStep', newStep);
    }
  });

  // Чекбоксы согласий персональных данных и политики конфиденциальности
  // Восстановление согласий
  const personalDataIsAccepted = ref(localStorage.getItem('personalDataIsAccepted') === 'true');
  const privacyPolicyIsAccepted = ref(localStorage.getItem('privacyPolicyIsAccepted') === 'true');

  watch(personalDataIsAccepted, (newValue) => localStorage.setItem('personalDataIsAccepted', newValue));
  watch(privacyPolicyIsAccepted, (newValue) => localStorage.setItem('privacyPolicyIsAccepted', newValue));

  // Сохраняем активную вкладку вопросов, если пользователь перезагрузил страницу на шаге 'questions'
  const activeTabId = ref(Number(localStorage.getItem('activeTabId')) || 1); // Активный ID = 1 вкладки вопросов
  watch(activeTabId, (newId) => localStorage.setItem('activeTabId', newId));

  // Данные API заказа
  const orderData = ref(null)
  const orderLoading = ref(true)
  const orderError = ref(null)

  // Хранилище localStorage для выбранных симптомов
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

  // Объект для хранения ошибок валидации полей формы
  const errors = reactive({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: ''
  });

  // Регулярное выражение для базовой проверки формата Email
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

  // Нативная функция валидации всей формы
  function validateForm() {
    let isValid = true;

    // Валидация Имени
    if (!personalData.firstName) {
      errors.firstName = 'Это поле обязательно для заполнения';
      isValid = false;
    } else if (personalData.firstName.length < 3 || personalData.firstName.length > 50) {
      errors.firstName = 'Поле должно быть от 3 до 50 символов';
      isValid = false;
    } else {
      errors.firstName = '';
    }

    // Валидация Фамилии
    if (!personalData.lastName) {
      errors.lastName = 'Это поле обязательно для заполнения';
      isValid = false;
    } else if (personalData.lastName.length < 3 || personalData.lastName.length > 50) {
      errors.lastName = 'Поле должно быть от 3 до 50 символов';
      isValid = false;
    } else {
      errors.lastName = '';
    }

    // Валидация Email
    if (!personalData.email) {
      errors.email = 'Это поле обязательно для заполнения';
      isValid = false;
    } else if (!emailRegex.test(personalData.email)) {
      errors.email = 'Введен некорректный E-mail';
      isValid = false;
    } else {
      errors.email = '';
    }

    // Валидация Даты рождения
    if (!personalData.dateOfBirth) {
      errors.dateOfBirth = 'Это поле обязательно для заполнения';
      isValid = false;
    } else {
      errors.dateOfBirth = '';
    }

    return isValid;
  }

  // Персональные данные
  const getSavedPersonalData = () => {
    const defaultData = { 
      firstName: '', 
      lastName: '', 
      email: '', 
      dateOfBirth: '' 
    }

    try {
      const saved = localStorage.getItem('personalData');
      return saved ? JSON.parse(saved) : defaultData;
    } catch (e) {
      console.error('Ошибка чтения персональных данных из кэша', e);
      return defaultData;
    }
  };

  const personalData = reactive(getSavedPersonalData());

  // Клик по кнопке "Продолжить" на шаге персональных данных
  async function personalDataStepNext() {
    // Вызываем нашу нативную валидацию
    const valid = validateForm();
    
    // Проверяем валидность полей И наличие обоих согласий И статус заказа
    if (valid && privacyPolicyIsAccepted.value && personalDataIsAccepted.value && orderData.value?.status) {
      currentStep.value = 'questions';
    }
  }  

  // Данные API результатов
  const resultsData = ref(null)
  const resultsLoading = ref(true)
  const resultsError = ref(null)

  // Запрос на сервер для проверки номера заказа
  const fetchResultsData = async () => {

    const orderToken = localStorage.getItem('orderToken');

    const url = `${appConfig.apiEndpoint}/wp-json/myplugin/v1/authors-fbq/${orderId}?token=${orderToken}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },

        // Отправляем данные в теле запроса в виде JSON
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

  // Переключение шагов навигации
  // Шаг вопросов назад к шагу персональных данных
  function questionStepBack() {
    currentStep.value = 'personal';
  }
  
  // Реактивный ключ дозировки на основе даты рождения
  const currentPrescriptionKey = computed(() => getPrescriptionKey(personalData.dateOfBirth));

  // Динамический расчет результатов (работает с распакованным асинхронным parsedData.value)
  const calculatedResultsList = computed(() => {
    if (!parsedData.value) return [];
    return calculateQuizResults(parsedData.value, selectedSymptoms, personalData, appConfig.defaultItemsCount);
  });

  // Шаг вопросов вперед к шагу результатов
  function questionStepNext() {
    currentStep.value = 'results';

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

    // Сборка объекта с результатами для отправки на сервер
    results.value.token = orderData.value.token;
    results.value.customer = { ...personalData };
    results.value.checkboxes = structuredSymptoms;
    
    // Передаем рассчитанный массив солей в объект результатов
    results.value.results = calculatedResultsList.value;

    // Отправка данных на сервер
    fetchResultsData();

    // Полная очистка кэша ответов для нового прохождения квиза
    localStorage.clear();

    // Сброс реактивных состояний формы
    Object.keys(selectedSymptoms).forEach(key => delete selectedSymptoms[key]);
    personalData.firstName = '';
    personalData.lastName = '';
    personalData.email = '';
    personalData.dateOfBirth = '';
    personalDataIsAccepted.value = false;
    privacyPolicyIsAccepted.value = false;
    activeTabId.value = 1;
  }

  // Преобразование данных JSON из parsedData.questions в формат для интерфейса
  /*
  function transformJsonData(questionsDataObj) {
    if (!questionsDataObj) return [];
    
    const result = [];
    let globalId = 1; // Сквозной счетчик ID для уникальных key в v-for

    // 1. Проходим по всем Листам (Шагам) в JSON
    for (const [sheetName, stepData] of Object.entries(questionsDataObj)) {
      const stepObj = {
        // Берём красивый stepTitle из Excel, если его нет — имя листа
        title: sheetName , 
        id: globalId++,
        // Первую вкладку делаем активной по умолчанию
        active: result.length === 0, 
        groupsTitle: stepData.stepTitle || '', // Заголовок над блоками симптомов
        groups: []
      };

      // Проверяем, есть ли блоки в этом шаге
      if (stepData.blocks) {
        // 2. Проходим по всем Блокам (Группам симптомов) внутри шага
        for (const [blockName, blockData] of Object.entries(stepData.blocks)) {
          const checkboxes = [];

          // Проверяем наличие вопросов
          if (blockData.questions) {
            // 3. Собираем только КЛЮЧИ (текст симптомов) из объекта questions
            // Сами баллы (values) нам на этапе рендеринга чекбоксов не нужны
            for (const questionText of Object.keys(blockData.questions)) {
              checkboxes.push(questionText.trim()); // trim() уберет случайные пробелы на концах
            }
          }

          // Добавляем сформированную группу в шаг, только если в ней есть чекбоксы
          if (checkboxes.length > 0) {
            stepObj.groups.push({
              id: globalId++,
              title: blockName, // Название блока (например, "Низкий уровень энергии")
              checkboxes: checkboxes
            });
          }
        }
      }

      // Добавляем шаг в общий результат, если у него появились группы
      if (stepObj.groups.length > 0) {
        result.push(stepObj);
      }
    }

    return result;
  }
  */

  // Объявляем реактивные переменные для асинхронных данных
  const parsedData = ref(null);
  const items = ref([]);

  // Вычисляем активный элемент на основе activeTabId
  const filteredItem = computed(() => {
    return items.value.find((t) => t.id === activeTabId.value) || items.value[0];
  });

  // Динамическое управление блокировкой кнопки "Продолжить" на шаге персональных данных
  const isPersonalDataStepNextBtnDisabled = computed(() => {

    // Кнопка заблокирована, если данные заказа еще загружаются или пришла ошибка
    if (orderLoading.value || orderError.value || !orderData.value?.status) {
      return true;
    }

    // Кнопка заблокирована, если обязательные поля формы пусты или чекбоксы не отмечены
    const hasEmptyFields = !personalData.firstName || !personalData.lastName || !personalData.email || !personalData.dateOfBirth;
    const hasNoAgreements = !personalDataIsAccepted.value || !privacyPolicyIsAccepted.value;

    return hasEmptyFields || hasNoAgreements;
  });

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('d');

  // Запрос на сервер для проверки номера заказа
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

      // Добавляб токен в LS
      localStorage.setItem('orderToken', orderData.value.token);
    } catch (err) {
      orderError.value = err.message;
      console.error(orderError.value);
    } finally {
      orderLoading.value = false;
    }
  };

  // Инициализация при монтировании компонента
  onMounted(async () => {
    await fetchOrderData();

    // Загружаем тяжелый JSON параллельно в фоновом режиме, не блокируя UI формы
    await loadQuizData();
  });

  // Переключение вкладок вопросов
  function questionList(item) {
    activeTabId.value = item.id;
  }

  // Печать страницы
  function windowPrint() {
    window.print()
  }

  // Отслеживание изменений симптомов при каждом клике на чекбокс данные пишутся в localStorage
  watch(
    selectedSymptoms,
    (newSymptoms) => {
      localStorage.setItem('selectedSymptoms', JSON.stringify(newSymptoms));
    },
    { deep: true }
  );
  
  // Отслеживание изменений персональных данных для записи в localStorage
  watch(
    personalData,
    (newData) => {
      localStorage.setItem('personalData', JSON.stringify(newData));
    },
    { deep: true }
  );

</script>

<template>
  <div class="app-wrapper">
    <main class="main-content">

      <div v-if="orderError" class="alert-error-native">
        <span class="alert-icon-native">⚠️</span>
        <div class="alert-text-native">Ошибка загрузки данных заказа</div>
      </div>

      <div class="container-native"  v-if="currentStep === 'personal'">

        <h4 class="main-title">Подберите наилучшие варианты цветы !</h4>
        <div class="elevation-2 rounded-lg pa-4 bg-white">
          <p>Вы приступаете к автоматизированному подбору солей  для проведения тканевой биохимической терапии. Вам понадобится 20-40 минут свободного времени и зеркало. Постарайтесь сосредоточиться на Вашей текущей проблеме. Отмечайте только те пункты, которые относятся к Вашему текущему состоянию. Не старайтесь собрать все симптомы, которые когда либо были у Вас, отмечайте только актуальные на сегодняшний день. Если Вы выбираете цветы  для конкретной проблемы пропускайте все блоки, кроме необходимого. По результатам теста Вам будет подобрана комбинация 3 основных солей , одной дополнительной и одной комплексной для длительного применения (если есть показания). Полученные рекомендации не являются назначениями. Любое заболевание требует консультации врача.</p>

          <form @submit.prevent="personalDataStepNext">
            <!-- Имя -->
            <div class="form-group" :class="{ 'form-group--error': errors.firstName }">
              <label for="firstName">Имя<span class="text-red">*</span></label>
              <input
                id="firstName"
                type="text"
                class="input-native"
                v-model="personalData.firstName"
                autocomplete="on"
                required
              />
              <span v-if="errors.firstName" class="error-text-native">{{ errors.firstName }}</span>
            </div>

            <!-- Фамилия -->
            <div class="form-group" :class="{ 'form-group--error': errors.lastName }">
              <label for="lastName">Фамилия<span class="text-red">*</span></label>
              <input 
                id="lastName"
                type="text"
                class="input-native"
                v-model="personalData.lastName"
                autocomplete="on"
                required
              />
              <span v-if="errors.lastName" class="error-text-native">{{ errors.lastName }}</span>
            </div>

            <!-- Электронная почта -->
            <div class="form-group" :class="{ 'form-group--error': errors.email }">
              <label for="email">Электронная почта<span class="text-red">*</span></label>
              <input 
                id="email"
                type="email"
                class="input-native"
                v-model="personalData.email"
                autocomplete="on"
                required
              />
              <span v-if="errors.email" class="error-text-native">{{ errors.email }}</span>
            </div>

            <!-- Дата рождения -->
            <div class="form-group" :class="{ 'form-group--error': errors.dateOfBirth }">
              <label for="dateOfBirth">Дата рождения<span class="text-red">*</span></label>
              <input 
                id="dateOfBirth"
                type="date" 
                class="input-native"
                v-model="personalData.dateOfBirth"
                :max="new Date().toISOString().split('T')[0]" 
                autocomplete="on"
                required
              />
              <span v-if="errors.dateOfBirth" class="error-text-native">{{ errors.dateOfBirth }}</span>
            </div>

            <!-- Чекбокс политики конфиденциальности -->
            <div class="form-group-checkbox">
              <label class="fast-checkbox-label" :class="{ 'fast-checkbox-label--checked': privacyPolicyIsAccepted }">
                <input type="checkbox" v-model="privacyPolicyIsAccepted" class="fast-checkbox-input" />
                <span class="fast-checkbox-text">
                  Ознакомлен с <a :href="appConfig.privacyPolicyUrl" target="_blank" @click.stop>политикой конфиденциальности.</a>
                </span>
              </label>
            </div>

            <!-- Чекбокс обработки персональных данных -->
            <div class="form-group-checkbox">
              <label class="fast-checkbox-label" :class="{ 'fast-checkbox-label--checked': personalDataIsAccepted }">
                <input type="checkbox" v-model="personalDataIsAccepted" class="fast-checkbox-input" />
                <span class="fast-checkbox-text">
                  Согласен на <a :href="appConfig.personalDataAcceptanceUrl" target="_blank" @click.stop>обработку персональных данных.</a>
                </span>
              </label>
            </div>

            <div class="d-flex justify-end mt-3">
              <button type="submit" class="btn" :disabled="isPersonalDataStepNextBtnDisabled">
                Продолжить
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="container-native" v-if="currentStep === 'questions'">

        <!-- МОБИЛЬНАЯ НАВИГАЦИЯ: Горизонтальная лента вкладок (видимая только на мобильных) -->
        <nav class="mobile-tabs">
          <button 
            type="button" 
            @click="questionStepBack" 
            class="mobile-tab-btn"
          >
            Личные данные
          </button>
          <button
            v-for="item in items"
            :key="'mob-' + item.id"
            type="button"
            @click="questionList(item)"
            class="mobile-tab-btn"
            :class="{ 'mobile-tab-btn--active': item.id === activeTabId }"
          >
            {{ item.title }}
          </button>
        </nav>

        <div class="d-flex ga-4">
          <!-- ДЕСКТОПНАЯ НАВИГАЦИЯ: Боковая панель (скрытая на мобильных) -->
          <aside class="navbar hide-on-mobile">
            <ul class="nav-list">
              <li class="nav-list-item" @click="questionStepBack">
                Личная информация
              </li>
              <li
                v-for="item in items"
                :key="item.id"
                class="nav-list-item"
                :class="{ 'nav-list-item--active': item.id === activeTabId }"
                @click="questionList(item)"
              >
                {{ item.title }}
              </li>
            </ul>
          </aside>

          <div class="flex-grow-1">
            <div 
              class="title elevation-1 rounded-lg bg-white pl-6 pr-6 pb-3 pt-3 mb-2"
              v-if="filteredItem.groupsTitle"
            >
              {{ filteredItem.groupsTitle }}
            </div>
            
            <!-- Нативный html-аккордеон -->
            <div class="expansion-panels-native">
              <details
                v-for="item in filteredItem.groups" 
                :key="item.id"
                class="panel-native"
                open
              >
                <summary class="panel-summary-native">
                  {{ item.title }}
                  <span class="panel-icon-native"></span>
                </summary>
                <div class="panel-content-native">
                  <label 
                    v-for="checkbox in item.checkboxes" 
                    :key="checkbox"
                    class="fast-checkbox-label"
                    :class="{ 'fast-checkbox-label--checked': !!selectedSymptoms[checkbox] }"
                  >
                    <input 
                      type="checkbox" 
                      v-model="selectedSymptoms[checkbox]"
                      class="fast-checkbox-input"
                    />
                    <span class="fast-checkbox-text">{{ checkbox }}</span>
                  </label>
                </div>
              </details>
            </div>
          </div>
        </div>

        <div class="group-buttons d-flex justify-space-between mt-6">
          <button
            type="button"
            class="btn"
            @click="questionStepBack">
            Назад
          </button>
          <button
            type="button"
            class="btn"
            @click="questionStepNext">
            Далее
          </button>
        </div>
      </div>

      <div class="container-native" v-if="currentStep === 'results'">

    <h2 class="text-center">Вы прошли тестирование в экспертной программе по подбору цветов Баха для тканевой биохимической терапии</h2>
    <div class="disclaimer elevation-2 rounded-lg pa-4">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="red" class="flex-shrink-0">
        <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
      </svg>
      <span class="text">Внимание! Автоматизированный тест не является назначением врача. В случае проблем со здоровьем следует обращаться за квалифицированной медицинской помощью.</span>
    </div>
    <div class="your-result-text">Ваш результат:</div>

    <div class="panel-content-native">
      <!-- Выводим общий текст из констант -->
      <div class="required-text" style="white-space: pre-wrap;">
        {{ GENERAL_PRESCRIPTION_TEXT }}
      </div>

      <!-- Динамическое описание индивидуальных инструкций солей под возраст -->
      <div v-for="salt in results.results || []" :key="'presc-' + salt.salt">
        <p class="product-text" v-if="salt[currentPrescriptionKey]">
          {{ salt[currentPrescriptionKey] }}
        </p>
      </div>
    </div>

    <div class="rounded-lg ps-4 pt-1 pb-1 bg-white">
      <p>Рецепт на подобранные Цветы Баха направлен в аптеку NaturaPharma на ваши контактные данные</p>
      <p>Сайт аптеки: {{ appConfig.apiEndpoint }}</p>
      <p>Телефон: {{ appConfig.phone }}</p>
      <p>Email: {{ appConfig.email }}</p>
    </div>

    <div class="group-buttons d-flex justify-space-between mt-6">
      <a :href="appConfig.completeAgainUrl" class="btn">Пройти снова</a>
      <button class="btn" @click="windowPrint">Печать</button>
    </div>

    </main>
  </div>
</template>

<style scoped>
  .app-wrapper {
    background-color: #faf9ff;
  }
  .container-native {
    width: 100%;
    max-width: 1200px; /* или стандартный размер Vuetify */
    margin-right: auto;
    margin-left: auto;
    padding: 16px;
  }

  .v-main {
    margin-top: 30px;
    margin-bottom: 30px;
  }
  .color-red {
    color: red;
  }
  .btn {
    display: flex;
    height: 43px;
    padding: 0 16px;
    background: linear-gradient(90deg, rgb(48, 38, 85) 0%, rgb(137, 80, 112) 100%);
    color: white;
    border: none;
    text-decoration: none;
    border-radius: 4px;
    font-size: 16px;
    align-items: center;
    opacity: 1;
    transition: opacity .3s;
  }
  .btn:hover {
    opacity: .9;
  }
  .btn:disabled {
    opacity: 0.7;
    color: white;
  }
  .form-group {
    margin-bottom: 8px;
  }
  .main-title {
    padding-left: 16px;
    padding-right: 16px;
    font-weight: 400;
    line-height: 1.235;
    font-size: 26px;
  }

  .navbar {
    width: 370px;
    height: 100%;
    flex-shrink: 0;
  }

  /* Обертка-строка чекбокса */
  .fast-checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
    border: 1px solid transparent;
    user-select: none;
  }

  /* Эффект при наведении */
  .fast-checkbox-label:hover {
    background-color: #f0edf7;
  }

  /* Подсветка всей строки при выборе (опционально, для удобства) */
  .fast-checkbox-label--checked:hover {
    background-color: #c8e6c9;
  }

  /* Нативный инпут */
  .fast-checkbox-input {
    appearance: none;
    -webkit-appearance: none;
    width: 18px !important;
    height: 18px !important;
    border: 2px solid #757575;
    border-radius: 4px;
    outline: none;
    background-color: #fff;
    display: grid;
    place-content: center;
    flex-shrink: 0;
    margin-top: 2px;
    cursor: pointer;
    transition: 0.1s border-color, 0.1s background-color;
  }

  /* Состояние инпута при ховере */
  .fast-checkbox-input:hover {
    border-color: #4ca64c;
  }

  /* Состояние инпута при клике (активный) */
  .fast-checkbox-input:checked {
    border-color: #4caf50;
    background-color: #4caf50;
  }

  /* Рисуем галочку внутри через псевдоэлемент */
  .fast-checkbox-input::before {
    content: "";
    width: 10px;
    height: 6px;
    border-left: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(-45deg) scale(0);
    transition: 0.1s transform ease-in-out;
    margin-bottom: 2px; /* Центрирование галочки */
  }

  .fast-checkbox-input:checked::before {
    transform: rotate(-45deg) scale(1);
  }

  /* Текст симптома */
  .fast-checkbox-text {
    font-size: 16px;
    line-height: 1.4;
    color: #212121;
  }

  .mobile-tabs {
    display: none;
  }

  .disclaimer {
    display: flex;
    margin-bottom: 16px;
    border: 1px solid red;
    font-size: 18px;
    gap: 16px;
  }
  .disclaimer .text {
    color: #5f2120;
  }
  .your-result-text {
    margin-bottom: 16px;
    font-size: 20px;
  }
  .product-item .product-item__image img {
    display: block;
    width: 150px;
    margin: 0 auto;
  }
  .product-item .product-item__description {
    font-size: 18px;
  }
  .product-item .product-item__description .product-item__text {
    margin: 0 0 8px 0;
  }
  
  @media (max-width: 768px) {
    .hide-on-mobile {
      display: none;
    }
    .mobile-tabs {
      display: flex;
    }
  }

  /* Стили для нативных аккордеонов */
  .expansion-panels-native {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .panel-native {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    border: 1px solid #e0e0e0;
  }

  .panel-summary-native {
    display: flex;
    gap: 10px;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    font-weight: 500;
    cursor: pointer;
    list-style: none; /* Убирает дефолтную стрелочку в Chrome/Firefox */
    user-select: none;
  }

  /* Убирает дефолтную стрелочку в Safari */
  .panel-summary-native::-webkit-details-marker {
    display: none;
  }

  /* Кастомная стрелочка-иконка */
  .panel-icon-native {
    display: block;
    width: 10px;
    height: 10px;
    border-bottom: 2px solid #757575;
    border-right: 2px solid #757575;
    transform: rotate(45deg);
    transition: transform 0.2s ease;
    margin-right: 4px;
    flex-shrink: 0;
  }

  /* Поворот стрелочки при открытии */
  .panel-native[open] .panel-icon-native {
    transform: rotate(-135deg);
  }

  /* Граница между заголовком и контентом при открытии */
  .panel-native[open] .panel-summary-native {
    border-bottom: 1px solid #e0e0e0;
  }

  .panel-content-native {
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
  }

  /* Аналог компонента v-alert */
  .alert-error-native {
    display: flex;
    align-items: center;
    gap: 12px;
    background-color: #fde8e8;
    border: 1px solid #f8b4b4;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 16px;
    font-family: inherit;
  }
  .alert-icon-native {
    font-size: 20px;
  }
  .alert-text-native {
    color: #9b1c1c;
    font-size: 15px;
    font-weight: 500;
  }

  .form-group {
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #212121;
  }

  /* Стили нативного инпута под текущую дизайн-систему */
  .input-native {
    width: 100%;
    height: 40px;
    padding: 8px 14px;
    border-radius: 4px;
    border: 1px solid #b0bec5; /* Нейтральная серая рамка */
    background-color: #fff;
    font-family: inherit;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  /* Состояние инпута при фокусе (зеленый бренд-цвет как у Vuetify) */
  .input-native:focus {
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  /* Стили инпута при наличии ошибки */
  .form-group--error .input-native {
    border-color: #e53935;
  }
  .form-group--error .input-native:focus {
    box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.2);
  }

  /* Текст ошибки под инпутом */
  .error-text-native {
    color: #e53935;
    font-size: 12px;
    font-weight: 500;
    margin-top: 2px;
  }

  .form-group-checkbox {
    margin-top: 8px;
  }


  /* Стили аналог Vuetify */
  .mb-4 {
    margin-bottom: 16px;
  }
  .elevation-2 {
    box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 2px 0px, rgba(0, 0, 0, 0.15) 0px 2px 6px 2px;
  }
  .rounded-lg {
    border-radius: 8px;
  }
  .pa-4 {
    padding: 16px;
  }
  .bg-white {
    background-color: #fff;
  }
  .text-red {
    color: red;
  }
  .d-flex {
    display: flex;
  }
  .justify-end {
    justify-content: flex-end;
  }
  .mt-3 {
    margin-top: 12px;
  }
  .ga-4 {
    gap: 16px;
  }
  .flex-grow-1 {
    flex-grow: 1;
  }
  .flex-shrink-0 {
    flex-shrink: 0;
  }
  .elevation-1 {
    box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 2px 0px, rgba(0, 0, 0, 0.15) 0px 1px 3px 1px;
  }
  .pl-6 {
    padding-left: 24px;
  }
  .pr-6 {
    padding-right: 24px;
  }
  .pb-3 {
    padding-bottom: 12px;
  }
  .pt-3 {
    padding-top: 12px;
  }
  .mb-2 {
    margin-bottom: 8px;
  }
  .justify-space-between {
    justify-content: space-between;
  }
  .mt-6 {
    margin-top: 24px;
  }

  /* Базовые стили для десктопной боковой панели */
  .navbar {
    width: 370px;
    flex-shrink: 0;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 2px 0px, rgba(0, 0, 0, 0.15) 0px 2px 6px 2px; /* Эквивалент elevation-2 */
    padding: 8px 0;
    align-self: flex-start;
  }

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .nav-list-item {
    padding: 12px 16px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    color: #212121;
    transition: background-color 0.2s, color 0.2s;
  }

  .nav-list-item:hover {
    background-color: #f5f5f5;
  }

  /* Активный пункт меню на десктопе */
  .nav-list-item--active {
    background-color: #f0edf7;
    color: rgb(48, 38, 85);
  }

  /* МОБИЛЬНАЯ НАВИГАЦИЯ: Горизонтальный скролл-банд */
  .mobile-tabs {
    display: none; /* Скрыто на десктопе */
    gap: 8px;
    overflow-x: auto;
    white-space: nowrap;
    padding: 4px 4px 12px 4px;
    -webkit-overflow-scrolling: touch;
  }

  /* Прячем дефолтный скроллбар в Chrome/Safari/Firefox для красоты горизонтальной ленты */
  .mobile-tabs::-webkit-scrollbar {
    display: none;
  }
  .mobile-tabs {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .mobile-tab-btn {
    display: inline-block;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    padding: 10px 16px;
    border-radius: 20px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #616161;
    cursor: pointer;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
  }

  /*
  .mobile-tab-btn--back {
    background-color: #f5f5f5;
    border-color: #d6d6d6;
  }
  */

  /* Активная вкладка на мобильных */
  .mobile-tab-btn--active {
    background-color: rgb(48, 38, 85);
    color: #fff;
    border-color: rgb(48, 38, 85);
  }

  /* Медиа-запрос для переключения навигации */
  @media (max-width: 768px) {
    .hide-on-mobile {
      display: none !important;
    }
    .mobile-tabs {
      display: flex;
    }
  }

</style>

<!-- Этот блок строго без scoped — для глобальных правил шрифтов -->
<style>
  * {
    box-sizing: border-box;
  }

  /* Применяем ко всем элементам приложения */
  body, html, #app, .app-wrapper, input, button, select, textarea {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 16px;
  }
</style>
