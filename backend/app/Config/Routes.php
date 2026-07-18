<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

$routes->group('api', function ($routes) {
    $routes->options('(:any)', 'Home::options');
    $routes->resource('categories', ['controller' => 'Categories']);
    $routes->resource('products', ['controller' => 'Products']);
    $routes->resource('sales', ['controller' => 'Sales']);
    $routes->get('settings', 'Settings::index');
    $routes->post('settings', 'Settings::create');
});
