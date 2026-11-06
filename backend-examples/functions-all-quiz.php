<?php

/**
 * Общие функции для всех анкет (квизов)
 * 
 * send_coupon_email() Функция для отправки письма с купоном
 * check_order() Функция обработчик конечной точки (маршрута)
 */

error_log(print_r($results, true))

/**
 * Функция для отправки письма с купоном
 * 
 * @param $user_email string почта для отправки
 * @param $coupon_code string код купона
 * @param $results array массив с результатами прохождения анкеты
 * @param $order_id string номер заказа
 * @return void
 * */
function send_coupon_email($user_email, $coupon_code, $results, $order_id) {

    // Преобразование массива с результатами
    $str = '<p><b>Ваш результат</b></p>';
    foreach($results as $value) {
      $tmp = '<p>';
      $tmp .= 'Соль: ' . $value->salt . '<br>';
      $tmp .= $value->description;
      $tmp .= '</p>';
      $str .= $tmp;
    }

    $str .= '<p><b>Как принимать</b></p>';
    foreach($results as $value) {
      $tmp = '<p>';
      $tmp .= $value->prescription_14;
      $tmp .= '</p>';
      $str .= $tmp;
    }

    $subject = 'Ваш купон на скидку';
    $message = '
        <html>
        <head>
            <title>Ваш купон на скидку</title>
        </head>
        <body>
            <p>Здравствуйте!</p>
            <p>Спасибо за ваш запрос. Мы рады предоставить вам одноразовый купон на скидку 10% на любой заказ в нашем магазине. Используйте код купона при оформлении заказа:</p>
            <p><strong>' . $coupon_code . '</strong></p>
            <p>Купон действует в течение 1 месяца.</p>'
            . $str .
            '<p>Номер заказа: ' . $order_id . '</p>
            <p>С уважением,<br> Соли Шюсслера</p>
        </body>
        </html>
    ';
    $headers = array('Content-Type: text/html; charset=UTF-8');
    
    wp_mail($user_email, $subject, $message, $headers);
}

// Cоздание маршрута для проверки заказа
add_action( 'rest_api_init', function(){
    // Пространство имен
    $namespace = 'myplugin/v1';

    // Маршрут
    $route = '/posts/(?P<id>\d+)';

    // Параметры конечной точки (маршрута)
    $route_params = [
        'methods'  => 'GET',
        'callback' => 'check_order',
        'permission_callback' => '__return_true',
    ];

    register_rest_route( $namespace, $route, $route_params );
} );

/**
 * Функция обработчик конечной точки (маршрута)
 * 
 * @param WP_REST_Request $request
 * @return array
 * 
 */
function check_order( WP_REST_Request $request ) {
    global $wpdb;

    // Преобразование символов в html сущности
    $order_id = htmlspecialchars($request['id']);

    // Проверка строки на преобразование в число
    if ( !is_numeric($order_id) ) {
        return [
            'status' => false,
            'error' => 'order_id is not numeric'
        ];
    }

    // Получение объекта заказа WC_Order
    $order = wc_get_order( (int) $order_id );

    if ( $order ) {

        /**
         * Объект загрузок
         * Документация https://wp-kama.ru/plugin/woocommerce/function/WC_Customer_Download_Data_Store
         *
         */
        $WC_Customer_Download_Data_Store = new WC_Customer_Download_Data_Store();

        /**
         * @param string $order_id номер заказа
         * @return array массив с вложенными объектами
         */
        $cdds = $WC_Customer_Download_Data_Store->get_downloads( ['order_id' => $order_id] );

        // Если у этого заказа нет загружаемых товаров
        if ($cdds == []) {
            return [
                'status' => false,
                'error' => 'order have no downloable product'
            ];
        }

        // Счетчик Загрузок осталось
        // Если счетчик Загрузок осталось не установлен, то значение ключа download_remaining будет пустая строка
        // С каждой загрузкой счетчик количества загрузок увеличивается на 1, счетчик Загрузок осталось уменьшается на 1
        // После прохождения анкеты увеличиваю на 1 счетчик количества загрузок. Функция questionnaire_result()
        // В массиве $cdds ключ [0] - первый и единственный товар в этом заказе
        $downloads_remaining = $cdds[0]['data']['downloads_remaining'];

        // Если счетчик Загрузок осталось установлен, то значение ключа download_remaining будет число
        if ($downloads_remaining != '') {
            
            // Счетчик количества загрузок
            $download_count = $cdds[0]['data']['download_count'];

            // Сравнение счетчик количества загрузок со счетчиком Загрузок осталось + 1, то возвращаю ошибку
            if (intval($download_count) > intval($downloads_remaining) + 1) {
                return [
                    'status' => false,
                    'download_count' => 'download count: ' . $download_count,
                    'downloads_remaining' => 'downloads remaining: ' . $downloads_remaining
                ];
            }
        }

        // Дата окончания действия ссылки в формате WC_DateTime
        // Если дата окончания не установлена, то будет пустая строка или null
        $access_expires = $cdds[0]->get_access_expires();

        // Если установлена дата окончания действия
        if ($access_expires) {
            // Преобразование даты окончания и текущей даты в форматах 'Ymd' в число и сравнение чисел
            if (intval(date('Ymd')) > intval($access_expires->format('Ymd'))) {
                return [
                    'status' => false,
                    'error' => 'expires date'
                ];
            }
        }

        // Вставка записи в таблицу custom_api_tokens
        $table_name = $wpdb->prefix . 'custom_api_tokens';

        // Генерация токена
        $token = get_random_string();

        $result = $wpdb->insert(
            $table_name,
            array(
                'order_id' => intval($order_id),
                'token' => $token,
                'created_at' => date("Y-m-d H:i:s"),
            ),
            array('%d', '%s', '%s')
        );

        // Проверяем результат и отправляем ответ
        if ($result == false) {
            return [
                'status' => false,
                'error' => 'have no results'
            ];
        }

        return [
            'status' => true,
            'token' => $token
        ];
    }

    return [
        'status' => false,
        'error' => 'No order object'
    ];
}

?>