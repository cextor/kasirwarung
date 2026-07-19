<?php

namespace App\Controllers;

use App\Models\ProductModel;
use CodeIgniter\RESTful\ResourceController;

class Products extends ResourceController
{
    protected $modelName = ProductModel::class;
    protected $format    = 'json';

    private function toCamelCase(array $product): array
    {
        return [
            'id'               => $product['id'],
            'name'             => $product['name'],
            'barcode'          => $product['barcode'] ?? null,
            'categoryId'       => $product['category_id'],
            'priceRetail'      => (float) $product['price_retail'],
            'priceWholesale'   => (float) $product['price_wholesale'],
            'wholesaleMinQty'  => (int) $product['wholesale_min_qty'],
            'stock'            => (int) $product['stock'],
            'unit'             => $product['unit'],
            'isActive'         => isset($product['is_active']) ? (bool) $product['is_active'] : true,
        ];
    }

    private function toSnakeCase(array $json): array
    {
        $db = [];
        if (isset($json['id'])) $db['id'] = $json['id'];
        if (isset($json['name'])) $db['name'] = $json['name'];
        if (isset($json['barcode'])) $db['barcode'] = $json['barcode'] ?: null;
        if (isset($json['categoryId'])) $db['category_id'] = $json['categoryId'];
        if (isset($json['priceRetail'])) $db['price_retail'] = $json['priceRetail'];
        if (isset($json['priceWholesale'])) $db['price_wholesale'] = $json['priceWholesale'];
        if (isset($json['wholesaleMinQty'])) $db['wholesale_min_qty'] = $json['wholesaleMinQty'];
        if (isset($json['stock'])) $db['stock'] = $json['stock'];
        if (isset($json['unit'])) $db['unit'] = $json['unit'];
        if (isset($json['isActive'])) $db['is_active'] = $json['isActive'] ? 1 : 0;
        return $db;
    }

    // GET /products
    public function index()
    {
        $products = $this->model->where('status_cd', 'normal')->findAll();
        $formatted = array_map([$this, 'toCamelCase'], $products);
        return $this->respond($formatted);
    }

    // GET /products/(:any)
    public function show($id = null)
    {
        $product = $this->model->where('status_cd', 'normal')->find($id);
        if (!$product) {
            return $this->failNotFound('Produk tidak ditemukan');
        }
        return $this->respond($this->toCamelCase($product));
    }

    // POST /products
    public function create()
    {
        $json = $this->request->getJSON(true);
        if (!$json) {
            $json = $this->request->getPost();
        }

        $dbData = $this->toSnakeCase($json);

        // Validation for unique name among normal products
        if (!empty($dbData['name'])) {
            $existingName = $this->model->where('status_cd', 'normal')->where('name', $dbData['name'])->first();
            if ($existingName) {
                return $this->fail('Nama produk sudah digunakan.');
            }
        }

        // Validation for unique barcode among normal products
        if (!empty($dbData['barcode'])) {
            $existingBarcode = $this->model->where('status_cd', 'normal')->where('barcode', $dbData['barcode'])->first();
            if ($existingBarcode) {
                return $this->fail('Kode barcode sudah digunakan oleh produk: ' . $existingBarcode['name']);
            }
        }

        if (!$this->model->insert($dbData)) {
            return $this->fail($this->model->errors());
        }

        $created = $this->model->find($dbData['id']);
        return $this->respondCreated($this->toCamelCase($created), 'Produk berhasil ditambahkan');
    }

    // PUT /products/(:any)
    public function update($id = null)
    {
        $json = $this->request->getJSON(true);
        if (!$json) {
            $json = $this->request->getRawInput();
        }

        if (!$this->model->where('status_cd', 'normal')->find($id)) {
            return $this->failNotFound('Produk tidak ditemukan');
        }

        $dbData = $this->toSnakeCase($json);

        // Validation for unique name among other normal products
        if (!empty($dbData['name'])) {
            $existingName = $this->model->where('status_cd', 'normal')
                                        ->where('name', $dbData['name'])
                                        ->where('id !=', $id)
                                        ->first();
            if ($existingName) {
                return $this->fail('Nama produk sudah digunakan.');
            }
        }

        // Validation for unique barcode among other normal products
        if (!empty($dbData['barcode'])) {
            $existingBarcode = $this->model->where('status_cd', 'normal')
                                           ->where('barcode', $dbData['barcode'])
                                           ->where('id !=', $id)
                                           ->first();
            if ($existingBarcode) {
                return $this->fail('Kode barcode sudah digunakan oleh produk: ' . $existingBarcode['name']);
            }
        }

        if (!$this->model->update($id, $dbData)) {
            return $this->fail($this->model->errors());
        }

        $updated = $this->model->find($id);
        return $this->respond($this->toCamelCase($updated), 200, 'Produk berhasil diperbarui');
    }

    // DELETE /products/(:any)
    public function delete($id = null)
    {
        $product = $this->model->where('status_cd', 'normal')->find($id);
        if (!$product) {
            return $this->failNotFound('Produk tidak ditemukan');
        }

        $this->model->update($id, ['status_cd' => 'nullified']);
        return $this->respondDeleted(['id' => $id], 'Produk berhasil dihapus');
    }
}
