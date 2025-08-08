<?php
defined('BASEPATH') OR exit('No direct script access allowed');
$route['api/services_get'] = 'grid/grid_api/services_get';
$route['api/services_add'] = 'grid/grid_api/services_add';
$route['api/services_update/(:num)']['put'] = 'grid/grid_api/services_update/$1';
$route['api/services_delete/(:num)']['delete'] = 'grid/grid_api/services_delete/$1';
$route['api/services_directory/(:num)'] = 'grid/grid_api/services_directory/$1';
