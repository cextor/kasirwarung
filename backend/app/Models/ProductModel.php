<?php

namespace App\Models;

use CodeIgniter\Model;

class ProductModel extends Model
{
    protected $table            = 'products';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = false;
    protected $returnType       = 'array';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'id', 'name', 'barcode', 'category_id', 'price_retail', 
        'price_wholesale', 'wholesale_min_qty', 'stock', 'unit', 'is_active', 'status_cd'
    ];

    // Validation
    protected $validationRules      = [
        'id'                => 'required|max_length[50]',
        'name'              => 'required|max_length[150]',
        'category_id'       => 'required|max_length[50]',
        'price_retail'      => 'required|numeric',
        'price_wholesale'   => 'required|numeric',
        'wholesale_min_qty' => 'required|integer',
        'stock'             => 'required|integer',
        'unit'              => 'required|max_length[20]',
        'is_active'         => 'permit_empty|in_list[0,1]',
        'status_cd'         => 'permit_empty|in_list[normal,nullified]',
    ];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;
}
