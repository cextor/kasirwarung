<?php

namespace App\Controllers;

use App\Models\SaleModel;
use App\Models\SaleItemModel;
use App\Models\ProductModel;
use CodeIgniter\RESTful\ResourceController;

class Sales extends ResourceController
{
    protected $modelName = SaleModel::class;
    protected $format    = 'json';

    // GET /sales
    public function index()
    {
        $sales = $this->model->orderBy('timestamp', 'DESC')->findAll();
        
        $saleItemModel = new SaleItemModel();
        $allItems = $saleItemModel->findAll();

        // Group items by sale_id
        $itemsBySale = [];
        foreach ($allItems as $item) {
            $itemsBySale[$item['sale_id']][] = [
                'productId' => $item['product_id'],
                'name'      => $item['name'],
                'price'     => (float) $item['price'],
                'quantity'  => (int) $item['quantity'],
                'priceType' => $item['price_type'],
                'subtotal'  => (float) $item['subtotal']
            ];
        }

        $formatted = [];
        foreach ($sales as $sale) {
            $formatted[] = [
                'id'            => $sale['id'],
                'invoiceNumber' => $sale['invoice_number'],
                'timestamp'     => $sale['timestamp'],
                'items'         => $itemsBySale[$sale['id']] ?? [],
                'totalAmount'   => (float) $sale['total_amount'],
                'cashPaid'      => (float) $sale['cash_paid'],
                'changeDue'     => (float) $sale['change_due'],
                'paymentMethod' => $sale['payment_method'],
            ];
        }

        return $this->respond($formatted);
    }

    // POST /sales
    public function create()
    {
        $json = $this->request->getJSON(true);
        if (!$json) {
            return $this->fail('Invalid transaction data');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // 1. Insert into Sales
        $saleData = [
            'id'             => $json['id'],
            'invoice_number' => $json['invoiceNumber'],
            'timestamp'      => $json['timestamp'] ?? date('Y-m-d H:i:s'),
            'total_amount'   => $json['totalAmount'],
            'cash_paid'      => $json['cashPaid'],
            'change_due'     => $json['changeDue'],
            'payment_method' => $json['paymentMethod'],
        ];

        if (!$this->model->insert($saleData)) {
            $db->transRollback();
            return $this->fail($this->model->errors());
        }

        // 2. Insert into Sale Items & update Product Stock
        $saleItemModel = new SaleItemModel();
        $productModel  = new ProductModel();

        foreach ($json['items'] as $item) {
            $itemData = [
                'sale_id'    => $json['id'],
                'product_id' => $item['productId'],
                'name'       => $item['name'],
                'price'      => $item['price'],
                'quantity'   => $item['quantity'],
                'price_type' => $item['priceType'],
                'subtotal'   => $item['subtotal'],
            ];

            if (!$saleItemModel->insert($itemData)) {
                $db->transRollback();
                return $this->fail($saleItemModel->errors());
            }

            // Decrement product stock if product_id is valid
            if (!empty($item['productId'])) {
                $product = $productModel->find($item['productId']);
                if ($product) {
                    $newStock = max(0, $product['stock'] - $item['quantity']);
                    $productModel->update($item['productId'], ['stock' => $newStock]);
                }
            }
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('Gagal memproses transaksi penjualan.');
        }

        return $this->respondCreated($json, 'Transaksi berhasil disimpan.');
    }

    // DELETE /sales/(:any) (Cancel Sale)
    public function delete($id = null)
    {
        if (!$this->model->find($id)) {
            return $this->failNotFound('Transaksi tidak ditemukan.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        $saleItemModel = new SaleItemModel();
        $productModel  = new ProductModel();

        // 1. Restore stock of all sold items
        $items = $saleItemModel->where('sale_id', $id)->findAll();
        foreach ($items as $item) {
            if (!empty($item['product_id'])) {
                $product = $productModel->find($item['product_id']);
                if ($product) {
                    $newStock = $product['stock'] + $item['quantity'];
                    $productModel->update($item['product_id'], ['stock' => $newStock]);
                }
            }
        }

        // 2. Delete the Sale (cascade deletes sale items in database)
        $this->model->delete($id);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('Gagal membatalkan transaksi.');
        }

        return $this->respondDeleted(['id' => $id], 'Transaksi berhasil dibatalkan dan stok dikembalikan.');
    }
}
