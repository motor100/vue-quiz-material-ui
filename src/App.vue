<script setup>
  import { reactive, ref, computed } from 'vue';
  //import { useRules } from 'vuetify/labs/rules'
  import { VMaskInput } from 'vuetify/labs/VMaskInput'
  import { appConfig } from './config'

  //const rules = useRules()

  /*
  const nameRule = [
    v => !!v || 'Это поле обязательно для заполнения',
    v => v.length <= 3 || 'Поле должно быть не менее 3 символов'
  ]
  
  const emailRule = [
    v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Это поле обязательно для заполнения'
  ]
  */

  const checkboxRule = [
    v => !!v || 'Это поле обязательно для заполнения',
  ]
  


  // Персональные данные
  const personalInfo = ref({
    firstName: {
      value: '',
      error: false,
      errorText: ''
    },
    lastName: {
      value: '',
      error: false,
      errorText: ''
    },
    email: {
      value: '',
      error: false,
      errorText: ''
    },
    phone: {
      value: '',
      error: false,
      errorText: ''
    },
    dateOfBirth: {
      value: '',
      error: false,
      errorText: ''
    }
  })

  function validateFirstName() {
    // Валидация имени 3-50 символов
    if (personalInfo.value.firstName.value.length >= 3 && personalInfo.value.firstName.value.length <= 50) {
      personalInfo.value.firstName.error = false
      personalInfo.value.firstName.errorText = ''
    } else {
      personalInfo.value.firstName.error = true
      personalInfo.value.firstName.errorText = 'Поле должно быть не менее 3 и не более 50 символов'
    }
  }

  function validateLastName() {
    // Валидация фамилии 3-50 символов
    if (personalInfo.value.lastName.value.length >= 3 && personalInfo.value.lastName.value.length <= 50) {
      personalInfo.value.lastName.error = false
      personalInfo.value.lastName.errorText = ''
    } else {
      personalInfo.value.lastName.error = true
      personalInfo.value.lastName.errorText = 'Поле должно быть не менее 3 и не более 50 символов'
    }
  }

  function validateEmail() {
    // Валидация email 5-100 символов

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (personalInfo.value.email.value.length >= 5 && 
      personalInfo.value.email.value.length <= 100 && 
      emailPattern.test(personalInfo.value.email.value)) {
      personalInfo.value.email.error = false
      personalInfo.value.email.errorText = ''
    } else {
      personalInfo.value.email.error = true
      personalInfo.value.email.errorText = 'Поле должно быть не менее 5 и не более 100 символов'
    }
  }

  function validateDateOfBirth() {
    // Валидация даты рождения
    if (personalInfo.value.dateOfBirth.value.length == 10) {
      personalInfo.value.dateOfBirth.error = false
      personalInfo.value.dateOfBirth.errorText = ''
    } else {
      personalInfo.value.dateOfBirth.error = true
      personalInfo.value.dateOfBirth.errorText = 'Поле обязательно для заполнения'
    }
  }

  function personalInfoSubmit() {

    validateFirstName()

    validateLastName()

    validateEmail()

    validateDateOfBirth()

    // Валидация номера телефона меньше или равно 19 символов
    if (personalInfo.value.phone.value.length <= 19) {
      personalInfo.value.phone.error = false
      personalInfo.value.phone.errorText = ''
    } else {
      personalInfo.value.phone.error = true
      personalInfo.value.phone.errorText = 'Поле должно быть 19 символов'
    }

    // Проверяю на ошибки
    if (!personalInfo.value.firstName.error && 
        !personalInfo.value.lastName.error && 
        !personalInfo.value.email.error && 
        !personalInfo.value.phone.error && 
        !personalInfo.value.dateOfBirth.error) {
      console.log('ок')
    }
  }

  // Шаг персональных данных
  const isPersonalDataStep = ref(false)

  // Шаг анкетирования
  const isCalculatorStep = ref(false)

  // Шаг результатов
  const isResultStep = ref(true)

  function personalInfoSubmitNext() {
    isCalculatorStep.value = true
  }

  // Активный пункт меню. По умолчанию id = 1 (в примере формата данных)
  const activeId = ref(1)

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


  /**
   * Переключение панелей в зависимости от клика в левом меню
   */
  const expanded = ref([])

  // Вычисляемое свойство filteredItem 
  // Один отфильтрованный объект items по свойству active: true
  // Возвращает объект
  const filteredItem = computed(() => {
    // return items.value.filter((t) => t.active)
    return items.value.find((t) => t.active)
  })

  function testClick(item) {

    // Убираю active с прошлого элемента
    items.value.forEach(function(i) {
      i.active = false
    });

    // Добавляю active к текущему элементу
    item.active = true

    // Обновляю переменную activeId
    activeId.value = item.id

    // Обновляю массив с открытыми панелями
    expanded.value = Object.keys(filteredItem.value.groups)
  }

  function windowPrint() {
    window.print()
  }

  // Открываю панели
  expanded.value = Object.keys(filteredItem.value.groups)

