<?php

namespace App\Models;

use CodeIgniter\Model;

class SaleItemModel extends Model
{
    protected $table            = 'sale_items';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'sale_id', 'product_id', 'name', 'price', 
        'quantity', 'price_type', 'subtotal'
    ];

    // Validation
    protected $validationRules      = [
        'sale_id'    => 'required|max_length[50]',
        'product_id' => 'permit_empty|max_length[50]',
        'name'       => 'required|max_length[150]',
        'price'      => 'required|numeric',
        'quantity'   => 'required|integer',
        'price_type' => 'required|max_length[20]',
        'subtotal'   => 'required|numeric',
    ];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;
}
