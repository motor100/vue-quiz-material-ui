<?php

/**
 * Квиз по подбору Цветов Баха Flowers Bach Quiz
 * 
 * fbq_result() Функция сохранения результатов анкеты 
 * view_fbq_results() Добавление нового элемента меню в админку для вывода результатов анкеты
 * view_fbq_results_callback() Callback функция Вывод html результатов анкеты в админке 
 * all_fbq_results_html() Функция для вывода html и показа последних 50 анкет в админке 
 * single_fbq_results_html() single_fbq_results_html
 */

/**
 * Функция сохранения результатов анкеты 
 * 
 * @param WP_REST_Request $request
 * @return array
 */
function fbq_result( WP_REST_Request $request ) {
    global $wpdb;

    // Безопасное приведение ID к числу, так как регулярное выражение \d+ уже проверило параметр
    $order_id = (int) $request['id'];

    // Проверка строки на преобразование в число
    if ( !is_numeric($order_id) ) {
        return [
            'status' => false,
            'error' => 'order_id is not numeric'
        ];
    }

    // Проверка content_type
    $content_type = $request->get_content_type();
    if ($content_type['value'] != 'application/json') {
        return [
            'status' => false,
            'error' => 'content type is not application/json'
        ];
    }

    // Получение параметра token
    $data_params = $request->get_json_params();
    $token = !empty($data_params['token']) ? sanitize_text_field($data_params['token']) : sanitize_text_field($request->get_param('token'));

    // Проверка параметра token
    if ( !$token ) {
        return [
            'status' => false,
            'error' => 'token is required'
        ];
    }

    // Получение записи из таблицы custom_api_tokens с условиями order_id и token
    $table_name = $wpdb->prefix . 'custom_api_tokens';

    $result_token = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE order_id = %d AND token = %s", $order_id, $token), ARRAY_A);

    // Проверка результатов
    if ( !$result_token ) {
        return [
            'status' => false,
            'error' => 'order_id and token not found in db'
        ];
    }

    // Удаление записи из таблицы custom_api_tokens с условиями order_id и token
    $wpdb->delete($table_name, ["order_id" => $order_id], ["%d"]);

    // Получение json из запроса
    $data = $request->get_json_params();

    // Вставка в таблицу
    $table_name = $wpdb->prefix . 'fbq_results';

    $result = $wpdb->insert(
        $table_name,
        array(
            'order_id' => $order_id,
            'firstname' => $data['customer']['firstName'],
            // 'secondname' => $data['customer']['secondName'],
            'secondname' => '', // отчество убрано
            'lastname' => $data['customer']['lastName'],
            'email' => $data['customer']['email'],
            // 'phone' => $data['customer']['phone'],
            'phone' => '', // телефон убран
            'checkboxes' => json_encode($data['checkboxes']),
            'results' => json_encode($data['results']),
            'created_at' => date("Y-m-d H:i:s"),
        ),
        array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')
    );

    // Проверяем результат и отправляем ответ
    if ($result == false) {
        return [
            'status' => false,
            'error' => 'data not insert to db',
        ];
    }

    // Обновление счетчика количества загрузок товара. Увеличение на 1
    // Создание объекта WC_Customer_Download_Data_Store
    $WC_Customer_Download_Data_Store = new WC_Customer_Download_Data_Store();

    // Получение загрузок
    $cdds = $WC_Customer_Download_Data_Store->get_downloads( ['order_id' => $order_id] );
    
    // В массиве $cdds ключ [0] - первый и единственный товар в этом заказе
    $download_count = $cdds[0]['data']['download_count'];

    // Название таблицы
    $table_name = $wpdb->prefix . 'woocommerce_downloadable_product_permissions';

    // Обновление количества загрузок
    $result = $wpdb->update(
        $table_name,
        array('download_count' => intval($download_count) + 1), // Новое значение download_count bigint
        array('order_id' => $order_id), // Условие where для обновления bigint
        array('%d'), // Формат для download_count bigint
        array('%d')  // формат для order_id (ОБЯЗАТЕЛЬНО)
    );

    // Генерация купона
    $coupon_code = create_discount_coupon($data['customer']['email'], 'DISCOUNT_', 10);

    // Создание объекта заказа для замены старого номера заказа на новый
    // Документация https://misha.agency/woocommerce/wc_order.html
    $order = wc_get_order( $order_id );

    // Проверка заказа
    if ( ! $order ) {
        return [ 'status' => false, 'error' => 'Order not found' ];
    }
    
    // Отправка email пользователю
    // Старый номер заказа
    send_coupon_email($data['customer']['email'], $coupon_code, $data['results'], $order_id);

    // Новый номер заказа
    //send_coupon_email($data['customer']['email'], $coupon_code, $data['results'], $order->get_order_number());

    // Отправка email админу
    // Старый номер заказа
    send_coupon_email('info@naturapharma.ru', $coupon_code, $data['results'], $order_id);

    // Новый номер заказа
    //send_coupon_email('info@naturapharma.ru', $coupon_code, $data['results'], $order->get_order_number());

    return ['status' => true];
}

