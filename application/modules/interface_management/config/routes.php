<?php
defined('BASEPATH') OR exit('No direct script access allowed');


$route['api/services_get'] = 'interface_management/Interface_management_api/services_get';
$route['api/services_add'] = 'interface_management/Interface_management_api/services_add';
$route['api/services_update/(:num)']['put'] = 'interface_management/interface_management_api/services_update/$1';
$route['api/services_delete/(:num)']['delete'] = 'interface_management/interface_management_api/services_delete/$1';
$route['api/services_directory/(:num)'] = 'interface_management/interface_management_api/services_directory/$1';

$route['api/services_import_bulk'] = 'interface_management/interface_management_api/services_import_bulk';

$route['api/services_update_bulk'] = 'interface_management/interface_management_api/services_update_bulk';