<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$route['default_controller'] = 'interface_management/interface_management';
$route['interface_management'] = 'interface_management/interface_management/index';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE; 


// Autoload semua route di setiap module HMVC
foreach (glob(APPPATH . 'modules/*/config/routes.php') as $module_route) {
    require $module_route;
}

