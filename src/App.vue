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

  
  // Шаг анкетирования
  const isCalculatorStep = ref(true)

  function personalInfoSubmitNext() {
    isCalculatorStep.value = true
  }

  const activeId = ref(1)

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

  const checkboxItems1 = ref([
    'Усталость по утрам',
    'Весенняя усталость',
    'Усталость постоянная',
    'Перегруженность',
    'Слабость',
    'Медлительность',
    'Высокие нагрузки',
    'Перенапряжение',
    'Джетлаг',
  ])

  const checkboxItems2 = ref([
    'Процесс выздоровления после болезни',
    'Послеоперационный период',
    'Подготовка к оперативному лечению',
    'Физическое истощение',
    'Изнуряющая тяжелая болезнь',
    'Частое употребление алкоголя',
    'Хроническая интоксикация',
  ])

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

  // Открываю панели
  expanded.value = Object.keys(filteredItem.value.groups)

</script>

<template>
  <v-responsive>
    <v-app>
      

      <v-main v-if="isCalculatorStep">
        <v-container>
          <div class="flex-container">
            <!-- <div class="navbar elevation-2 rounded-lg pa-4"> -->
              <v-card
                class="navbar elevation-2 rounded-lg"
                max-width="300">
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
                  expand
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

                <!-- 
                <v-expansion-panel class="mt-0">
                  <v-expansion-panel-title>Низкий уровень энергии</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-checkbox 
                      v-for="item in checkboxItems1"
                      :label="item"
                      hide-details>
                    </v-checkbox>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel class="mt-0">
                  <v-expansion-panel-title>Физическое недомогание</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-checkbox 
                      v-for="item in checkboxItems2"
                      :label="item"
                      hide-details>
                    </v-checkbox>
                  </v-expansion-panel-text>
                </v-expansion-panel>
                 -->

              </v-expansion-panels>




            </div>
            
          </div>

          <div class="prev-next-step-buttons">
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

      <v-main v-else="isCalculatorStep">
        <v-container>

          <h4>Подберите наилучшие варианты соли Шюсслера!</h4>
          <div class="elevation-2 rounded-lg pa-4">
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

    </v-app>
  </v-responsive>
</template>

<style scoped>
  .v-main {
    margin-top: 30px;
    margin-bottom: 30px;
  }
  .color-red {
    color: red;
  }
  .btn {
    outline: 0px;
    margin: 0px;
    font-family: inherit;
    font-weight: 500;
    line-height: 1.75;
    width: 130px;
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
  .prev-next-step-buttons {
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

  


</style>

