<?php

namespace App\Controllers;

use App\Models\SettingModel;
use CodeIgniter\RESTful\ResourceController;

class Settings extends ResourceController
{
    protected $modelName = SettingModel::class;
    protected $format    = 'json';

    // GET /settings
    public function index()
    {
        $settings = $this->model->findAll();
        $data = [
            'shopName'    => 'WARUNG SEJAHTERA',
            'shopAddress' => 'Kec. Sukamaju, Jawa Barat'
        ];

        foreach ($settings as $setting) {
            if ($setting['key'] === 'shop_name') {
                $data['shopName'] = $setting['value'];
            } elseif ($setting['key'] === 'shop_address') {
                $data['shopAddress'] = $setting['value'];
            }
        }

        return $this->respond($data);
    }

    // POST /settings
    public function create()
    {
        $json = $this->request->getJSON(true);
        if (!$json) {
            return $this->fail('Invalid settings data');
        }

        if (isset($json['shopName'])) {
            $this->model->save([
                'key'   => 'shop_name',
                'value' => $json['shopName']
            ]);
        }

        if (isset($json['shopAddress'])) {
            $this->model->save([
                'key'   => 'shop_address',
                'value' => $json['shopAddress']
            ]);
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'Profil warung berhasil diperbarui'
        ]);
    }
}
