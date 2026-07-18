<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index(): string
    {
        return view('welcome_message');
    }

    public function options()
    {
        return $this->response->setStatusCode(200)
                              ->setContentType('application/json')
                              ->setBody(json_encode([]));
    }
}
