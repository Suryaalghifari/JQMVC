<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$route['default_controller'] = 'grid/grid';
$route['grid'] = 'grid/grid/index';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE; 

// Autoload semua route di setiap module HMVC
foreach (glob(APPPATH . 'modules/*/config/routes.php') as $module_route) {
    require $module_route;
}

