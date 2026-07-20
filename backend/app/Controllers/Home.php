<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index()
    {
        $filePath = FCPATH . 'index.html';
        if (file_exists($filePath)) {
            return file_get_contents($filePath);
        }
        return view('api_documentation');
    }

    public function options()
    {
        return $this->response->setStatusCode(200)
                              ->setContentType('application/json')
                              ->setBody(json_encode([]));
    }
}