// Cоздание маршрута для сохранения результатов анкеты
add_action( 'rest_api_init', function(){
    // Пространство имен
    $namespace = 'myplugin/v1';

    // Маршрут
    $route = '/authors-fbq/(?P<id>\d+)';

    // Параметры конечной точки (маршрута)
    $route_params = [
        'methods'  => 'POST',
        'callback' => 'fbq_result',
        'permission_callback' => '__return_true',
        'args' => array(
            'token' => array(
                'required' => true,  // является ли параметр обязательным. Может быть только true
            )
        ),
    ];

    register_rest_route( $namespace, $route, $route_params );
} );

// Добавление нового элемента меню для вывода результатов анкеты
function view_fbq_results() {

    add_menu_page(
        'Результаты анкеты Цветы Баха', // тайтл страницы
        'Анкета цветы', // текст ссылки в меню
        'manage_options', // права пользователя, необходимые для доступа к странице
        'fbq-results', // ярлык страницы
        'view_fbq_results_callback', // функция, которая выводит содержимое страницы
        'dashicons-images-alt2', // иконка, в данном случае из Dashicons
        101 // позиция в меню
    );
}

add_action( 'admin_menu', 'view_fbq_results', 25 );


// Вывод html результатов анкеты в админке 
function view_fbq_results_callback() {
    // Если есть параметр id, то показываю страницу анкеты по id
    if (!empty($_REQUEST['id']) && $_REQUEST['id']!='-1') {
        single_fbq_results_html($_REQUEST['id']);
    } else { // Иначе показываю список последних 50 анкет
        all_fbq_results_html();
    }
}

// Функция для вывода html и показа последних 50 анкет в админке 
function all_fbq_results_html() {
    global $wpdb;

    $table_name = $wpdb->prefix . 'fbq_results';

    // Выполняем запрос для получения данных
    $results = $wpdb->get_results("SELECT * FROM $table_name ORDER BY id DESC LIMIT 50", ARRAY_A);

    echo '<div class="wrap"><h2>' . get_admin_page_title() . '</h2>';
    echo '<table class="wp-list-table widefat fixed striped table-view-list">';
    echo '<thead><tr><td width="80px">№</td><td>Заголовок</td><td>Дата</td></tr></thead>';
    echo '<tbody>';

    foreach($results as $value) {
        echo '<tr>';
        echo '<td>' . $value['order_id'] . '</td>';
        echo '<td class="title column-title has-row-actions column-primary page-title">' ;
        $url = esc_url(get_admin_url(null, 'admin.php?page=fbq-results') . '&id=' . $value['id']);
        echo '<strong><a href="' . $url . '" class="row-title">' . $value['firstname'] . ' ' . $value['lastname'] . '</a></strong>';
        echo '</td>';
        $created_at = strtotime($value['created_at']);
        echo '<td>' . date("d-m-Y", $created_at) . '</td>';
        echo '</tr>';
    }

    echo '</tbody>';
    echo '</table>';
    echo '</div>';
}

/**
 * Функция для вывода html и показа одной анкеты по id
 * 
 * @param int $id
 * @return string
 * 
 * В этой функции echo вместо return
 */
function single_fbq_results_html($id) {
    global $wpdb;

    $table_name = $wpdb->prefix . 'fbq_results';

    // Выполняем запрос для получения данных
    $results = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id), ARRAY_A);

    // Преобразование массива с результатами
    $results_array = json_decode($results['results']);
    $results_html = '';
    $results_html .= '<p><b>Ваш результат</b></p>';
    foreach($results_array as $value) {
        $tmp = '<p>';
        $tmp .= 'Соль: ' . $value->salt . '<br>';
        $tmp .= $value->description;
        $tmp .= '</p>';
        $results_html .= $tmp;
    }

    $results_html .= '<p><b>Как принимать</b></p>';
    foreach($results_array as $value) {
        $tmp = '<p>';
        $tmp .= $value->prescription_14;
        $tmp .= '</p>';
        $results_html .= $tmp;
    }

    // Преобразование массива с отмеченными чекбоксами
    $checkboxes_array = json_decode($results['checkboxes']);
    $checkboxes_html = '';
    foreach($checkboxes_array as $value) {
        $tmp = '<h4>' . $value->title . '</h4>';
        foreach($value->sections as $section) {
            $tmp .= '<p>' . $section->title . '</p>';
            $tmp .= '<ol>';
            foreach($section->checked as $checbox) {
                $tmp .= '<li>' . $checbox . '</li>';
            }
            $tmp .= '</ol>';
        }
        $checkboxes_html .= $tmp;
    }

    $order = wc_get_order( $results['order_id'] );

    echo '<div class="wrap"><h2>Анкета по подбору Цветов Баха</h2>';
    echo '<p>Номер заказа ' . $results['order_id'] . '</p>';
    // Добавление нового номера заказа
    // Если нового номера заказа нет, то метод $order->get_order_number() вернет id заказа по умолчанию
    echo '<p>Новый номер заказа ' . $order->get_order_number() . '</p>';
    echo '<p>Имя ' . esc_html($results['firstname']) . '</p>';
    // echo '<p>Отчество ' . esc_html($results['secondname']) . '</p>';
    echo '<p>Фамилия ' . esc_html($results['lastname']) . '</p>';
    echo '<p>Email ' . esc_html($results['email']) . '</p>';
    // echo '<p>Телефон ' . esc_html($results['phone']) . '</p>';
    $created_at = strtotime($results['created_at']);
    echo '<p>Дата ' . date("d-m-Y", $created_at) . '</p>';
    echo $results_html;
    echo $checkboxes_html;    
}

?>