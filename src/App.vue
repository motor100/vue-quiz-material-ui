<script setup>
  import { reactive, ref, computed, onMounted } from 'vue';
  import { appConfig } from './config'
  //import {getZodiacSign} from "./utils/_getZodiacSign";
  //import {getAge} from "./utils/_getAge";


  // Ссылка на Vuetify форму для вызова валидации
  const formRef = ref(null);

  // Управление шагами через одно состояние: 'personal' | 'questions' | 'results'
  const currentStep = ref('personal');

  // Чекбоксы согласий персональных данных и политики конфиденциальности
  const personalDataIsAccepted = ref(false)
  const privacyPolicyIsAccepted = ref(false)

  // Данные API заказа
  const orderData = ref(null)
  const orderLoading = ref(true)
  const orderError = ref(null)

  // Хранилище для выбранных симптомов
  // Ключом будет имя симптома, значением — true/false
  const selectedSymptoms = reactive({});

  // Активный ID вкладки вопросов (управляет вкладками декларативно)
  const activeTabId = ref(1);

  // Массив открытых панелей-аккордеонов
  const expanded = ref([]);

  // Правила валидации Vuetify
  const rules = {
    required: v => !!v || 'Это поле обязательно для заполнения',
    name: v => (v && v.length >= 3 && v.length <= 50) || 'Поле должно быть от 3 до 50 символов',
    email: v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Введен некорректный E-mail',
    phone: v => !v || v.length <= 19 || 'Поле должно быть не более 19 символов',
    checkbox: v => !!v || 'Необходимо ваше согласие'
  };

  // Персональные данные
  const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  })

  // Клик по кнопке "Продолжить" на шаге персональных данных
  async function personalDataStepNext() {
    if (!formRef.value) return;

    // Триггерим встроенную валидацию Vuetify для всех полей формы
    const { valid } = await formRef.value.validate();

    if (valid && orderData.value?.status) {
      currentStep.value = 'questions';
      
      // Пример использования утилит (раскомментируйте при необходимости)
      // const zodiac = getZodiacSign(new Date(form.dateOfBirth));
      // const age = getAge(form.dateOfBirth);
    }
  }

  // Переключение шагов навигации
  function questionStepBack() {
    currentStep.value = 'personal';
  }

  function questionStepNext() {
    currentStep.value = 'results';
  }

  // Пример формата данных
  const items = ref([
    {
      title: 'Общие симптомы',
      id: 1,
      active: true,
      groupsTitle: 'Отметьте какие из общих симптомов беспокоят Вас больше всего в настоящее время.',
      groups: [
        {
          id: 101,
          title: 'Низкий уровень энергии',
          checkboxes: [
            'Усталость по утрам',
            'Весенняя усталость',
            'Усталость постоянная',
            'Перегруженность',
            'Слабость',
            'Медлительность',
            'Высокие нагрузки',
            'Перенапряжение',
            'Джетлаг',
          ]
        },
        {
          id: 102,
          title: 'Физическое недомогание',
          checkboxes: [
            'Процесс выздоровления после болезни',
            'Послеоперационный период',
            'Подготовка к оперативному лечению',
            'Физическое истощение',
            'Изнуряющая тяжелая болезнь',
            'Частое употребление алкоголя',
            'Хроническая интоксикация',
          ]
        }
      ],
    },
    {
      title: 'Сигнатуры',
      id: 2,
      active: false,
      groupsTitle: 'Для следующего шага Вам потребуется зеркало. Внимательно рассмотрите свое лицо, шею.Отмечайте все небольшие изменения, которые Вы замечаете. При дефицитах минералов, организм, прежде всего, истощает их запасы в коже. Это может проявляться различными, иногда малозаметными симптомами.',
      groups: [
        {
          id: 103,
          title: 'Общий вид кожи',
          checkboxes: [
            'Чекбокс 1',
            'Чекбокс 2',
          ]
        },
        {
          id: 104,
          title: 'Характеристика особенностей морфотипа лица',
          checkboxes: [
            'Чекбокс 1',
            'Чекбокс 2',
            'Чекбокс 3',
          ]
        },
        {
          id: 105,
          title: 'Сигнатуры в области глаз и периорбитальной области',
          checkboxes: [
            'Глубокая морщина',
            'Темные круги',
          ]
        }
      ]
    },
    {
      title: 'Психологическое состояние',
      id: 3,
      active: false,
      groupsTitle: 'Отметьте какие характеристики к Вам относятся.',
      groups: [
        {
          id: 106,
          title: 'Страхи',
          checkboxes: [
            'Чекбокс 1',
            'Чекбокс 2',
          ]
        },
        {
          id: 107,
          title: 'Настроение',
          checkboxes: [
            'Чекбокс 1',
            'Чекбокс 2',
            'Чекбокс 3',
          ]
        }
      ]
    },
  ])

  // Вычисляем активный элемент на основе activeTabId (убрали мутацию свойства .active)
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
    const hasEmptyFields = !form.firstName || !form.lastName || !form.email || !form.dateOfBirth;
    const hasNoAgreements = !personalDataIsAccepted.value || !privacyPolicyIsAccepted.value;
    
    return hasEmptyFields || hasNoAgreements;
  });

  // Запрос на сервер для проверки номера заказа
  const fetchOrderData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('d');
    
    if (!orderId) {
      orderLoading.value = false;
      return;
    }

    const url = `${appConfig.apiEndpoint}/wp-json/myplugin/v1/posts/${orderId}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      orderData.value = await response.json();
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

    if (filteredItem.value) {
      expanded.value = Object.keys(filteredItem.value.groups);
    }
  });

  // Переключение вкладок вопросов (чистая функция без side-эффектов)
  function questionList(item) {
    activeTabId.value = item.id;
    expanded.value = Object.keys(item.groups).map(Number);
  }

  // Печать страницы
  function windowPrint() {
    window.print()
  }

</script>

<template>
  <v-responsive>
    <v-app>

      <!-- Шаг персональных данных -->
      <v-main v-if="currentStep === 'personal'">
        <v-container>

          <h4 class="main-title">Подберите наилучшие варианты цветы !</h4>
          <div class="elevation-2 rounded-lg pa-4 bg-white">
            <p>Вы приступаете к автоматизированному подбору солей  для проведения тканевой биохимической терапии. Вам понадобится 20-40 минут свободного времени и зеркало. Постарайтесь сосредоточиться на Вашей текущей проблеме. Отмечайте только те пункты, которые относятся к Вашему текущему состоянию. Не старайтесь собрать все симптомы, которые когда либо были у Вас, отмечайте только актуальные на сегодняшний день. Если Вы выбираете цветы  для конкретной проблемы пропускайте все блоки, кроме необходимого. По результатам теста Вам будет подобрана комбинация 3 основных солей , одной дополнительной и одной комплексной для длительного применения (если есть показания). Полученные рекомендации не являются назначениями. Любое заболевание требует консультации врача.</p>

            <v-form ref="formRef" @submit.prevent="personalDataStepNext">

              <div class="form-group">
                <label id="firstName-label" for="firstName">Имя*</label>
                <v-text-field
                  id="firstName"
                  variant="outlined"
                  color="green"
                  v-model="form.firstName"
                  :rules="[rules.required, rules.name]"
                  autocomplete="on"
                  required>
                </v-text-field>
              </div>

              <div class="form-group">
                <label id="lastName-label" for="lastName">Фамилия*</label>
                <v-text-field 
                  id="lastName"
                  variant="outlined"
                  color="green"
                  v-model="form.lastName"
                  :rules="[rules.required, rules.name]"
                  autocomplete="on"
                  required>
                </v-text-field>
              </div>

              <div class="form-group">
                <label id="email-label" for="email">Электронная почта*</label>
                <v-text-field 
                  id="email"
                  variant="outlined"
                  color="green"
                  type="email"
                  v-model="form.email"
                  :rules="[rules.required, rules.email]"
                  autocomplete="on"
                  required>
                </v-text-field>
              </div>

              <div class="form-group">
                <label id="dateOfBirth-label" for="dateOfBirth">Дата рождения*</label>
                <v-text-field 
                  id="dateOfBirth"
                  variant="outlined"
                  color="green"
                  type="date" 
                  v-model="form.dateOfBirth"
                  :rules="[rules.required]"
                  autocomplete="on"
                  required>
                </v-text-field>
              </div>

              <v-checkbox 
                hide-details 
                required 
                :rules="[rules.checkbox]"
                v-model="privacyPolicyIsAccepted">
                <template v-slot:label>
                  <div >
                    Ознакомлен с 
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <a
                          :href="appConfig.privacyPolicyUrl"
                          target="_blank"
                          v-bind="props"
                          @click.stop>
                          политикой конфиденциальности.
                        </a>
                      </template>
                      Открыть в новом окне
                    </v-tooltip>
                  </div>
                </template>
              </v-checkbox>

              <v-checkbox 
                hide-details 
                required 
                :rules="[rules.checkbox]"
                v-model="personalDataIsAccepted">
                <template v-slot:label>
                  <div>
                    Согласен на 
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <a
                          :href="appConfig.personalDataAcceptanceUrl"
                          target="_blank"
                          v-bind="props"
                          @click.stop>
                          обработку персональных данных.
                        </a>
                      </template>
                      Открыть в новом окне
                    </v-tooltip>
                  </div>
                </template>
              </v-checkbox>

              <div class="d-flex justify-end mt-3">
                <v-btn 
                  type="submit"
                  class="btn"
                  :disabled="isPersonalDataStepNextBtnDisabled">
                  Продолжить
                </v-btn>
              </div>
              
            </v-form>
          </div>
        </v-container>
      </v-main>

      <!-- Шаг вопросов -->
      <v-main v-if="currentStep === 'questions'">
        <v-container>
          <div class="d-flex ga-4">
              <v-card class="navbar elevation-2 rounded-lg hide-on-mobile">
                <v-list>
                  <!-- Статическая часть списка -->
                  <v-list-item
                    :link=true
                    @click="questionStepBack">
                    Личная информация
                  </v-list-item>
                  <!-- Динамическая часть списка -->
                  <v-list-item
                    v-for="item in items"
                    :key="item.id"
                    :title="item.title"
                    :link=true
                    :active="item.id === activeTabId"
                    @click=questionList(item)
                  ></v-list-item>
                </v-list>
              </v-card>
            <!-- </div> -->
            <div class="content flex-grow-1">

              <div class="title elevation-1 rounded-lg bg-white pl-6 lr-6 pb-3 pt-3 mb-2">{{ filteredItem.groupsTitle }}</div>
              
              <v-expansion-panels
                rounded="lg"
                gap="8"
                v-model="expanded"
                static
                multiple>

                <v-expansion-panel 
                  v-for="item in filteredItem.groups"
                  :key="item.id"
                  class="mt-0"
                  >
                  <v-expansion-panel-title>{{ item.title }}</v-expansion-panel-title>
                  <v-expansion-panel-text>

                    <v-checkbox
                      v-for="checkbox in item.checkboxes"
                      :label="checkbox"
                      v-model="selectedSymptoms[checkbox]"
                      hide-details>
                    </v-checkbox>

                  </v-expansion-panel-text>
                </v-expansion-panel>

              </v-expansion-panels>

            </div>
            
          </div>

          <div class="group-buttons d-flex justify-space-between mt-6">
            <v-btn 
              type="button"
              class="btn"
              @click="questionStepBack">
              Назад
            </v-btn>
            <v-btn 
              type="button"
              class="btn"
              @click="questionStepNext">
              Далее
            </v-btn>
          </div>

        </v-container>
      </v-main>

      <!-- Шаг результатов -->
      <v-main v-if="currentStep === 'results'">
        <v-container>
          <h2 class="text-center">Вы прошли тестирование в экспертной программе по подбору цветов Баха для тканевой биохимической терапии</h2>
          <div class="disclaimer elevation-2 rounded-lg pa-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="red" class="flex-shrink-0">
              <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
            </svg>
            <span class="text">Внимание! Автоматизированный тест не является назначением врача. В случае проблем со здоровьем следует обращаться за квалифицированной медицинской помощью.</span>
          </div>
          <div class="your-result-text">Ваш результат:</div>

          <div class="product-item mb-4">
            <div class="product-item__image rounded-lg mb-4 bg-white">
              <img src="/img/photo-salts-2-1.png" alt="">
            </div>
            <div class="product-item__description">
              <div class="product-item__title">Соль: 2</div>
              <p class="product-item__text">Регенерация Участвует в процессах роста и регенерации, отвечает за стабильность клеточных мембран.</p>
            </div>
          </div>

          <div class="product-item mb-4">
            <div class="product-item__image rounded-lg mb-4 bg-white">
              <img src="/img/photo-salts-25-1.jpg" alt="">
            </div>
            <div class="product-item__description">
              <div class="product-item__title">Соль: 25</div>
              <p class="product-item__text">Биоритмы Дополнительная соль для восстановления биоритмов.</p>
            </div>
          </div>

          <v-expansion-panels
            rounded="lg"
            class="mb-4"
            static>
            <v-expansion-panel class="mt-0">
              <v-expansion-panel-title>Как принимать</v-expansion-panel-title>
              <v-expansion-panel-text>

                <!-- Постоянный обязательный текст -->
                <div class="required-text">
                  Принимайте назначенные цветы за 30-40 минут до еды или через полтора часа после еды. Избегайте чистки зубов и курения за 20 минут до и после приема цветов. цветы  могут приниматься в сухом виде – таблетки рассасываются во рту или непосредственно под языком. Вы можете растворить  цветы в небольшом количестве воды 120-150 мл ( цветы в таблетках растворяются очень медленно)  и принимать небольшими глотками, удерживая каждый глоток во рту по несколько секунд.</br>
                  Если назначено несколько цветов, и Вам удобно принимать их одновременно, делайте перерыв 5-10 минут между разными цветами. Допустимо растворять все цветы в 1 л воды и принимать в течение дня как удобно.</br>
                  Каждый флакон рассчитан на стандартный курс приема.</br>
                  цветы в таблетках растворяются медленно. Если Вы предпочитаете растворять цветы в воде – заказывайте цветы в тритурациях (порошки), они быстро растворимы.  1 флакону по 200 таблеток эквивалентны 3 флакона тритураций по 20 грамм.</br> 
                  Помните, что во время приема цветов  всегда необходимо принимать большое количество чистой воды (чай, кофе и другие жидкости не учитываются). Ориентировочный расчет чистой воды 25-30 мл на кг веса. Если Ваш врач ограничивает Вам прием жидкостей, то не превышайте дозу, назначенную доктором, но всегда отдавайте предпочтение чистой воде.</br>
                  В рекомендациях дано оптимальное время приема каждой цветы в соответствии с биоритмами организма и потребностью органов-мишеней к каждой цветы. Вы можете пользоваться данным графиком или составить свой удобный для вас.</br> 
                  Рекомендовано принимать цветы 5 дней в неделю (с понедельника по пятницу) и делать 2 дня перерыва.</br> 
                  Дополнительные комплексные цветы рекомендовано принимать после окончания основного курса приема цветов №№1-27 для пролонгирования и закрепления эффекта.</br>
                  Кофе и другие антидоты, от которых воздерживаются при приеме гомеопатических препаратов не оказывают существенного влияния на терапию цветами. цветы хорошо сочетаются с другими видами лечения, побочные эффекты не выявлены. Однако, могут быть кратковременные реакции ухудшения, которые проходят самостоятельно в течение 3-4 дней. Эффективность оценивается через 1-2 дня при острых ситуациях, через 4-6 недель при хронических. После окончания курса эффект постепенно нарастает в течение 2-3 месяцев.</br>
                  Помните, что тестирование не заменяет консультации врача, носит ознакомительный характер и не является медицинским заключением. Любое заболевание требует консультации специалиста. Искусственный интеллект не может заменить врача. цветы не являются БАД и не являются лекарством. Это диетическое питание.
                </div>

                <!-- Описание каждого из продуктов. Вставляется из БД в зависимости от результата -->
                <p class="product-text">
                  Соль  №2 Calcium phosphoricum D6 (Фосфат кальция) принимать по 5 таблеток утром. 
                  Возможная реакция в первые дни приеме-боли в области суставов, проходят самостоятельно. Соль  №2 для оптимального эффекта  требует длительного приема от 3 до 12 месяцев.
                </p>

                <p class="product-text">
                  Соль  №25  Aurum chloratum natronatum D12 ( Хлорид золота) – принимать по 2 таблетки утром, в полдень и рано вечером, если есть нарушения сна - принимать дополнительно 2 таблетки перед сном. 
                  Возможные реакции во время приема не зафиксированы.
                </p>

                <p class="product-text">
                  Vita (Работоспособность)- после окончания основного курса, перейти на прием комплексной цветы по 5 таблеток утром.
                </p>

              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div class="rounded-lg ps-4 pt-1 pb-1 bg-white">
            <p>Рецепт на подобранные Цветы Баха направлен в аптеку NaturaPharma на ваши контактные данные</p>
            <p>Сайт аптеки: {{ appConfig.apiEndpoint }}</p>
            <p>Телефон: {{ appConfig.phone }}</p>
            <p>Email: {{ appConfig.email }}</p>
          </div>

          <div class="group-buttons d-flex justify-space-between mt-6">
            <v-btn 
              :href="appConfig.completeAgainUrl"
              class="btn"
              >
              Пройти снова
            </v-btn>
            <v-btn 
              class="btn"
              @click="windowPrint">
              Печать
            </v-btn>
          </div>
          
        </v-container>
      </v-main>
     
    </v-app>
  </v-responsive>
</template>

<style scoped>
  :deep(.v-application__wrap) {
    background-color: #faf9ff;
  } 

  .v-main {
    margin-top: 30px;
    margin-bottom: 30px;
  }
  .color-red {
    color: red;
  }
  .btn {
    height: 43px;
    background: linear-gradient(90deg, rgb(48, 38, 85) 0%, rgb(137, 80, 112) 100%);
    color: white;
  }
  .btn:disabled {
    opacity: 0.7;
    color: white;
  }
  .form-group {
    margin-bottom: 8px;
  }
  :deep(.v-text-field input) {
    min-height: auto;
    height: 40px;
    padding: 8px 14px;
  }
  :deep(.v-checkbox .v-selection-control) {
    min-height: 40px;
  }
  .main-title {
    padding-left: 16px;
    padding-right: 16px;
    font-weight: 400;
    line-height: 1.235;
    font-size: 26px;
  }

  .navbar {
    width: 300px;
    height: 100%;
    flex-shrink: 0;
  }
  
  :deep(.v-expansion-panel-title) {
    padding: 12px 20px;
  }
  :deep(.v-expansion-panel-title--active) {
    border-bottom: 1px solid lightgrey;
  }
  :deep(.v-expansion-panel-text__wrapper) {
    padding-left: 10px;
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
  }

</style>