</script>

<template>
  <v-responsive>
    <v-app>

      <!-- Шаг персональных данных -->
      <v-main v-if="isPersonalDataStep">
        <v-container>

          <h4 class="main-title">Подберите наилучшие варианты соли Шюсслера!</h4>
          <div class="elevation-2 rounded-lg pa-4 bg-white">
            <p>Вы приступаете к автоматизированному подбору солей Шюсслера для проведения тканевой биохимической терапии. Вам понадобится 20-40 минут свободного времени и зеркало. Постарайтесь сосредоточиться на Вашей текущей проблеме. Отмечайте только те пункты, которые относятся к Вашему текущему состоянию. Не старайтесь собрать все симптомы, которые когда либо были у Вас, отмечайте только актуальные на сегодняшний день. Если Вы выбираете соли Шюсслера для конкретной проблемы пропускайте все блоки, кроме необходимого. По результатам теста Вам будет подобрана комбинация 3 основных солей Шюсслера, одной дополнительной и одной комплексной для длительного применения (если есть показания). Полученные рекомендации не являются назначениями. Любое заболевание требует консультации врача.</p>
            <!-- <v-form @submit.prevent="personalInfoSubmit"> -->
              <v-form @submit.prevent="personalInfoSubmitNext">

              <div class="form-group">
                <label id="firstName-label" for="firstName">Имя*</label>
                <v-text-field
                  id="firstName"
                  variant="outlined"
                  color="green"
                  @input="validateFirstName"
                  v-model="personalInfo.firstName.value"
                  :error="personalInfo.firstName.error"
                  :error-messages="personalInfo.firstName.errorText"
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
                  @input="validateLastName"
                  v-model="personalInfo.lastName.value"
                  :error="personalInfo.lastName.error"
                  :error-messages="personalInfo.lastName.errorText"
                  autocomlete="on"
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
                  @input="validateEmail"
                  v-model="personalInfo.email.value"
                  :error="personalInfo.email.error"
                  :error-messages="personalInfo.email.errorText"
                  autocomlete="on"
                  required>
                </v-text-field>
              </div>
              
              <!-- 
              <div class="form-group">
                <label id="phone-label" for="phone">Номер телефона</label>
                <v-mask-input 
                  id="phone"
                  variant="outlined"
                  color="green"
                  mask="+7 (###) ###-##-###" 
                  v-model="personalInfo.phone.value"
                  :error="personalInfo.phone.error"
                  :error-messages="personalInfo.phone.errorText"
                  autocomlete="on">
                </v-mask-input>
              </div>
               -->

              <div class="form-group">
                <label id="dateOfBirth-label" for="dateOfBirth">Дата рождения*</label>
                <v-text-field 
                  id="dateOfBirth"
                  variant="outlined"
                  color="green"
                  type="date" 
                  @input="validateDateOfBirth"
                  v-model="personalInfo.dateOfBirth.value"
                  :error="personalInfo.dateOfBirth.error"
                  :error-messages="personalInfo.dateOfBirth.errorText"
                  autocomlete="on"
                  required>
                </v-text-field>
              </div>

              <v-checkbox hide-details required :rules="checkboxRule">
                <template v-slot:label>
                  <div >
                    Ознакомлен с 
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <a
                          v-bind:href=appConfig.privacyPolicyUrl
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

              <v-checkbox hide-details required :rules="checkboxRule">
                <template v-slot:label>
                  <div>
                    Согласен на 
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <a
                          v-bind:href=appConfig.personalDataAcceptanceUrl
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
                  class="btn">
                  Продолжить
                </v-btn>
              </div>
              
            </v-form>
          </div>
        </v-container>
      </v-main>

      <!-- Шаг анкетирования -->
      <v-main v-if="isCalculatorStep">
        <v-container>
          <div class="flex-container">
            <!-- <div class="navbar elevation-2 rounded-lg pa-4"> -->
              <v-card class="navbar elevation-2 rounded-lg hide-on-mobile">
                <v-list>
                  <!-- Статическая часть списка -->
                  <v-list-item
                    :link=true>
                    Личная информация
                  </v-list-item>
                  <!-- Динамическая часть списка -->
                  <v-list-item
                    v-for="item in items"
                    :key="item.id"
                    :title="item.title"
                    :link=true
                    :active="item.active"
                    @click=testClick(item)
                  ></v-list-item>
                </v-list>
              </v-card>
            <!-- </div> -->
            <div class="content">

              <div class="title elevation-1 rounded-lg pl-6 lr-6 pb-3 pt-3 mb-2">{{ filteredItem.groupsTitle }}</div>
              
              <v-expansion-panels
                :rounded="[10, 10]"
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
                      hide-details>
                    </v-checkbox>

                  </v-expansion-panel-text>
                </v-expansion-panel>

              </v-expansion-panels>

            </div>
            
          </div>

          <div class="group-buttons">
            <v-btn 
              type="button"
              class="btn">
              Назад
            </v-btn>
            <v-btn 
              type="button"
              class="btn">
              Далее
            </v-btn>
          </div>

        </v-container>
      </v-main>

      <!-- Шаг результатов -->
      <v-main v-if="isResultStep">
        <v-container>
          <h2 class="text-center">Вы прошли тестирование в экспертной программе по подбору цветов Баха для тканевой биохимической терапии</h2>
          <div class="disclaimer elevation-2 rounded-lg pa-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="red" class="icon">
              <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
            </svg>
            <span class="text">Внимание! Автоматизированный тест не является назначением врача. В случае проблем со здоровьем следует обращаться за квалифицированной медицинской помощью.</span>
          </div>
          <div class="your-result-text">Ваш результат:</div>

          <div class="product-item">
            <div class="product-item__image rounded-lg">
              <img src="/img/photo-salts-2-1.png" alt="">
            </div>
            <div class="product-item__description">
              <div class="product-item__title">Соль: 2</div>
              <p class="product-item__text">Регенерация Участвует в процессах роста и регенерации, отвечает за стабильность клеточных мембран.</p>
            </div>
          </div>

          <div class="product-item">
            <div class="product-item__image">
              <img src="/img/photo-salts-25-1.jpg" alt="">
            </div>
            <div class="product-item__description">
              <div class="product-item__title">Соль: 25</div>
              <p class="product-item__text">Биоритмы Дополнительная соль для восстановления биоритмов.</p>
            </div>
          </div>

          <v-expansion-panels
            :rounded="[10, 10]"
            class="mb-4"
            static>
            <v-expansion-panel class="mt-0">
              <v-expansion-panel-title>Как принимать</v-expansion-panel-title>
              <v-expansion-panel-text>

                <!-- Постоянный обязательный текст -->
                <div class="required-text">
                  Принимайте назначенные соли за 30-40 минут до еды или через полтора часа после еды. Избегайте чистки зубов и курения за 20 минут до и после приема солей. Соли Шюсслера могут приниматься в сухом виде – таблетки рассасываются во рту или непосредственно под языком. Вы можете растворить  соли в небольшом количестве воды 120-150 мл ( соли в таблетках растворяются очень медленно)  и принимать небольшими глотками, удерживая каждый глоток во рту по несколько секунд.</br>
                  Если назначено несколько солей, и Вам удобно принимать их одновременно, делайте перерыв 5-10 минут между разными солями. Допустимо растворять все соли в 1 л воды и принимать в течение дня как удобно.</br>
                  Каждый флакон рассчитан на стандартный курс приема.</br>
                  Соли в таблетках растворяются медленно. Если Вы предпочитаете растворять соли в воде – заказывайте соли в тритурациях (порошки), они быстро растворимы.  1 флакону по 200 таблеток эквивалентны 3 флакона тритураций по 20 грамм.</br> 
                  Помните, что во время приема солей Шюсслера всегда необходимо принимать большое количество чистой воды (чай, кофе и другие жидкости не учитываются). Ориентировочный расчет чистой воды 25-30 мл на кг веса. Если Ваш врач ограничивает Вам прием жидкостей, то не превышайте дозу, назначенную доктором, но всегда отдавайте предпочтение чистой воде.</br>
                  В рекомендациях дано оптимальное время приема каждой соли в соответствии с биоритмами организма и потребностью органов-мишеней к каждой соли. Вы можете пользоваться данным графиком или составить свой удобный для вас.</br> 
                  Рекомендовано принимать соли 5 дней в неделю (с понедельника по пятницу) и делать 2 дня перерыва.</br> 
                  Дополнительные комплексные соли рекомендовано принимать после окончания основного курса приема солей №№1-27 для пролонгирования и закрепления эффекта.</br>
                  Кофе и другие антидоты, от которых воздерживаются при приеме гомеопатических препаратов не оказывают существенного влияния на терапию солями Шюсслера. Соли хорошо сочетаются с другими видами лечения, побочные эффекты не выявлены. Однако, могут быть кратковременные реакции ухудшения, которые проходят самостоятельно в течение 3-4 дней. Эффективность оценивается через 1-2 дня при острых ситуациях, через 4-6 недель при хронических. После окончания курса эффект постепенно нарастает в течение 2-3 месяцев.</br>
                  Помните, что тестирование не заменяет консультации врача, носит ознакомительный характер и не является медицинским заключением. Любое заболевание требует консультации специалиста. Искусственный интеллект не может заменить врача. Соли не являются БАД и не являются лекарством. Это диетическое питание.
                </div>

                <!-- Описание каждого из продуктов. Вставляется из БД в зависимости от результата -->
                <p class="product-text">
                  Соль Шюсслера №2 Calcium phosphoricum D6 (Фосфат кальция) принимать по 5 таблеток утром. 
                  Возможная реакция в первые дни приеме-боли в области суставов, проходят самостоятельно. Соль Шюсслера №2 для оптимального эффекта  требует длительного приема от 3 до 12 месяцев.
                </p>

                <p class="product-text">
                  Соль Шюсслера №25  Aurum chloratum natronatum D12 ( Хлорид золота) – принимать по 2 таблетки утром, в полдень и рано вечером, если есть нарушения сна - принимать дополнительно 2 таблетки перед сном. 
                  Возможные реакции во время приема не зафиксированы.
                </p>

                <p class="product-text">
                  Vita (Работоспособность)- после окончания основного курса, перейти на прием комплексной соли по 5 таблеток утром.
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

          <div class="group-buttons">
            <v-btn 
              :href=appConfig.completeAgainUrl
              class="btn"
              >
              Рассчитать заново
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
/*
  :deep(.v-theme--light) {
    background-color: #faf9ff;
  }
  */
  :deep(.v-application__wrap) {
    background-color: #faf9ff;
  } 

  .v-main {
    margin-top: 30px;
    margin-bottom: 30px;
  }
  /*
  @media only screen and (max-width : 576px) {
    .v-container {
      padding: 0;
    }
  }
    */
  .color-red {
    color: red;
  }
  .btn {
    outline: 0px;
    margin: 0px;
    font-family: inherit;
    font-weight: 500;
    line-height: 1.75;
    min-width: 130px;
    height: 43px;
    border: 0px;
    padding: 8px 22px;
    font-size: 0.9375rem;
    box-shadow: none;
    border-radius: 5px;
    background: linear-gradient(90deg, rgb(48, 38, 85) 0%, rgb(137, 80, 112) 100%);
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


  .flex-container {
    display: flex;
    gap: 16px;
  }
  .navbar {
    width: 300px;
    height: 100%;
    flex-shrink: 0;
  }
  .content {
    flex-grow: 1
  }
  .group-buttons {
    display: flex;
    margin-top: 24px;
    justify-content: space-between;
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
  .disclaimer .icon {
    flex-shrink: 0;
  }
  .disclaimer .text {
    color: #5f2120;
  }
  .your-result-text {
    margin-bottom: 16px;
    font-size: 20px;
  }
  .product-item {
    margin-bottom: 16px;
  }
  .product-item .product-item__image {
    margin-bottom: 16px;
    background-color: #fff;
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

