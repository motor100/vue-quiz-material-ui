<script setup>
  import { reactive, ref } from 'vue';
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

  const items = [
    {
      name: 'Item #1',
      id: 1,
    },
    {
      name: 'Item #2',
      id: 2,
    },
    {
      name: 'Item #3',
      id: 3,
    },
  ]

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
                <v-list
                  :items="items"
                  item-title="name"
                  item-value="id">
                </v-list>
              </v-card>
            <!-- </div> -->
            <div class="content">
              <div class="title elevation-1 rounded-lg pl-6 lr-6 pb-3 pt-3 mb-2">Отметьте какие из общих симптомов беспокоят вас больше всего в настоящее время.</div>
              
              <v-expansion-panels
                :rounded="[10, 10]"
                gap="8"
                variant="accordion"
                static
                multiple
              >
                <v-expansion-panel class="mt-0">
                  <v-expansion-panel-title>Panel 1</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    Some content
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel class="mt-0">
                  <v-expansion-panel-title>Panel 2</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    Some content
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel class="mt-0">
                  <v-expansion-panel-title>Panel 3</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    Some content
                  </v-expansion-panel-text>
                </v-expansion-panel>
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
    flex-shrink: 0;
  }
  .content {
    flex-grow: 1
  }
  .content .title {

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
  


</style>

